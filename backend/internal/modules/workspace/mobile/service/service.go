package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	attendancemapper "hrgo/backend/internal/modules/workspace/attendance/mapper"
	attendancemodels "hrgo/backend/internal/modules/workspace/attendance/models"
	attendanceresponse "hrgo/backend/internal/modules/workspace/attendance/response"
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

type SessionMetadata struct {
	IPAddress *string
	UserAgent *string
}

type Service interface {
	Login(ctx context.Context, req request.MobileLoginRequest, meta ...SessionMetadata) (*response.MobileLoginResponse, *apperrors.Error)
	ChangePassword(ctx context.Context, accountID string, req request.MobileChangePasswordRequest) *apperrors.Error
	GetProfile(ctx context.Context, orgID, employeeID string) (*response.MobileUserProfile, *apperrors.Error)
	GetShift(ctx context.Context, orgID, employeeID string) (*response.MobileShiftResponse, *apperrors.Error)
	GetTodayAttendance(ctx context.Context, orgID, employeeID string) (*response.MobileTodayResponse, *apperrors.Error)
	CheckIn(ctx context.Context, orgID, employeeID string, req request.MobilePunchRequest) (*attendanceresponse.AttendanceResponse, *apperrors.Error)
	CheckOut(ctx context.Context, orgID, employeeID string, req request.MobilePunchRequest) (*attendanceresponse.AttendanceResponse, *apperrors.Error)
	ListAttendanceHistory(ctx context.Context, orgID, employeeID string, q request.MobileAttendanceHistoryQuery) (*attendanceresponse.AttendanceListResponse, *apperrors.Error)
	GetCalendar(ctx context.Context, orgID, employeeID string, q request.MobileCalendarQuery) (*response.MobileCalendarResponse, *apperrors.Error)
	SubmitCorrection(ctx context.Context, orgID, employeeID string, req request.MobileCorrectionRequest) (*attendanceresponse.CorrectionResponse, *apperrors.Error)
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
		return nil, apperrors.Forbidden("Employee account is " + strings.ToLower(acc.Status))
	}

	perms := extractUserPermissions(acc.UserRoles)
	hasMobileAccess := false
	for _, p := range perms {
		if p == "org.mobile.access" {
			hasMobileAccess = true
			break
		}
	}
	if !hasMobileAccess {
		return nil, apperrors.Forbidden("Mobile self-service access is not granted for your role.")
	}

	var branchID, deptID string
	if len(acc.UserRoles) > 0 {
		if acc.UserRoles[0].BranchID != nil {
			branchID = *acc.UserRoles[0].BranchID
		}
		if acc.UserRoles[0].DepartmentID != nil {
			deptID = *acc.UserRoles[0].DepartmentID
		}
	}

	sessionID := uuid.NewString()
	expSeconds := int64(30 * 24 * 3600) // Mobile sessions last 30 days
	token, exp, err := s.tokens.GenerateWorkspaceTokenWithSession(
		sessionID,
		acc.ID,
		acc.OrganizationID,
		acc.EmployeeID,
		acc.Employee.EmployeeCode,
		branchID,
		deptID,
		perms,
	)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if exp > 0 {
		expSeconds = exp
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

	userProfile := mapper.ToMobileUserProfile(acc, perms)
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
		return apperrors.NotFound("Account not found")
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

func (s *service) GetProfile(ctx context.Context, orgID, employeeID string) (*response.MobileUserProfile, *apperrors.Error) {
	emp, _, err := s.repo.GetEmployeeFullDetails(ctx, orgID, employeeID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if emp == nil {
		return nil, apperrors.NotFound("Employee profile not found")
	}

	var joinDate *string
	if emp.DateOfJoining != nil {
		formatted := emp.DateOfJoining.Format("2006-01-02")
		joinDate = &formatted
	}

	return &response.MobileUserProfile{
		EmployeeID:       emp.ID,
		EmployeeCode:     emp.EmployeeCode,
		FirstName:        emp.FirstName,
		LastName:         emp.LastName,
		Email:            emp.Email,
		Phone:            emp.Phone,
		BranchID:         emp.BranchID,
		BranchName:       emp.BranchName,
		DepartmentID:     emp.DepartmentID,
		DepartmentName:   emp.DepartmentName,
		PositionID:       emp.PositionID,
		PositionTitle:    emp.PositionTitle,
		DateOfJoining:    joinDate,
		EmploymentStatus: emp.EmploymentStatus,
	}, nil
}

func (s *service) GetShift(ctx context.Context, orgID, employeeID string) (*response.MobileShiftResponse, *apperrors.Error) {
	now := time.Now().UTC()
	shift, err := s.repo.GetAssignedShift(ctx, orgID, employeeID, now)
	if err != nil {
		return nil, apperrors.Internal()
	}
	return mapper.ToMobileShiftResponse(shift), nil
}

func (s *service) GetTodayAttendance(ctx context.Context, orgID, employeeID string) (*response.MobileTodayResponse, *apperrors.Error) {
	now := time.Now().UTC()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	todayStr := today.Format("2006-01-02")

	record, err := s.repo.GetTodayAttendance(ctx, orgID, employeeID, today)
	if err != nil {
		return nil, apperrors.Internal()
	}

	shift, _ := s.repo.GetAssignedShift(ctx, orgID, employeeID, today)
	shiftResp := mapper.ToMobileShiftResponse(shift)

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

	if record == nil {
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

	var checkInStr, checkOutStr *string
	if record.CheckIn != nil {
		s := record.CheckIn.UTC().Format(time.RFC3339)
		checkInStr = &s
	}
	if record.CheckOut != nil {
		s := record.CheckOut.UTC().Format(time.RFC3339)
		checkOutStr = &s
	}

	status := "CHECKED_IN"
	if record.CheckOut != nil {
		status = "CHECKED_OUT"
	}

	return &response.MobileTodayResponse{
		AttendanceDate: todayStr,
		Status:         status,
		CheckInTime:    checkInStr,
		CheckOutTime:   checkOutStr,
		WorkMinutes:    record.WorkedMinutes,
		Shift:          shiftResp,
		IsHoliday:      isHoliday,
		HolidayName:    holidayName,
	}, nil
}

func (s *service) CheckIn(ctx context.Context, orgID, employeeID string, req request.MobilePunchRequest) (*attendanceresponse.AttendanceResponse, *apperrors.Error) {
	now := time.Now().UTC()
	attendanceDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)

	record, err := s.repo.GetTodayAttendance(ctx, orgID, employeeID, attendanceDate)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if record != nil && record.CheckIn != nil {
		return nil, apperrors.Conflict("Already checked in for today.")
	}

	shift, _ := s.repo.GetAssignedShift(ctx, orgID, employeeID, attendanceDate)
	var shiftID *string
	lateMinutes := 0
	status := "PRESENT"

	if shift != nil {
		shiftID = &shift.ID
		lateMinutes = calculateLateMinutes(now, shift)
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
			AttendanceDate:   attendanceDate,
			CheckIn:          &now,
			AttendanceStatus: status,
			LateMinutes:      lateMinutes,
			Source:           "MOBILE",
			Remarks:          remarks,
			CreatedAt:        now,
			UpdatedAt:        now,
		}
	} else {
		record.CheckIn = &now
		record.ShiftID = shiftID
		record.AttendanceStatus = status
		record.LateMinutes = lateMinutes
		record.Source = "MOBILE"
		record.Remarks = remarks
		record.UpdatedAt = now
	}

	if err := s.repo.SaveAttendance(ctx, record); err != nil {
		return nil, apperrors.Internal()
	}

	res := attendancemapper.ToAttendanceResponse(record)
	return &res, nil
}

func (s *service) CheckOut(ctx context.Context, orgID, employeeID string, req request.MobilePunchRequest) (*attendanceresponse.AttendanceResponse, *apperrors.Error) {
	now := time.Now().UTC()
	attendanceDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)

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

	record.CheckOut = &now
	diff := now.Sub(*record.CheckIn)
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
		earlyLeave := calculateEarlyLeaveMinutes(now, shift)
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

	record.UpdatedAt = now
	if err := s.repo.SaveAttendance(ctx, record); err != nil {
		return nil, apperrors.Internal()
	}

	res := attendancemapper.ToAttendanceResponse(record)
	return &res, nil
}

