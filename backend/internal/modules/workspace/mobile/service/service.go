package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	attendancemodels "hrgo/backend/internal/modules/workspace/attendance/models"
	authmodels "hrgo/backend/internal/modules/workspace/auth/models"
	"hrgo/backend/internal/modules/workspace/mobile/mapper"
	"hrgo/backend/internal/modules/workspace/mobile/models"
	"hrgo/backend/internal/modules/workspace/mobile/repository"
	"hrgo/backend/internal/modules/workspace/mobile/request"
	"hrgo/backend/internal/modules/workspace/mobile/response"
	shiftmodels "hrgo/backend/internal/modules/workspace/shift/models"
	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/security"
)

const mobileSessionDuration = 30 * 24 * time.Hour

type SessionMetadata struct {
	IPAddress *string
	UserAgent *string
}

type Service interface {
	Login(ctx context.Context, req request.MobileLoginRequest, meta ...SessionMetadata) (*response.MobileLoginResponse, *apperrors.Error)
	ChangePassword(ctx context.Context, accountID string, req request.MobileChangePasswordRequest) *apperrors.Error
	GetProfile(ctx context.Context, accountID, orgID, employeeID string) (*response.MobileUserProfile, *apperrors.Error)
	GetShift(ctx context.Context, orgID, employeeID string) (*response.MobileShiftResponse, *apperrors.Error)
	GetTodayAttendance(ctx context.Context, orgID, employeeID string) (*response.MobileTodayResponse, *apperrors.Error)
	CheckIn(ctx context.Context, orgID, employeeID string, req request.MobilePunchRequest) (*response.MobileAttendanceRecordResponse, *apperrors.Error)
	CheckOut(ctx context.Context, orgID, employeeID string, req request.MobilePunchRequest) (*response.MobileAttendanceRecordResponse, *apperrors.Error)
	ListAttendanceHistory(ctx context.Context, orgID, employeeID string, q request.MobileAttendanceHistoryQuery) (*response.MobileAttendanceListResponse, *apperrors.Error)
	GetCalendar(ctx context.Context, orgID, employeeID string, q request.MobileCalendarQuery) (*response.MobileCalendarResponse, *apperrors.Error)
	SubmitCorrection(ctx context.Context, orgID, employeeID string, req request.MobileCorrectionRequest) (*response.MobileCorrectionResponse, *apperrors.Error)
	ListCorrections(ctx context.Context, orgID, employeeID string, q request.ListMobileCorrectionsQuery) (*response.MobileCorrectionListResponse, *apperrors.Error)
	SyncOfflinePunches(ctx context.Context, orgID, employeeID string, req request.MobileSyncRequest) (*response.MobileSyncResponse, *apperrors.Error)
}

type service struct {
	repo    repository.Repository
	tokens  *security.TokenManager
	lockout *security.LockoutManager
}

func New(repo repository.Repository, tokens *security.TokenManager, lockout ...*security.LockoutManager) Service {
	var lm *security.LockoutManager
	if len(lockout) > 0 && lockout[0] != nil {
		lm = lockout[0]
	} else {
		lm = security.NewLockoutManager(5, 15*time.Minute)
	}
	return &service{repo: repo, tokens: tokens, lockout: lm}
}

