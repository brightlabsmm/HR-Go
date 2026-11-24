package service

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"

	"hrgo/backend/internal/modules/workspace/attendance/mapper"
	"hrgo/backend/internal/modules/workspace/attendance/models"
	"hrgo/backend/internal/modules/workspace/attendance/repository"
	"hrgo/backend/internal/modules/workspace/attendance/request"
	"hrgo/backend/internal/modules/workspace/attendance/response"
	shiftmodels "hrgo/backend/internal/modules/workspace/shift/models"
	apperrors "hrgo/backend/internal/shared/errors"
)

type Service interface {
	CheckIn(ctx context.Context, orgID string, req request.CheckInRequest) (*response.AttendanceResponse, *apperrors.Error)
	CheckOut(ctx context.Context, orgID string, req request.CheckOutRequest) (*response.AttendanceResponse, *apperrors.Error)
	ManualEntry(ctx context.Context, orgID string, req request.ManualAttendanceRequest) (*response.AttendanceResponse, *apperrors.Error)
	GetRecordByID(ctx context.Context, orgID, id string) (*response.AttendanceResponse, *apperrors.Error)
	ListRecords(ctx context.Context, orgID string, q request.ListAttendanceQuery) (*response.AttendanceListResponse, *apperrors.Error)
	GetSummary(ctx context.Context, orgID string, q request.AttendanceSummaryQuery) (*response.AttendanceSummaryResponse, *apperrors.Error)

	SubmitCorrection(ctx context.Context, orgID string, req request.CreateCorrectionRequest) (*response.CorrectionResponse, *apperrors.Error)
	GetCorrectionByID(ctx context.Context, orgID, id string) (*response.CorrectionResponse, *apperrors.Error)
	ListCorrections(ctx context.Context, orgID string, q request.ListCorrectionsQuery) (*response.CorrectionListResponse, *apperrors.Error)
	ReviewCorrection(ctx context.Context, orgID, reviewerAccountID, id string, req request.ReviewCorrectionRequest) (*response.CorrectionResponse, *apperrors.Error)
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) CheckIn(ctx context.Context, orgID string, req request.CheckInRequest) (*response.AttendanceResponse, *apperrors.Error) {
	now := time.Now().UTC()
	checkInTime := now
	if req.CheckInTime != nil && strings.TrimSpace(*req.CheckInTime) != "" {
		t, err := mapper.ParseDateTime(*req.CheckInTime)
		if err != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "checkInTime", Message: "Invalid check-in time format, expected RFC3339."},
			})
		}
		checkInTime = *t
	}

	attendanceDate := time.Date(checkInTime.Year(), checkInTime.Month(), checkInTime.Day(), 0, 0, 0, 0, time.UTC)

	// Check if existing record
	record, err := s.repo.FindRecordByDate(ctx, orgID, req.EmployeeID, attendanceDate)
	if err != nil {
		return nil, apperrors.Internal()
	}

	if record != nil && record.CheckIn != nil {
		return nil, apperrors.BadRequest("Employee has already checked in for today.")
	}

	if record == nil {
		record = &models.AttendanceRecord{
			OrganizationID: orgID,
			EmployeeID:     req.EmployeeID,
			AttendanceDate: attendanceDate,
		}
	}

	record.CheckIn = &checkInTime
	source := "WEB"
	if req.Source != nil && strings.TrimSpace(*req.Source) != "" {
		source = strings.ToUpper(strings.TrimSpace(*req.Source))
	}
	record.Source = source
	if req.Remarks != nil {
		record.Remarks = req.Remarks
	}

	// Resolve shift
	var shift *shiftmodels.Shift
	if req.ShiftID != nil && *req.ShiftID != "" {
		record.ShiftID = req.ShiftID
	} else {
		shift, _ = s.repo.GetAssignedShift(ctx, orgID, req.EmployeeID, attendanceDate)
		if shift != nil {
			record.ShiftID = &shift.ID
		}
	}

	// Calculate late minutes if shift has start time
	record.AttendanceStatus = "PRESENT"
	if shift != nil && shift.StartTime != "" {
		record.LateMinutes = calculateLateMinutes(checkInTime, shift.StartTime)
		if record.LateMinutes > 0 {
			record.AttendanceStatus = "LATE"
		}
	}

	if err := s.repo.SaveAttendance(ctx, record); err != nil {
		return nil, apperrors.Internal()
	}

	saved, err := s.repo.FindRecordByID(ctx, orgID, record.ID)
	if err != nil || saved == nil {
		res := mapper.ToAttendanceResponse(record)
		return &res, nil
	}

	res := mapper.ToAttendanceResponse(saved)
	return &res, nil
}

