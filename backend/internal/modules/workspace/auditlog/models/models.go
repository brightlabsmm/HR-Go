package models

import (
	"encoding/json"
	"time"
)

type AuditLog struct {
	ID             string          `gorm:"type:uuid;primaryKey"`
	OrganizationID *string         `gorm:"column:organization_id"`
	ActorID        *string         `gorm:"column:actor_id"`
	ActorType      string          `gorm:"column:actor_type"`
	ActorName      *string         `gorm:"->;column:actor_name"`
	ActorCode      *string         `gorm:"->;column:actor_code"`
	Action         string          `gorm:"column:action"`
	EntityName     string          `gorm:"column:entity_name"`
	EntityID       *string         `gorm:"column:entity_id"`
	OldValues      json.RawMessage `gorm:"column:old_values"`
	NewValues      json.RawMessage `gorm:"column:new_values"`
	Details        json.RawMessage `gorm:"column:details"`
	ClientIP       *string         `gorm:"column:client_ip"`
	UserAgent      *string         `gorm:"column:user_agent"`
	CreatedAt      time.Time       `gorm:"column:created_at"`
}

func (AuditLog) TableName() string {
	return "audit_logs"
}