func (s *service) Login(ctx context.Context, req request.MobileLoginRequest, meta ...SessionMetadata) (*response.MobileLoginResponse, *apperrors.Error) {
	ident := strings.TrimSpace(req.Identifier)
	if s.lockout != nil && s.lockout.IsLocked(ident) {
		return nil, apperrors.TooManyRequests("Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.")
	}

	acc, err := s.repo.FindAccountByIdentifier(ctx, req.OrganizationCode, req.Identifier)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if acc == nil || !security.CheckPassword(acc.PasswordHash, req.Password) {
		if s.lockout != nil {
			if locked := s.lockout.RecordFailure(ident); locked {
				return nil, apperrors.TooManyRequests("Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.")
			}
		}
		return nil, apperrors.Unauthorized("Invalid employee identifier or password.")
	}

	if s.lockout != nil {
		s.lockout.Reset(ident)
	}

	now := time.Now().UTC()
	if acc.Organization.DeletedAt != nil {
		return nil, apperrors.Forbidden("Organization has been deleted. Mobile access is disabled.")
	}
	if acc.Organization.Status != "ACTIVE" {
		return nil, apperrors.Forbidden("Organization is " + strings.ToLower(acc.Organization.Status) + ". Mobile access is disabled.")
	}
	if acc.Organization.ScheduledSuspendAt != nil && !now.Before(*acc.Organization.ScheduledSuspendAt) {
		return nil, apperrors.Forbidden("Organization has been suspended. Mobile access is disabled.")
	}
	if acc.Status != "ACTIVE" {
		return nil, apperrors.Forbidden("Employee account is " + strings.ToLower(acc.Status) + ".")
	}

	perms := extractUserPermissions(acc.UserRoles)
	hasMobileAccess := false
	for _, p := range perms {
		if p == "org.mobile.access" || p == "org.all" {
			hasMobileAccess = true
			break
		}
	}
	if !hasMobileAccess {
		return nil, apperrors.Forbidden("Mobile self-service access is not granted for your role.")
	}

	emp, profile, _ := s.repo.GetEmployeeFullDetails(ctx, acc.OrganizationID, acc.EmployeeID)
	posHistory, _ := s.repo.ListPositionHistory(ctx, acc.OrganizationID, acc.EmployeeID)

	var branchID, deptID string
	if emp != nil {
		if emp.BranchID != nil {
			branchID = *emp.BranchID
		}
		if emp.DepartmentID != nil {
			deptID = *emp.DepartmentID
		}
	} else if len(acc.UserRoles) > 0 {
		if acc.UserRoles[0].BranchID != nil {
			branchID = *acc.UserRoles[0].BranchID
		}
		if acc.UserRoles[0].DepartmentID != nil {
			deptID = *acc.UserRoles[0].DepartmentID
		}
	}

	sessionID := uuid.NewString()
	token, expSeconds, err := s.tokens.GenerateWorkspaceTokenWithExpiry(
		sessionID,
		acc.ID,
		acc.OrganizationID,
		acc.EmployeeID,
		acc.Employee.EmployeeCode,
		branchID,
		deptID,
		perms,
		mobileSessionDuration,
	)
	if err != nil {
		return nil, apperrors.Internal()
	}

	var ipAddr, userAgent *string
	if len(meta) > 0 {
		ipAddr = meta[0].IPAddress
		userAgent = meta[0].UserAgent
	}

	session := &authmodels.WorkspaceSession{
		ID:             sessionID,
		OrganizationID: acc.OrganizationID,
		AccountID:      acc.ID,
		IPAddress:      ipAddr,
		UserAgent:      userAgent,
		CreatedAt:      now,
		ExpiresAt:      now.Add(time.Duration(expSeconds) * time.Second),
	}
	if err := s.repo.CreateSession(ctx, session); err != nil {
		return nil, apperrors.Internal()
	}

	_ = s.repo.UpdateLastLogin(ctx, acc.ID)

	devName := strings.TrimSpace(req.DeviceName)
	var devNamePtr *string
	if devName != "" {
		devNamePtr = &devName
	}
	device := &models.MobileDevice{
		OrganizationID:        acc.OrganizationID,
		OrganizationAccountID: acc.ID,
		DeviceIdentifier:      strings.TrimSpace(req.DeviceIdentifier),
		DeviceName:            devNamePtr,
		Status:                "ACTIVE",
		UpdatedAt:             now,
	}
	if err := s.repo.UpsertDevice(ctx, device); err != nil {
		return nil, apperrors.Internal()
	}

	userProfile := mapper.ToMobileUserProfile(acc, emp, profile, posHistory, perms)
	deviceResp := mapper.ToMobileDeviceResponse(device)

	return &response.MobileLoginResponse{
		AccessToken:        token,
		TokenType:          "Bearer",
		ExpiresIn:          expSeconds,
		MustChangePassword: acc.MustChangePassword,
		User:               userProfile,
		Device:             deviceResp,
	}, nil
}

func (s *service) ChangePassword(ctx context.Context, accountID string, req request.MobileChangePasswordRequest) *apperrors.Error {
	acc, err := s.repo.FindAccountByID(ctx, accountID)
	if err != nil {
		return apperrors.Internal()
	}
	if acc == nil {
		return apperrors.NotFound("Account not found.")
	}

	if !security.CheckPassword(acc.PasswordHash, req.OldPassword) {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "oldPassword", Message: "Incorrect current password."},
		})
	}

	if err := security.ValidatePasswordStrength(req.NewPassword); err != nil {
		return apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "newPassword", Message: err.Error()},
		})
	}

	hash, err := security.HashPassword(req.NewPassword)
	if err != nil {
		return apperrors.Internal()
	}

	if err := s.repo.UpdatePassword(ctx, acc.ID, hash); err != nil {
		return apperrors.Internal()
	}
	return nil
}