func (s *service) CheckOut(ctx context.Context, orgID string, req request.CheckOutRequest) (*response.AttendanceResponse, *apperrors.Error) {
	now := time.Now().UTC()
	checkOutTime := now
	if req.CheckOutTime != nil && strings.TrimSpace(*req.CheckOutTime) != "" {
		t, err := mapper.ParseDateTime(*req.CheckOutTime)
		if err != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "checkOutTime", Message: "Invalid check-out time format, expected RFC3339."},
			})
		}
		checkOutTime = *t
	}

	attendanceDate := time.Date(checkOutTime.Year(), checkOutTime.Month(), checkOutTime.Day(), 0, 0, 0, 0, time.UTC)

	record, err := s.repo.FindRecordByDate(ctx, orgID, req.EmployeeID, attendanceDate)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if record == nil || record.CheckIn == nil {
		return nil, apperrors.BadRequest("Cannot check out without a previous check-in for today.")
	}

	if checkOutTime.Before(*record.CheckIn) {
		return nil, apperrors.BadRequest("Check-out time cannot be before check-in time.")
	}

	record.CheckOut = &checkOutTime
	if req.Remarks != nil {
		record.Remarks = req.Remarks
	}

	// Calculate worked minutes
	diff := checkOutTime.Sub(*record.CheckIn)
	worked := int(diff.Minutes())
	if worked < 0 {
		worked = 0
	}

	shift, _ := s.repo.GetAssignedShift(ctx, orgID, req.EmployeeID, attendanceDate)
	breakMin := 0
	if shift != nil {
		breakMin = shift.BreakMinutes
		record.EarlyLeaveMinutes = calculateEarlyLeaveMinutes(checkOutTime, shift.EndTime)
	}

	if worked > breakMin {
		worked -= breakMin
	}
	record.WorkedMinutes = worked

	if err := s.repo.SaveAttendance(ctx, record); err != nil {
		return nil, apperrors.Internal()
	}

	saved, err := s.repo.FindRecordByID(ctx, orgID, record.ID)
	if err != nil || saved == nil {
		res := mapper.ToAttendanceResponse(record)
		return &res, nil
	}

	res := mapper.ToAttendanceResponse(saved)
	return &res, nil
}

func (s *service) ManualEntry(ctx context.Context, orgID string, req request.ManualAttendanceRequest) (*response.AttendanceResponse, *apperrors.Error) {
	date, err := mapper.ParseDate(req.AttendanceDate)
	if err != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "attendanceDate", Message: "Invalid attendance date format, expected YYYY-MM-DD."},
		})
	}

	var checkIn, checkOut *time.Time
	if req.CheckIn != nil && strings.TrimSpace(*req.CheckIn) != "" {
		t, err := mapper.ParseDateTime(*req.CheckIn)
		if err != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "checkIn", Message: "Invalid check-in time format, expected RFC3339."},
			})
		}
		checkIn = t
	}

	if req.CheckOut != nil && strings.TrimSpace(*req.CheckOut) != "" {
		t, err := mapper.ParseDateTime(*req.CheckOut)
		if err != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "checkOut", Message: "Invalid check-out time format, expected RFC3339."},
			})
		}
		checkOut = t
	}

	status := "PRESENT"
	if req.AttendanceStatus != nil && *req.AttendanceStatus != "" {
		status = strings.ToUpper(strings.TrimSpace(*req.AttendanceStatus))
	}

	worked := 0
	if checkIn != nil && checkOut != nil {
		diff := checkOut.Sub(*checkIn)
		worked = int(diff.Minutes())
		if worked < 0 {
			worked = 0
		}
	}

	record := models.AttendanceRecord{
		OrganizationID:   orgID,
		EmployeeID:       req.EmployeeID,
		ShiftID:          req.ShiftID,
		AttendanceDate:   *date,
		CheckIn:          checkIn,
		CheckOut:         checkOut,
		AttendanceStatus: status,
		WorkedMinutes:    worked,
		Source:           "MANUAL",
		Remarks:          req.Remarks,
	}

	if err := s.repo.SaveAttendance(ctx, &record); err != nil {
		return nil, apperrors.Internal()
	}

	saved, err := s.repo.FindRecordByID(ctx, orgID, record.ID)
	if err != nil || saved == nil {
		res := mapper.ToAttendanceResponse(&record)
		return &res, nil
	}

	res := mapper.ToAttendanceResponse(saved)
	return &res, nil
}

