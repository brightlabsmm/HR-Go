package response

import (
	"encoding/json"
	"time"
)

type AuditLogResponse struct {
	ID             string          `json:"id"`
	OrganizationID *string         `json:"organizationId"`
	ActorID        *string         `json:"actorId"`
	ActorType      string          `json:"actorType"`
	ActorName      *string         `json:"actorName,omitempty"`
	ActorCode      *string         `json:"actorCode,omitempty"`
	Action         string          `json:"action"`
	EntityName     string          `json:"entityName"`
	EntityID       *string         `json:"entityId"`
	OldValues      json.RawMessage `json:"oldValues,omitempty"`
	NewValues      json.RawMessage `json:"newValues,omitempty"`
	Details        json.RawMessage `json:"details,omitempty"`
	ClientIP       *string         `json:"clientIp,omitempty"`
	UserAgent      *string         `json:"userAgent,omitempty"`
	CreatedAt      time.Time       `json:"createdAt"`
}