func (s *service) GetProfile(ctx context.Context, accountID, orgID, employeeID string) (*response.MobileUserProfile, *apperrors.Error) {
	acc, err := s.repo.FindAccountByID(ctx, accountID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if acc == nil || acc.OrganizationID != orgID {
		return nil, apperrors.NotFound("Account not found.")
	}

	emp, profile, err := s.repo.GetEmployeeFullDetails(ctx, orgID, employeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if emp == nil {
		return nil, apperrors.NotFound("Employee profile not found.")
	}

	posHistory, err := s.repo.ListPositionHistory(ctx, orgID, employeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}

	perms := extractUserPermissions(acc.UserRoles)
	res := mapper.ToMobileUserProfile(acc, emp, profile, posHistory, perms)
	return &res, nil
}

func (s *service) GetShift(ctx context.Context, orgID, employeeID string) (*response.MobileShiftResponse, *apperrors.Error) {
	loc := s.resolveOrgLocation(ctx, orgID)
	nowLocal := time.Now().In(loc)
	today := time.Date(nowLocal.Year(), nowLocal.Month(), nowLocal.Day(), 0, 0, 0, 0, time.UTC)

	shift, err := s.repo.GetAssignedShift(ctx, orgID, employeeID, today)
	if err != nil {
		return nil, apperrors.Internal()
	}

	grace, _ := s.repo.GetGracePeriodMinutes(ctx, orgID)
	workDays, _ := s.repo.GetWorkDays(ctx, orgID)
	return mapper.ToMobileShiftResponse(shift, grace, workDays), nil
}

func (s *service) GetTodayAttendance(ctx context.Context, orgID, employeeID string) (*response.MobileTodayResponse, *apperrors.Error) {
	loc := s.resolveOrgLocation(ctx, orgID)
	nowLocal := time.Now().In(loc)
	today := time.Date(nowLocal.Year(), nowLocal.Month(), nowLocal.Day(), 0, 0, 0, 0, time.UTC)
	todayStr := today.Format("2006-01-02")

	record, err := s.repo.GetTodayAttendance(ctx, orgID, employeeID, today)
	if err != nil {
		return nil, apperrors.Internal()
	}

	shift, _ := s.repo.GetAssignedShift(ctx, orgID, employeeID, today)
	grace, _ := s.repo.GetGracePeriodMinutes(ctx, orgID)
	workDays, _ := s.repo.GetWorkDays(ctx, orgID)
	shiftResp := mapper.ToMobileShiftResponse(shift, grace, workDays)

	emp, _ := s.repo.FindEmployeeByID(ctx, employeeID)
	var branchID *string
	if emp != nil {
		branchID = emp.BranchID
	}
	holidays, _ := s.repo.GetMonthlyHolidays(ctx, orgID, branchID, today, today)
	isHoliday := len(holidays) > 0
	var holidayName *string
	if isHoliday {
		holidayName = &holidays[0].HolidayName
	}

	if record == nil || record.CheckIn == nil {
		status := "NOT_CHECKED_IN"
		if isHoliday {
			status = "HOLIDAY"
		}
		return &response.MobileTodayResponse{
			AttendanceDate: todayStr,
			Status:         status,
			WorkMinutes:    0,
			Shift:          shiftResp,
			IsHoliday:      isHoliday,
			HolidayName:    holidayName,
		}, nil
	}

	status := "WORKING"
	if record.CheckOut != nil {
		status = record.AttendanceStatus
		if status == "" {
			status = "PRESENT"
		}
	}

	return &response.MobileTodayResponse{
		AttendanceDate: todayStr,
		Status:         status,
		CheckInTime:    mapper.FormatTime(record.CheckIn),
		CheckOutTime:   mapper.FormatTime(record.CheckOut),
		WorkMinutes:    record.WorkedMinutes,
		Shift:          shiftResp,
		IsHoliday:      isHoliday,
		HolidayName:    holidayName,
	}, nil
}

func (s *service) CheckIn(ctx context.Context, orgID, employeeID string, req request.MobilePunchRequest) (*response.MobileAttendanceRecordResponse, *apperrors.Error) {
	loc := s.resolveOrgLocation(ctx, orgID)
	nowUTC := time.Now().UTC()
	nowLocal := nowUTC.In(loc)
	attendanceDate := time.Date(nowLocal.Year(), nowLocal.Month(), nowLocal.Day(), 0, 0, 0, 0, time.UTC)

	record, err := s.repo.GetTodayAttendance(ctx, orgID, employeeID, attendanceDate)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if record != nil && record.CheckIn != nil {
		return nil, apperrors.Conflict("Already checked in for today.")
	}

	shift, _ := s.repo.GetAssignedShift(ctx, orgID, employeeID, attendanceDate)
	grace, _ := s.repo.GetGracePeriodMinutes(ctx, orgID)

	var shiftID *string
	var shiftName string
	lateMinutes := 0
	status := "PRESENT"

	if shift != nil {
		shiftID = &shift.ID
		shiftName = shift.ShiftName
		lateMinutes = calculateLateMinutes(nowUTC, shift, loc, grace)
		if lateMinutes > 0 {
			status = "LATE"
		}
	}

	remarks := buildRemarks(req.Address, req.Notes)

	if record == nil {
		record = &attendancemodels.AttendanceRecord{
			ID:               uuid.NewString(),
			OrganizationID:   orgID,
			EmployeeID:       employeeID,
			ShiftID:          shiftID,
			ShiftName:        shiftName,
			AttendanceDate:   attendanceDate,
			CheckIn:          &nowUTC,
			AttendanceStatus: status,
			LateMinutes:      lateMinutes,
			Source:           "MOBILE",
			Remarks:          remarks,
			CreatedAt:        nowUTC,
			UpdatedAt:        nowUTC,
		}
	} else {
		record.CheckIn = &nowUTC
		record.ShiftID = shiftID
		record.ShiftName = shiftName
		record.AttendanceStatus = status
		record.LateMinutes = lateMinutes
		record.Source = "MOBILE"
		record.Remarks = remarks
		record.UpdatedAt = nowUTC
	}

	if err := s.repo.SaveAttendance(ctx, record); err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToMobileAttendanceRecordResponse(record)
	return &res, nil
}

func (s *service) CheckOut(ctx context.Context, orgID, employeeID string, req request.MobilePunchRequest) (*response.MobileAttendanceRecordResponse, *apperrors.Error) {
	loc := s.resolveOrgLocation(ctx, orgID)
	nowUTC := time.Now().UTC()
	nowLocal := nowUTC.In(loc)
	attendanceDate := time.Date(nowLocal.Year(), nowLocal.Month(), nowLocal.Day(), 0, 0, 0, 0, time.UTC)

	record, err := s.repo.GetTodayAttendance(ctx, orgID, employeeID, attendanceDate)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if record == nil || record.CheckIn == nil {
		return nil, apperrors.BadRequest("Cannot check out without a previous check-in for today.")
	}
	if record.CheckOut != nil {
		return nil, apperrors.Conflict("Already checked out for today.")
	}

	record.CheckOut = &nowUTC
	diff := nowUTC.Sub(*record.CheckIn)
	worked := int(diff.Minutes())
	if worked < 0 {
		worked = 0
	}

	shift, _ := s.repo.GetAssignedShift(ctx, orgID, employeeID, attendanceDate)
	if shift != nil && shift.BreakMinutes > 0 && worked > shift.BreakMinutes {
		worked -= shift.BreakMinutes
	}
	record.WorkedMinutes = worked

	if shift != nil {
		earlyLeave := calculateEarlyLeaveMinutes(nowUTC, shift, loc)
		record.EarlyLeaveMinutes = earlyLeave
		if earlyLeave > 0 && record.AttendanceStatus == "PRESENT" {
			record.AttendanceStatus = "EARLY_LEAVE"
		}
	}

	if req.Notes != nil && *req.Notes != "" {
		cur := ""
		if record.Remarks != nil {
			cur = *record.Remarks + "; "
		}
		combined := cur + "Checkout notes: " + *req.Notes
		record.Remarks = &combined
	}

	record.UpdatedAt = nowUTC
	if err := s.repo.SaveAttendance(ctx, record); err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToMobileAttendanceRecordResponse(record)
	return &res, nil
}

func (s *service) ListAttendanceHistory(ctx context.Context, orgID, employeeID string, q request.MobileAttendanceHistoryQuery) (*response.MobileAttendanceListResponse, *apperrors.Error) {
	records, total, err := s.repo.ListAttendanceHistory(ctx, orgID, employeeID, q)
	if err != nil {
		return nil, apperrors.Internal()
	}

	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))
	if totalPages < 1 {
		totalPages = 1
	}

	items := make([]response.MobileAttendanceRecordResponse, len(records))
	for i := range records {
		items[i] = mapper.ToMobileAttendanceRecordResponse(&records[i])
	}

	return &response.MobileAttendanceListResponse{
		Items:      items,
		TotalItems: total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *service) GetCalendar(ctx context.Context, orgID, employeeID string, q request.MobileCalendarQuery) (*response.MobileCalendarResponse, *apperrors.Error) {
	loc := s.resolveOrgLocation(ctx, orgID)
	nowLocal := time.Now().In(loc)
	todayLocal := time.Date(nowLocal.Year(), nowLocal.Month(), nowLocal.Day(), 0, 0, 0, 0, time.UTC)

	year := q.Year
	if year < 2000 || year > 2100 {
		year = nowLocal.Year()
	}
	month := q.Month
	if month < 1 || month > 12 {
		month = int(nowLocal.Month())
	}

	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, -1)

	records, err := s.repo.GetMonthlyAttendance(ctx, orgID, employeeID, startDate, endDate)
	if err != nil {
		return nil, apperrors.Internal()
	}

	emp, _ := s.repo.FindEmployeeByID(ctx, employeeID)
	var branchID *string
	if emp != nil {
		branchID = emp.BranchID
	}
	holidays, err := s.repo.GetMonthlyHolidays(ctx, orgID, branchID, startDate, endDate)
	if err != nil {
		return nil, apperrors.Internal()
	}

	workDays, _ := s.repo.GetWorkDays(ctx, orgID)
	workDaySet := make(map[string]bool, len(workDays))
	for _, wd := range workDays {
		workDaySet[wd] = true
	}

	recordMap := make(map[string]attendancemodels.AttendanceRecord)
	for _, r := range records {
		recordMap[r.AttendanceDate.Format("2006-01-02")] = r
	}

	holidayMap := make(map[string]string)
	for _, h := range holidays {
		cur := h.StartDate
		for !cur.After(h.EndDate) {
			holidayMap[cur.Format("2006-01-02")] = h.HolidayName
			cur = cur.AddDate(0, 0, 1)
		}
	}

	daysInMonth := endDate.Day()
	days := make([]response.MobileCalendarDay, 0, daysInMonth)

	for day := 1; day <= daysInMonth; day++ {
		date := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC)
		dateStr := date.Format("2006-01-02")

		holidayName, isHol := holidayMap[dateStr]
		rec, hasRec := recordMap[dateStr]

		var status string
		var checkInStr, checkOutStr *string

		if hasRec {
			status = rec.AttendanceStatus
			checkInStr = mapper.FormatTime(rec.CheckIn)
			checkOutStr = mapper.FormatTime(rec.CheckOut)
		} else if isHol {
			status = "HOLIDAY"
		} else if !workDaySet[strings.ToUpper(date.Weekday().String())] {
			status = "WEEKEND"
		} else if date.Before(todayLocal) {
			status = "ABSENT"
		} else {
			status = "UPCOMING"
		}

		var holNamePtr *string
		if isHol {
			holNamePtr = &holidayName
		}

		days = append(days, response.MobileCalendarDay{
			Date:         dateStr,
			Status:       status,
			CheckInTime:  checkInStr,
			CheckOutTime: checkOutStr,
			IsHoliday:    isHol,
			HolidayName:  holNamePtr,
		})
	}

	return &response.MobileCalendarResponse{
		Year:  year,
		Month: month,
		Days:  days,
	}, nil
}