func (s *service) GetRecordByID(ctx context.Context, orgID, id string) (*response.AttendanceResponse, *apperrors.Error) {
	record, err := s.repo.FindRecordByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if record == nil {
		return nil, apperrors.NotFound("Attendance record not found.")
	}

	res := mapper.ToAttendanceResponse(record)
	return &res, nil
}

func (s *service) ListRecords(ctx context.Context, orgID string, q request.ListAttendanceQuery) (*response.AttendanceListResponse, *apperrors.Error) {
	items, total, err := s.repo.ListRecords(ctx, orgID, q)
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

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	if totalPages < 1 {
		totalPages = 1
	}

	return &response.AttendanceListResponse{
		Items: mapper.ToAttendanceResponses(items),
		Pagination: response.PaginationMeta{
			Total:       total,
			Page:        page,
			PageSize:    pageSize,
			TotalPages:  totalPages,
			HasNextPage: page < totalPages,
			HasPrevPage: page > 1,
		},
	}, nil
}

func (s *service) GetSummary(ctx context.Context, orgID string, q request.AttendanceSummaryQuery) (*response.AttendanceSummaryResponse, *apperrors.Error) {
	items, _, err := s.repo.ListRecords(ctx, orgID, request.ListAttendanceQuery{
		EmployeeID:   q.EmployeeID,
		BranchID:     q.BranchID,
		DepartmentID: q.DepartmentID,
		From:         q.From,
		To:           q.To,
		Page:         1,
		PageSize:     10000,
	})
	if err != nil {
		return nil, apperrors.Internal()
	}

	present := 0
	late := 0
	absent := 0
	halfDays := 0
	totalWorked := 0
	totalLate := 0

	for _, item := range items {
		switch strings.ToUpper(item.AttendanceStatus) {
		case "PRESENT":
			present++
		case "LATE":
			late++
			present++
		case "ABSENT":
			absent++
		case "HALF_DAY":
			halfDays++
		}
		totalWorked += item.WorkedMinutes
		totalLate += item.LateMinutes
	}

	return &response.AttendanceSummaryResponse{
		From:               q.From,
		To:                 q.To,
		TotalDays:          len(items),
		PresentDays:        present,
		LateDays:           late,
		AbsentDays:         absent,
		HalfDays:           halfDays,
		TotalWorkedMinutes: totalWorked,
		TotalLateMinutes:   totalLate,
	}, nil
}

func (s *service) SubmitCorrection(ctx context.Context, orgID string, req request.CreateCorrectionRequest) (*response.CorrectionResponse, *apperrors.Error) {
	date, err := mapper.ParseDate(req.AttendanceDate)
	if err != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "attendanceDate", Message: "Invalid attendance date format, expected YYYY-MM-DD."},
		})
	}

	reason := strings.TrimSpace(req.Reason)
	if reason == "" {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "reason", Message: "Reason for correction is required."},
		})
	}

	var reqCheckIn, reqCheckOut *time.Time
	if req.RequestedCheckIn != nil && strings.TrimSpace(*req.RequestedCheckIn) != "" {
		t, err := mapper.ParseDateTime(*req.RequestedCheckIn)
		if err != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "requestedCheckIn", Message: "Invalid requested check-in time format."},
			})
		}
		reqCheckIn = t
	}

	if req.RequestedCheckOut != nil && strings.TrimSpace(*req.RequestedCheckOut) != "" {
		t, err := mapper.ParseDateTime(*req.RequestedCheckOut)
		if err != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "requestedCheckOut", Message: "Invalid requested check-out time format."},
			})
		}
		reqCheckOut = t
	}

	corr := models.AttendanceCorrectionRequest{
		OrganizationID:    orgID,
		AttendanceID:      req.AttendanceID,
		EmployeeID:        req.EmployeeID,
		AttendanceDate:    *date,
		RequestedCheckIn:  reqCheckIn,
		RequestedCheckOut: reqCheckOut,
		Reason:            reason,
		RequestStatus:     "PENDING",
	}

	if err := s.repo.CreateCorrection(ctx, &corr); err != nil {
		return nil, apperrors.Internal()
	}

	created, err := s.repo.FindCorrectionByID(ctx, orgID, corr.ID)
	if err != nil || created == nil {
		res := mapper.ToCorrectionResponse(&corr)
		return &res, nil
	}

	res := mapper.ToCorrectionResponse(created)
	return &res, nil
}

