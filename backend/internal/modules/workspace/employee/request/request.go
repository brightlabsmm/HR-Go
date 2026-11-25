package request

type CreateEmployeeRequest struct {
	EmployeeCode     string  `json:"employeeCode" binding:"omitempty,max=50"`
	FirstName        string  `json:"firstName" binding:"required,max=100"`
	LastName         string  `json:"lastName" binding:"required,max=100"`
	Email            *string `json:"email" binding:"required,email,max=255"`
	Phone            *string `json:"phone" binding:"omitempty,max=50"`
	BranchID         *string `json:"branchId" binding:"required,uuid"`
	DepartmentID     *string `json:"departmentId" binding:"required,uuid"`
	PositionID       *string `json:"positionId" binding:"required,uuid"`
	RoleID           *string `json:"roleId" binding:"required,uuid"`
	DateOfJoining    *string `json:"dateOfJoining"` // YYYY-MM-DD
	EmploymentStatus *string `json:"employmentStatus" binding:"omitempty,oneof=ACTIVE PROBATION SUSPENDED TERMINATED RESIGNED"`

	// Profile fields
	DateOfBirth      *string `json:"dateOfBirth" binding:"required"` // YYYY-MM-DD
	Gender           *string `json:"gender" binding:"required,oneof=MALE FEMALE OTHER"`
	Nationality      *string `json:"nationality" binding:"required,max=50"`
	MaritalStatus    *string `json:"maritalStatus" binding:"omitempty,oneof=SINGLE MARRIED DIVORCED WIDOWED OTHER"`
	Address          *string `json:"address" binding:"omitempty,max=1000"`
	EmergencyContact *string `json:"emergencyContact" binding:"required,max=255"`
}

type UpdateEmployeeRequest struct {
	FirstName        *string `json:"firstName" binding:"omitempty,max=100"`
	LastName         *string `json:"lastName" binding:"omitempty,max=100"`
	Email            *string `json:"email" binding:"omitempty,email,max=255"`
	Phone            *string `json:"phone" binding:"omitempty,max=50"`
	BranchID         *string `json:"branchId" binding:"omitempty,uuid"`
	DepartmentID     *string `json:"departmentId" binding:"omitempty,uuid"`
	PositionID       *string `json:"positionId" binding:"omitempty,uuid"`
	RoleID           *string `json:"roleId" binding:"omitempty,uuid"`
	DateOfJoining    *string `json:"dateOfJoining"`
	EmploymentStatus *string `json:"employmentStatus" binding:"omitempty,oneof=ACTIVE PROBATION SUSPENDED TERMINATED RESIGNED"`

	// Profile fields
	DateOfBirth      *string `json:"dateOfBirth"`
	Gender           *string `json:"gender" binding:"omitempty,oneof=MALE FEMALE OTHER"`
	Nationality      *string `json:"nationality" binding:"omitempty,max=50"`
	MaritalStatus    *string `json:"maritalStatus" binding:"omitempty,oneof=SINGLE MARRIED DIVORCED WIDOWED OTHER"`
	Address          *string `json:"address" binding:"omitempty,max=1000"`
	EmergencyContact *string `json:"emergencyContact" binding:"omitempty,max=255"`
}

type ChangePositionRequest struct {
	NewPositionID string  `json:"newPositionId" binding:"required,uuid"`
	EffectiveDate string  `json:"effectiveDate" binding:"required"` // YYYY-MM-DD
	Remarks       *string `json:"remarks" binding:"omitempty,max=500"`
}

type ListEmployeesQuery struct {
	BranchID     string `form:"branchId"`
	DepartmentID string `form:"departmentId"`
	PositionID   string `form:"positionId"`
	Status       string `form:"status"`
	Q            string `form:"q"`
	Page         int    `form:"page,default=1"`
	PageSize     int    `form:"pageSize,default=20"`
}