func (s *service) SubmitCorrection(ctx context.Context, orgID, employeeID string, req request.MobileCorrectionRequest) (*response.MobileCorrectionResponse, *apperrors.Error) {
	if req.RequestedCheckInTime == nil && req.RequestedCheckOutTime == nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "requestedCheckInTime", Message: "At least one requested check-in or check-out time is required."},
		})
	}
	if req.RequestedCheckInTime != nil && req.RequestedCheckOutTime != nil && req.RequestedCheckOutTime.Before(*req.RequestedCheckInTime) {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "requestedCheckOutTime", Message: "Requested check-out time cannot be before check-in time."},
		})
	}

	record, err := s.repo.FindRecordByID(ctx, orgID, req.AttendanceRecordID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if record == nil {
		return nil, apperrors.NotFound("Attendance record not found.")
	}
	if record.EmployeeID != employeeID {
		return nil, apperrors.Forbidden("You can only request corrections for your own attendance records.")
	}

	now := time.Now().UTC()
	corr := &attendancemodels.AttendanceCorrectionRequest{
		ID:                uuid.NewString(),
		OrganizationID:    orgID,
		AttendanceID:      &record.ID,
		EmployeeID:        employeeID,
		AttendanceDate:    record.AttendanceDate,
		RequestedCheckIn:  req.RequestedCheckInTime,
		RequestedCheckOut: req.RequestedCheckOutTime,
		Reason:            strings.TrimSpace(req.Reason),
		RequestStatus:     "PENDING",
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	if err := s.repo.CreateCorrection(ctx, corr); err != nil {
		return nil, apperrors.Internal()
	}

	if created, findErr := s.repo.FindCorrectionByID(ctx, orgID, employeeID, corr.ID); findErr == nil && created != nil {
		res := mapper.ToMobileCorrectionResponse(created)
		return &res, nil
	}

	res := mapper.ToMobileCorrectionResponse(&models.MobileCorrectionRow{
		ID:                corr.ID,
		OrganizationID:    corr.OrganizationID,
		AttendanceID:      corr.AttendanceID,
		EmployeeID:        corr.EmployeeID,
		AttendanceDate:    corr.AttendanceDate,
		RequestedCheckIn:  corr.RequestedCheckIn,
		RequestedCheckOut: corr.RequestedCheckOut,
		OriginalCheckIn:   record.CheckIn,
		OriginalCheckOut:  record.CheckOut,
		Reason:            corr.Reason,
		RequestStatus:     corr.RequestStatus,
		CreatedAt:         corr.CreatedAt,
		UpdatedAt:         corr.UpdatedAt,
	})
	return &res, nil
}

func (s *service) ListCorrections(ctx context.Context, orgID, employeeID string, q request.ListMobileCorrectionsQuery) (*response.MobileCorrectionListResponse, *apperrors.Error) {
	items, total, err := s.repo.ListCorrections(ctx, orgID, employeeID, q)
	if err != nil {
		return nil, apperrors.Internal()
	}

	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))
	if totalPages < 1 {
		totalPages = 1
	}

	respItems := make([]response.MobileCorrectionResponse, len(items))
	for i := range items {
		respItems[i] = mapper.ToMobileCorrectionResponse(&items[i])
	}

	return &response.MobileCorrectionListResponse{
		Items:      respItems,
		TotalItems: total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *service) SyncOfflinePunches(ctx context.Context, orgID, employeeID string, req request.MobileSyncRequest) (*response.MobileSyncResponse, *apperrors.Error) {
	loc := s.resolveOrgLocation(ctx, orgID)
	now := time.Now().UTC()
	grace, _ := s.repo.GetGracePeriodMinutes(ctx, orgID)

	results := make([]response.SyncResultItem, 0, len(req.Events))
	successCount := 0
	failedCount := 0

	for _, ev := range req.Events {
		localID := strings.TrimSpace(ev.LocalEventID)
		eventModel := &models.OfflineAttendanceEvent{
			ID:             uuid.NewString(),
			OrganizationID: orgID,
			EmployeeID:     employeeID,
			LocalEventID:   localID,
			EventType:      ev.EventType,
			LocalEventTime: ev.LocalEventTime.UTC(),
			SyncStatus:     "PENDING",
			CreatedAt:      now,
		}

		if err := s.repo.RecordOfflineEvent(ctx, eventModel); err != nil {
			failedCount++
			errMsg := "Failed to record offline event."
			results = append(results, response.SyncResultItem{
				LocalEventID: localID,
				ResultStatus: "REJECTED",
				ErrorMessage: &errMsg,
			})
			continue
		}

		if eventModel.SyncStatus == "SYNCED" {
			errMsg := "Event has already been synchronized."
			results = append(results, response.SyncResultItem{
				LocalEventID: localID,
				ResultStatus: "CONFLICT",
				ErrorMessage: &errMsg,
			})
			continue
		}

		punchLocal := ev.LocalEventTime.In(loc)
		eventDate := time.Date(punchLocal.Year(), punchLocal.Month(), punchLocal.Day(), 0, 0, 0, 0, time.UTC)
		record, err := s.repo.GetTodayAttendance(ctx, orgID, employeeID, eventDate)
		if err != nil {
			failedCount++
			errMsg := "Unable to inspect existing attendance record."
			results = append(results, response.SyncResultItem{
				LocalEventID: localID,
				ResultStatus: "REJECTED",
				ErrorMessage: &errMsg,
			})
			continue
		}

		punchTime := ev.LocalEventTime.UTC()
		var processErr error

		if ev.EventType == "CHECK_IN" {
			if record != nil && record.CheckIn != nil {
				failedCount++
				errMsg := "Already checked in for date " + eventDate.Format("2006-01-02") + "."
				_ = s.repo.RecordSyncResult(ctx, &models.SynchronizationResult{
					OfflineEventID: eventModel.ID,
					ResultStatus:   "CONFLICT",
					ErrorMessage:   &errMsg,
					ProcessedAt:    now,
				})
				_ = s.repo.MarkOfflineEventSynced(ctx, eventModel.ID, now)
				results = append(results, response.SyncResultItem{
					LocalEventID: localID,
					ResultStatus: "CONFLICT",
					ErrorMessage: &errMsg,
				})
				continue
			}

			shift, _ := s.repo.GetAssignedShift(ctx, orgID, employeeID, eventDate)
			var shiftID *string
			lateMin := 0
			status := "PRESENT"
			if shift != nil {
				shiftID = &shift.ID
				lateMin = calculateLateMinutes(punchTime, shift, loc, grace)
				if lateMin > 0 {
					status = "LATE"
				}
			}

			remarks := buildRemarks(ev.Address, ev.Notes)
			if record == nil {
				record = &attendancemodels.AttendanceRecord{
					ID:               uuid.NewString(),
					OrganizationID:   orgID,
					EmployeeID:       employeeID,
					ShiftID:          shiftID,
					AttendanceDate:   eventDate,
					CheckIn:          &punchTime,
					AttendanceStatus: status,
					LateMinutes:      lateMin,
					Source:           "MOBILE_OFFLINE",
					Remarks:          remarks,
					CreatedAt:        now,
					UpdatedAt:        now,
				}
			} else {
				record.CheckIn = &punchTime
				record.ShiftID = shiftID
				record.AttendanceStatus = status
				record.LateMinutes = lateMin
				record.Source = "MOBILE_OFFLINE"
				record.Remarks = remarks
				record.UpdatedAt = now
			}
			processErr = s.repo.SaveAttendance(ctx, record)
		} else { // CHECK_OUT
			if record == nil || record.CheckIn == nil {
				failedCount++
				errMsg := "Missing check-in record for check-out on " + eventDate.Format("2006-01-02") + "."
				_ = s.repo.RecordSyncResult(ctx, &models.SynchronizationResult{
					OfflineEventID: eventModel.ID,
					ResultStatus:   "REJECTED",
					ErrorMessage:   &errMsg,
					ProcessedAt:    now,
				})
				results = append(results, response.SyncResultItem{
					LocalEventID: localID,
					ResultStatus: "REJECTED",
					ErrorMessage: &errMsg,
				})
				continue
			}
			if record.CheckOut != nil {
				failedCount++
				errMsg := "A check-out already exists for date " + eventDate.Format("2006-01-02") + "."
				_ = s.repo.RecordSyncResult(ctx, &models.SynchronizationResult{
					OfflineEventID: eventModel.ID,
					ResultStatus:   "CONFLICT",
					ErrorMessage:   &errMsg,
					ProcessedAt:    now,
				})
				_ = s.repo.MarkOfflineEventSynced(ctx, eventModel.ID, now)
				results = append(results, response.SyncResultItem{
					LocalEventID: localID,
					ResultStatus: "CONFLICT",
					ErrorMessage: &errMsg,
				})
				continue
			}
			if punchTime.Before(*record.CheckIn) {
				failedCount++
				errMsg := "Offline check-out time cannot be before check-in time."
				_ = s.repo.RecordSyncResult(ctx, &models.SynchronizationResult{
					OfflineEventID: eventModel.ID,
					ResultStatus:   "REJECTED",
					ErrorMessage:   &errMsg,
					ProcessedAt:    now,
				})
				results = append(results, response.SyncResultItem{
					LocalEventID: localID,
					ResultStatus: "REJECTED",
					ErrorMessage: &errMsg,
				})
				continue
			}

			record.CheckOut = &punchTime
			diff := punchTime.Sub(*record.CheckIn)
			worked := int(diff.Minutes())
			if worked < 0 {
				worked = 0
			}

			shift, _ := s.repo.GetAssignedShift(ctx, orgID, employeeID, eventDate)
			if shift != nil && shift.BreakMinutes > 0 && worked > shift.BreakMinutes {
				worked -= shift.BreakMinutes
			}
			record.WorkedMinutes = worked

			if shift != nil {
				earlyLeave := calculateEarlyLeaveMinutes(punchTime, shift, loc)
				record.EarlyLeaveMinutes = earlyLeave
				if earlyLeave > 0 && record.AttendanceStatus == "PRESENT" {
					record.AttendanceStatus = "EARLY_LEAVE"
				}
			}
			record.UpdatedAt = now
			processErr = s.repo.SaveAttendance(ctx, record)
		}

		if processErr != nil {
			failedCount++
			errMsg := "Failed to persist offline punch."
			_ = s.repo.RecordSyncResult(ctx, &models.SynchronizationResult{
				OfflineEventID: eventModel.ID,
				ResultStatus:   "REJECTED",
				ErrorMessage:   &errMsg,
				ProcessedAt:    now,
			})
			results = append(results, response.SyncResultItem{
				LocalEventID: localID,
				ResultStatus: "REJECTED",
				ErrorMessage: &errMsg,
			})
		} else {
			successCount++
			_ = s.repo.MarkOfflineEventSynced(ctx, eventModel.ID, now)
			_ = s.repo.RecordSyncResult(ctx, &models.SynchronizationResult{
				OfflineEventID: eventModel.ID,
				ResultStatus:   "ACCEPTED",
				ProcessedAt:    now,
			})
			results = append(results, response.SyncResultItem{
				LocalEventID: localID,
				ResultStatus: "ACCEPTED",
			})
		}
	}

	return &response.MobileSyncResponse{
		ProcessedCount: len(req.Events),
		SuccessCount:   successCount,
		FailedCount:    failedCount,
		Results:        results,
	}, nil
}