func (s *service) GetCorrectionByID(ctx context.Context, orgID, id string) (*response.CorrectionResponse, *apperrors.Error) {
	corr, err := s.repo.FindCorrectionByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if corr == nil {
		return nil, apperrors.NotFound("Correction request not found.")
	}

	res := mapper.ToCorrectionResponse(corr)
	return &res, nil
}

func (s *service) ListCorrections(ctx context.Context, orgID string, q request.ListCorrectionsQuery) (*response.CorrectionListResponse, *apperrors.Error) {
	items, total, err := s.repo.ListCorrections(ctx, orgID, q)
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

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	if totalPages < 1 {
		totalPages = 1
	}

	return &response.CorrectionListResponse{
		Items: mapper.ToCorrectionResponses(items),
		Pagination: response.PaginationMeta{
			Total:       total,
			Page:        page,
			PageSize:    pageSize,
			TotalPages:  totalPages,
			HasNextPage: page < totalPages,
			HasPrevPage: page > 1,
		},
	}, nil
}

func (s *service) ReviewCorrection(ctx context.Context, orgID, reviewerAccountID, id string, req request.ReviewCorrectionRequest) (*response.CorrectionResponse, *apperrors.Error) {
	corr, err := s.repo.FindCorrectionByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if corr == nil {
		return nil, apperrors.NotFound("Correction request not found.")
	}

	if corr.RequestStatus != "PENDING" {
		return nil, apperrors.BadRequest("This correction request has already been reviewed.")
	}

	now := time.Now().UTC()
	decision := strings.ToUpper(strings.TrimSpace(req.Decision))
	corr.ReviewedByAccountID = &reviewerAccountID
	corr.ReviewedAt = &now

	if decision == "REJECTED" {
		if req.Reason == nil || strings.TrimSpace(*req.Reason) == "" {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "reason", Message: "Rejection reason is required."},
			})
		}
		corr.RequestStatus = "REJECTED"
		corr.RejectionReason = req.Reason

		if err := s.repo.RejectCorrection(ctx, corr); err != nil {
			return nil, apperrors.Internal()
		}
	} else if decision == "APPROVED" {
		corr.RequestStatus = "APPROVED"

		// Apply correction to attendance record
		record := models.AttendanceRecord{
			OrganizationID:   orgID,
			EmployeeID:       corr.EmployeeID,
			AttendanceDate:   corr.AttendanceDate,
			CheckIn:          corr.RequestedCheckIn,
			CheckOut:         corr.RequestedCheckOut,
			AttendanceStatus: "PRESENT",
			Source:           "MANUAL",
			Remarks:          &corr.Reason,
		}

		if corr.RequestedCheckIn != nil && corr.RequestedCheckOut != nil {
			diff := corr.RequestedCheckOut.Sub(*corr.RequestedCheckIn)
			worked := int(diff.Minutes())
			if worked < 0 {
				worked = 0
			}
			record.WorkedMinutes = worked
		}

		if err := s.repo.ApproveCorrection(ctx, corr, &record); err != nil {
			return nil, apperrors.Internal()
		}
	}

	updated, err := s.repo.FindCorrectionByID(ctx, orgID, id)
	if err != nil || updated == nil {
		res := mapper.ToCorrectionResponse(corr)
		return &res, nil
	}

	res := mapper.ToCorrectionResponse(updated)
	return &res, nil
}

func calculateLateMinutes(checkIn time.Time, shiftStart string) int {
	parts := strings.Split(shiftStart, ":")
	if len(parts) != 2 {
		return 0
	}
	var sh, sm int
	fmt.Sscanf(parts[0], "%d", &sh)
	fmt.Sscanf(parts[1], "%d", &sm)

	shiftStartTime := time.Date(checkIn.Year(), checkIn.Month(), checkIn.Day(), sh, sm, 0, 0, checkIn.Location())
	if checkIn.After(shiftStartTime) {
		return int(checkIn.Sub(shiftStartTime).Minutes())
	}
	return 0
}

func calculateEarlyLeaveMinutes(checkOut time.Time, shiftEnd string) int {
	parts := strings.Split(shiftEnd, ":")
	if len(parts) != 2 {
		return 0
	}
	var sh, sm int
	fmt.Sscanf(parts[0], "%d", &sh)
	fmt.Sscanf(parts[1], "%d", &sm)

	shiftEndTime := time.Date(checkOut.Year(), checkOut.Month(), checkOut.Day(), sh, sm, 0, 0, checkOut.Location())
	if checkOut.Before(shiftEndTime) {
		return int(shiftEndTime.Sub(checkOut).Minutes())
	}
	return 0
}
