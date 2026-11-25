package service

import (
	"context"
	"math"
	"strings"
	"time"

	"hrgo/backend/internal/modules/workspace/employee/mapper"
	"hrgo/backend/internal/modules/workspace/employee/models"
	"hrgo/backend/internal/modules/workspace/employee/repository"
	"hrgo/backend/internal/modules/workspace/employee/request"
	"hrgo/backend/internal/modules/workspace/employee/response"
	apperrors "hrgo/backend/internal/shared/errors"
)

type Service interface {
	Create(ctx context.Context, orgID string, req request.CreateEmployeeRequest) (*response.EmployeeResponse, *apperrors.Error)
	GetByID(ctx context.Context, orgID, id string) (*response.EmployeeResponse, *apperrors.Error)
	List(ctx context.Context, orgID string, q request.ListEmployeesQuery) (*response.EmployeeListResponse, *apperrors.Error)
	Update(ctx context.Context, orgID, id string, req request.UpdateEmployeeRequest) (*response.EmployeeResponse, *apperrors.Error)
	Delete(ctx context.Context, orgID, id string) *apperrors.Error
	GetPositionHistory(ctx context.Context, orgID, id string) ([]response.PositionHistoryResponse, *apperrors.Error)
	ChangePosition(ctx context.Context, orgID, id string, req request.ChangePositionRequest) (*response.EmployeeResponse, *apperrors.Error)
}

type service struct {
	repo repository.Repository
}

func New(repo repository.Repository) Service {
	return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, orgID string, req request.CreateEmployeeRequest) (*response.EmployeeResponse, *apperrors.Error) {
	code := strings.TrimSpace(req.EmployeeCode)
	firstName := strings.TrimSpace(req.FirstName)
	lastName := strings.TrimSpace(req.LastName)

	var validationIssues []apperrors.FieldIssue

	if code == "" {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "employeeCode", Message: "Employee code is required."})
	} else if len(code) > 50 {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "employeeCode", Message: "Employee code must not exceed 50 characters."})
	}

	if firstName == "" {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "firstName", Message: "First name is required."})
	} else if len(firstName) > 100 {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "firstName", Message: "First name must not exceed 100 characters."})
	}

	if lastName == "" {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "lastName", Message: "Last name is required."})
	} else if len(lastName) > 100 {
		validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "lastName", Message: "Last name must not exceed 100 characters."})
	}

	var email *string
	if req.Email != nil && strings.TrimSpace(*req.Email) != "" {
		em := strings.TrimSpace(*req.Email)
		email = &em
	}

	var phone *string
	if req.Phone != nil && strings.TrimSpace(*req.Phone) != "" {
		ph := strings.TrimSpace(*req.Phone)
		phone = &ph
	}

	var dateOfJoining *time.Time
	if req.DateOfJoining != nil && strings.TrimSpace(*req.DateOfJoining) != "" {
		d, err := mapper.ParseDate(*req.DateOfJoining)
		if err != nil {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "dateOfJoining", Message: "Invalid date format, expected YYYY-MM-DD."})
		} else {
			dateOfJoining = d
		}
	}

	var dateOfBirth *time.Time
	if req.DateOfBirth != nil && strings.TrimSpace(*req.DateOfBirth) != "" {
		d, err := mapper.ParseDate(*req.DateOfBirth)
		if err != nil {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "dateOfBirth", Message: "Invalid date format, expected YYYY-MM-DD."})
		} else {
			dateOfBirth = d
		}
	}

	if len(validationIssues) > 0 {
		return nil, apperrors.ValidationFailed(validationIssues)
	}

	// Check code uniqueness
	existingCode, err := s.repo.FindByCode(ctx, orgID, code)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if existingCode != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "employeeCode", Message: "This employee code is already in use."},
		})
	}

	// Check email uniqueness if email provided
	if email != nil {
		existingEmail, err := s.repo.FindByEmail(ctx, orgID, *email)
		if err != nil {
			return nil, apperrors.Internal()
		}
		if existingEmail != nil {
			return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
				{Field: "email", Message: "This email is already in use by another employee."},
			})
		}
	}

	status := "ACTIVE"
	if req.EmploymentStatus != nil && *req.EmploymentStatus != "" {
		status = strings.ToUpper(strings.TrimSpace(*req.EmploymentStatus))
	}

	emp := models.Employee{
		OrganizationID:   orgID,
		EmployeeCode:     code,
		FirstName:        firstName,
		LastName:         lastName,
		Email:            email,
		Phone:            phone,
		BranchID:         req.BranchID,
		DepartmentID:     req.DepartmentID,
		PositionID:       req.PositionID,
		DateOfJoining:    dateOfJoining,
		EmploymentStatus: status,
	}

	var profile *models.EmployeeProfile
	if dateOfBirth != nil || req.Gender != nil || req.Nationality != nil || req.MaritalStatus != nil || req.Address != nil || req.EmergencyContact != nil {
		profile = &models.EmployeeProfile{
			OrganizationID:   orgID,
			DateOfBirth:      dateOfBirth,
			Gender:           req.Gender,
			Nationality:      req.Nationality,
			MaritalStatus:    req.MaritalStatus,
			Address:          req.Address,
			EmergencyContact: req.EmergencyContact,
		}
	}

	if err := s.repo.Create(ctx, &emp, profile); err != nil {
		return nil, apperrors.Internal()
	}

	// Re-fetch populated employee
	createdEmp, err := s.repo.FindByID(ctx, orgID, emp.ID)
	if err != nil || createdEmp == nil {
		res := mapper.ToEmployeeResponse(&emp, profile)
		return &res, nil
	}

	res := mapper.ToEmployeeResponse(createdEmp, profile)
	return &res, nil
}