func (s *service) resolveOrgLocation(ctx context.Context, orgID string) *time.Location {
	tz, err := s.repo.GetOrgTimezone(ctx, orgID)
	if err != nil || strings.TrimSpace(tz) == "" {
		return time.UTC
	}
	loc, err := time.LoadLocation(tz)
	if err != nil {
		return time.UTC
	}
	return loc
}

func extractUserPermissions(roles []authmodels.OrgUserRole) []string {
	set := make(map[string]struct{})
	for _, ur := range roles {
		for _, p := range ur.Role.Permissions {
			set[p.Code] = struct{}{}
		}
	}
	res := make([]string, 0, len(set))
	for p := range set {
		res = append(res, p)
	}
	return res
}

func calculateLateMinutes(punchUTC time.Time, shift *shiftmodels.Shift, loc *time.Location, graceMinutes int) int {
	parts := strings.Split(shift.StartTime, ":")
	if len(parts) < 2 {
		return 0
	}
	var sh, sm int
	_, _ = fmt.Sscanf(shift.StartTime, "%d:%d", &sh, &sm)
	punchLocal := punchUTC.In(loc)
	shiftStart := time.Date(punchLocal.Year(), punchLocal.Month(), punchLocal.Day(), sh, sm, 0, 0, loc)
	allowedTime := shiftStart.Add(time.Duration(graceMinutes) * time.Minute)

	if punchLocal.After(allowedTime) {
		return int(punchLocal.Sub(shiftStart).Minutes())
	}
	return 0
}

func calculateEarlyLeaveMinutes(punchUTC time.Time, shift *shiftmodels.Shift, loc *time.Location) int {
	parts := strings.Split(shift.EndTime, ":")
	if len(parts) < 2 {
		return 0
	}
	var eh, em int
	_, _ = fmt.Sscanf(shift.EndTime, "%d:%d", &eh, &em)
	punchLocal := punchUTC.In(loc)
	shiftEnd := time.Date(punchLocal.Year(), punchLocal.Month(), punchLocal.Day(), eh, em, 0, 0, loc)

	if punchLocal.Before(shiftEnd) {
		return int(shiftEnd.Sub(punchLocal).Minutes())
	}
	return 0
}

func buildRemarks(addr, notes *string) *string {
	var parts []string
	if addr != nil && strings.TrimSpace(*addr) != "" {
		parts = append(parts, "Location: "+strings.TrimSpace(*addr))
	}
	if notes != nil && strings.TrimSpace(*notes) != "" {
		parts = append(parts, "Note: "+strings.TrimSpace(*notes))
	}
	if len(parts) == 0 {
		return nil
	}
	res := strings.Join(parts, " | ")
	return &res
}
