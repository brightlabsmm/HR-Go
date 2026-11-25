package response

import (
	"encoding/json"
	"time"
)

type ImportBatchError struct {
	Row     int    `json:"row"`
	Message string `json:"message"`
}

type ImportBatchResponse struct {
	ID                  string          `json:"id"`
	OrganizationID      string          `json:"organizationId"`
	ImportedByAccountID *string         `json:"importedByAccountId"`
	FileReference       string          `json:"fileReference"`
	TotalRows           int             `json:"totalRows"`
	SuccessRows         int             `json:"successRows"`
	FailedRows          int             `json:"failedRows"`
	ImportStatus        string          `json:"importStatus"`
	ErrorSummary        json.RawMessage `json:"errorSummary,omitempty"`
	CreatedAt           time.Time       `json:"createdAt"`
}