func (s *service) GetByID(ctx context.Context, orgID, id string) (*response.EmployeeResponse, *apperrors.Error) {
	emp, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if emp == nil {
		return nil, apperrors.NotFound("Employee not found.")
	}

	profile, err := s.repo.GetProfile(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}

	res := mapper.ToEmployeeResponse(emp, profile)
	return &res, nil
}

func (s *service) List(ctx context.Context, orgID string, q request.ListEmployeesQuery) (*response.EmployeeListResponse, *apperrors.Error) {
	items, total, err := s.repo.List(ctx, orgID, q)
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

	responses := make([]response.EmployeeResponse, len(items))
	for i := range items {
		responses[i] = mapper.ToEmployeeResponse(&items[i], nil)
	}

	return &response.EmployeeListResponse{
		Items: responses,
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

func (s *service) Update(ctx context.Context, orgID, id string, req request.UpdateEmployeeRequest) (*response.EmployeeResponse, *apperrors.Error) {
	emp, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if emp == nil {
		return nil, apperrors.NotFound("Employee not found.")
	}

	var validationIssues []apperrors.FieldIssue

	if req.FirstName != nil {
		fn := strings.TrimSpace(*req.FirstName)
		if fn == "" {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "firstName", Message: "First name cannot be empty."})
		} else {
			emp.FirstName = fn
		}
	}

	if req.LastName != nil {
		ln := strings.TrimSpace(*req.LastName)
		if ln == "" {
			validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "lastName", Message: "Last name cannot be empty."})
		} else {
			emp.LastName = ln
		}
	}

	if req.Email != nil {
		em := strings.TrimSpace(*req.Email)
		if em == "" {
			emp.Email = nil
		} else {
			existingEmail, err := s.repo.FindByEmail(ctx, orgID, em)
			if err != nil {
				return nil, apperrors.Internal()
			}
			if existingEmail != nil && existingEmail.ID != emp.ID {
				validationIssues = append(validationIssues, apperrors.FieldIssue{
					Field: "email", Message: "This email is already in use by another employee.",
				})
			} else {
				emp.Email = &em
			}
		}
	}

	if req.Phone != nil {
		ph := strings.TrimSpace(*req.Phone)
		if ph == "" {
			emp.Phone = nil
		} else {
			emp.Phone = &ph
		}
	}

	if req.BranchID != nil {
		emp.BranchID = req.BranchID
	}
	if req.DepartmentID != nil {
		emp.DepartmentID = req.DepartmentID
	}
	if req.PositionID != nil {
		if (emp.PositionID == nil && req.PositionID != nil) || (emp.PositionID != nil && *emp.PositionID != *req.PositionID) {
			// Record position history
			history := models.EmployeePositionHistory{
				OrganizationID: orgID,
				EmployeeID:     emp.ID,
				OldPositionID:  emp.PositionID,
				NewPositionID:  *req.PositionID,
				EffectiveDate:  time.Now().UTC(),
			}
			_ = s.repo.AddPositionHistory(ctx, &history)
		}
		emp.PositionID = req.PositionID
	}

	if req.DateOfJoining != nil {
		if strings.TrimSpace(*req.DateOfJoining) == "" {
			emp.DateOfJoining = nil
		} else {
			d, err := mapper.ParseDate(*req.DateOfJoining)
			if err != nil {
				validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "dateOfJoining", Message: "Invalid date format, expected YYYY-MM-DD."})
			} else {
				emp.DateOfJoining = d
			}
		}
	}

	if req.EmploymentStatus != nil && *req.EmploymentStatus != "" {
		emp.EmploymentStatus = strings.ToUpper(strings.TrimSpace(*req.EmploymentStatus))
	}

	profile, err := s.repo.GetProfile(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if profile == nil {
		profile = &models.EmployeeProfile{
			OrganizationID: orgID,
			EmployeeID:     emp.ID,
		}
	}

	if req.DateOfBirth != nil {
		if strings.TrimSpace(*req.DateOfBirth) == "" {
			profile.DateOfBirth = nil
		} else {
			d, err := mapper.ParseDate(*req.DateOfBirth)
			if err != nil {
				validationIssues = append(validationIssues, apperrors.FieldIssue{Field: "dateOfBirth", Message: "Invalid date format, expected YYYY-MM-DD."})
			} else {
				profile.DateOfBirth = d
			}
		}
	}
	if req.Gender != nil {
		profile.Gender = req.Gender
	}
	if req.Nationality != nil {
		profile.Nationality = req.Nationality
	}
	if req.MaritalStatus != nil {
		profile.MaritalStatus = req.MaritalStatus
	}
	if req.Address != nil {
		profile.Address = req.Address
	}
	if req.EmergencyContact != nil {
		profile.EmergencyContact = req.EmergencyContact
	}

	if len(validationIssues) > 0 {
		return nil, apperrors.ValidationFailed(validationIssues)
	}

	if err := s.repo.Update(ctx, emp, profile); err != nil {
		return nil, apperrors.Internal()
	}

	updatedEmp, err := s.repo.FindByID(ctx, orgID, emp.ID)
	if err != nil || updatedEmp == nil {
		res := mapper.ToEmployeeResponse(emp, profile)
		return &res, nil
	}

	res := mapper.ToEmployeeResponse(updatedEmp, profile)
	return &res, nil
}

