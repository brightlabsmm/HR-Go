package request

type CreateContractRequest struct {
	ContractType   string  `json:"contractType" binding:"required,max=50"`
	StartDate      string  `json:"startDate" binding:"required"`
	EndDate        *string `json:"endDate"`
	ContractStatus *string `json:"contractStatus"`
	Notes          *string `json:"notes"`
}

type UpdateContractRequest struct {
	ContractType   *string `json:"contractType"`
	StartDate      *string `json:"startDate"`
	EndDate        *string `json:"endDate"`
	ContractStatus *string `json:"contractStatus"`
	Notes          *string `json:"notes"`
}

type CreateDocumentRequest struct {
	DocumentType  string  `json:"documentType" binding:"required,max=50"`
	DocumentName  string  `json:"documentName" binding:"required,max=255"`
	FileReference string  `json:"fileReference" binding:"required"`
	ExpiryDate    *string `json:"expiryDate"`
}

type RecalculateServiceYearRequest struct {
	CalculationDate *string `json:"calculationDate"`
}

type RecordExitRequest struct {
	ExitType      string  `json:"exitType" binding:"required"`
	EffectiveDate string  `json:"effectiveDate" binding:"required"`
	Reason        *string `json:"reason"`
}