func (s *service) ListAttendanceHistory(ctx context.Context, orgID, employeeID string, q request.MobileAttendanceHistoryQuery) (*attendanceresponse.AttendanceListResponse, *apperrors.Error) {
	records, total, err := s.repo.ListAttendanceHistory(ctx, orgID, employeeID, q)
	if err != nil {
		return nil, apperrors.Internal()
	}

	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))

	items := attendancemapper.ToAttendanceResponses(records)
	return &attendanceresponse.AttendanceListResponse{
		Items: items,
		Pagination: attendanceresponse.PaginationMeta{
			Total:       total,
			Page:        page,
			PageSize:    pageSize,
			TotalPages:  totalPages,
			HasNextPage: page < totalPages,
			HasPrevPage: page > 1,
		},
	}, nil
}

func (s *service) GetCalendar(ctx context.Context, orgID, employeeID string, q request.MobileCalendarQuery) (*response.MobileCalendarResponse, *apperrors.Error) {
	now := time.Now().UTC()
	year := q.Year
	if year < 2000 || year > 2100 {
		year = now.Year()
	}
	month := q.Month
	if month < 1 || month > 12 {
		month = int(now.Month())
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
			if rec.CheckIn != nil {
				s := rec.CheckIn.UTC().Format(time.RFC3339)
				checkInStr = &s
			}
			if rec.CheckOut != nil {
				s := rec.CheckOut.UTC().Format(time.RFC3339)
				checkOutStr = &s
			}
		} else if isHol {
			status = "HOLIDAY"
		} else if date.Weekday() == time.Saturday || date.Weekday() == time.Sunday {
			status = "WEEKEND"
		} else if date.Before(now) {
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

func (s *service) SubmitCorrection(ctx context.Context, orgID, employeeID string, req request.MobileCorrectionRequest) (*attendanceresponse.CorrectionResponse, *apperrors.Error) {
	record, err := s.repo.FindRecordByID(ctx, orgID, req.AttendanceRecordID)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if record == nil {
		return nil, apperrors.NotFound("Attendance record not found")
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

	res := attendancemapper.ToCorrectionResponse(corr)
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
	if pageSize < 1 {
		pageSize = 20
	}
	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))

	respItems := make([]attendanceresponse.CorrectionResponse, len(items))
	for i := range items {
		respItems[i] = attendancemapper.ToCorrectionResponse(&items[i])
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
	now := time.Now().UTC()
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
			errMsg := "Failed to record event: " + err.Error()
			results = append(results, response.SyncResultItem{
				LocalEventID: localID,
				ResultStatus: "FAILED",
				ErrorMessage: &errMsg,
			})
			continue
		}

		if eventModel.SyncStatus == "SYNCED" {
			results = append(results, response.SyncResultItem{
				LocalEventID: localID,
				ResultStatus: "DUPLICATE",
			})
			continue
		}

		// Process event
		eventDate := time.Date(ev.LocalEventTime.Year(), ev.LocalEventTime.Month(), ev.LocalEventTime.Day(), 0, 0, 0, 0, time.UTC)
		record, err := s.repo.GetTodayAttendance(ctx, orgID, employeeID, eventDate)
		if err != nil {
			failedCount++
			errMsg := "Database error"
			results = append(results, response.SyncResultItem{
				LocalEventID: localID,
				ResultStatus: "FAILED",
				ErrorMessage: &errMsg,
			})
			continue
		}

		punchTime := ev.LocalEventTime.UTC()
		var processErr error

		if ev.EventType == "CHECK_IN" {
			if record != nil && record.CheckIn != nil {
				// Already checked in
				errMsg := "Already checked in for date " + eventDate.Format("2006-01-02")
				res := &models.SynchronizationResult{
					OfflineEventID: eventModel.ID,
					ResultStatus:   "DUPLICATE",
					ErrorMessage:   &errMsg,
					ProcessedAt:    now,
				}
				_ = s.repo.RecordSyncResult(ctx, res)
				results = append(results, response.SyncResultItem{
					LocalEventID: localID,
					ResultStatus: "DUPLICATE",
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
				lateMin = calculateLateMinutes(punchTime, shift)
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
				errMsg := "Missing check-in record for check-out on " + eventDate.Format("2006-01-02")
				res := &models.SynchronizationResult{
					OfflineEventID: eventModel.ID,
					ResultStatus:   "FAILED",
					ErrorMessage:   &errMsg,
					ProcessedAt:    now,
				}
				_ = s.repo.RecordSyncResult(ctx, res)
				failedCount++
				results = append(results, response.SyncResultItem{
					LocalEventID: localID,
					ResultStatus: "FAILED",
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
				earlyLeave := calculateEarlyLeaveMinutes(punchTime, shift)
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
			errMsg := "Failed to save punch: " + processErr.Error()
			res := &models.SynchronizationResult{
				OfflineEventID: eventModel.ID,
				ResultStatus:   "FAILED",
				ErrorMessage:   &errMsg,
				ProcessedAt:    now,
			}
			_ = s.repo.RecordSyncResult(ctx, res)
			results = append(results, response.SyncResultItem{
				LocalEventID: localID,
				ResultStatus: "FAILED",
				ErrorMessage: &errMsg,
			})
		} else {
			successCount++
			eventModel.SyncStatus = "SYNCED"
			eventModel.SyncedAt = &now
			_ = s.repo.RecordOfflineEvent(ctx, eventModel)

			res := &models.SynchronizationResult{
				OfflineEventID: eventModel.ID,
				ResultStatus:   "SUCCESS",
				ProcessedAt:    now,
			}
			_ = s.repo.RecordSyncResult(ctx, res)
			results = append(results, response.SyncResultItem{
				LocalEventID: localID,
				ResultStatus: "SUCCESS",
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

func calculateLateMinutes(punch time.Time, shift *shiftmodels.Shift) int {
	parts := strings.Split(shift.StartTime, ":")
	if len(parts) < 2 {
		return 0
	}
	var sh, sm int
	_, _ = fmt.Sscanf(shift.StartTime, "%d:%d", &sh, &sm)
	shiftStart := time.Date(punch.Year(), punch.Month(), punch.Day(), sh, sm, 0, 0, time.UTC)
	grace := 15 // 15 mins default
	allowedTime := shiftStart.Add(time.Duration(grace) * time.Minute)

	if punch.After(allowedTime) {
		return int(punch.Sub(shiftStart).Minutes())
	}
	return 0
}

func calculateEarlyLeaveMinutes(punch time.Time, shift *shiftmodels.Shift) int {
	var eh, em int
	_, _ = fmt.Sscanf(shift.EndTime, "%d:%d", &eh, &em)
	shiftEnd := time.Date(punch.Year(), punch.Month(), punch.Day(), eh, em, 0, 0, time.UTC)

	if punch.Before(shiftEnd) {
		return int(shiftEnd.Sub(punch).Minutes())
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