func (s *service) Delete(ctx context.Context, orgID, id string) *apperrors.Error {
	emp, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return apperrors.Internal()
	}
	if emp == nil {
		return apperrors.NotFound("Employee not found.")
	}

	if err := s.repo.SoftDelete(ctx, orgID, id); err != nil {
		return apperrors.Internal()
	}
	return nil
}

func (s *service) GetPositionHistory(ctx context.Context, orgID, id string) ([]response.PositionHistoryResponse, *apperrors.Error) {
	emp, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if emp == nil {
		return nil, apperrors.NotFound("Employee not found.")
	}

	history, err := s.repo.ListPositionHistory(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}

	return mapper.ToPositionHistoryResponses(history), nil
}

func (s *service) ChangePosition(ctx context.Context, orgID, id string, req request.ChangePositionRequest) (*response.EmployeeResponse, *apperrors.Error) {
	emp, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil {
		return nil, apperrors.Internal()
	}
	if emp == nil {
		return nil, apperrors.NotFound("Employee not found.")
	}

	effectiveDate, err := mapper.ParseDate(req.EffectiveDate)
	if err != nil {
		return nil, apperrors.ValidationFailed([]apperrors.FieldIssue{
			{Field: "effectiveDate", Message: "Invalid date format, expected YYYY-MM-DD."},
		})
	}

	history := models.EmployeePositionHistory{
		OrganizationID: orgID,
		EmployeeID:     emp.ID,
		OldPositionID:  emp.PositionID,
		NewPositionID:  req.NewPositionID,
		EffectiveDate:  *effectiveDate,
		Remarks:        req.Remarks,
	}

	if err := s.repo.AddPositionHistory(ctx, &history); err != nil {
		return nil, apperrors.Internal()
	}

	emp.PositionID = &req.NewPositionID
	if err := s.repo.Update(ctx, emp, nil); err != nil {
		return nil, apperrors.Internal()
	}

	updatedEmp, err := s.repo.FindByID(ctx, orgID, id)
	if err != nil || updatedEmp == nil {
		res := mapper.ToEmployeeResponse(emp, nil)
		return &res, nil
	}

	profile, _ := s.repo.GetProfile(ctx, orgID, id)
	res := mapper.ToEmployeeResponse(updatedEmp, profile)
	return &res, nil
}
