package audit

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"hrgo/backend/internal/shared/security"
)

const auditRecordedKey = "hrgo_audit_recorded"

// Entry captures a single audit trail event persisted into audit_logs.
type Entry struct {
	ID             string          `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	OrganizationID *string         `gorm:"column:organization_id"`
	ActorID        *string         `gorm:"column:actor_id"`
	ActorType      string          `gorm:"column:actor_type"`
	Action         string          `gorm:"column:action"`
	EntityName     string          `gorm:"column:entity_name"`
	EntityID       *string         `gorm:"column:entity_id"`
	OldValues      json.RawMessage `gorm:"column:old_values;type:jsonb"`
	NewValues      json.RawMessage `gorm:"column:new_values;type:jsonb"`
	Details        json.RawMessage `gorm:"column:details;type:jsonb"`
	ClientIP       *string         `gorm:"column:client_ip"`
	UserAgent      *string         `gorm:"column:user_agent"`
	CreatedAt      time.Time       `gorm:"column:created_at"`
}

func (Entry) TableName() string {
	return "audit_logs"
}

// RecordInput describes a mutation to write to audit_logs.
type RecordInput struct {
	OrganizationID string
	ActorID        string
	ActorType      string
	Action         string
	EntityName     string
	EntityID       string
	OldValues      any
	NewValues      any
	Details        any
	ClientIP       string
	UserAgent      string
}

type Recorder interface {
	Record(ctx context.Context, input RecordInput) error
}

type gormRecorder struct {
	db *gorm.DB
}

func NewRecorder(db *gorm.DB) Recorder {
	return &gormRecorder{db: db}
}

func (r *gormRecorder) Record(ctx context.Context, input RecordInput) error {
	if r == nil || r.db == nil {
		return nil
	}

	entry := Entry{
		ActorType:  nonEmpty(input.ActorType, "WORKSPACE"),
		Action:     nonEmpty(input.Action, "MUTATION"),
		EntityName: nonEmpty(input.EntityName, "unknown"),
		CreatedAt:  time.Now().UTC(),
	}
	if input.OrganizationID != "" {
		orgID := input.OrganizationID
		entry.OrganizationID = &orgID
	}
	if input.ActorID != "" {
		actorID := input.ActorID
		entry.ActorID = &actorID
	}
	if input.EntityID != "" {
		entityID := input.EntityID
		entry.EntityID = &entityID
	}
	if input.ClientIP != "" {
		ip := input.ClientIP
		entry.ClientIP = &ip
	}
	if input.UserAgent != "" {
		ua := input.UserAgent
		entry.UserAgent = &ua
	}

	if raw, ok := marshalJSONB(input.OldValues); ok {
		entry.OldValues = raw
	}
	if raw, ok := marshalJSONB(input.NewValues); ok {
		entry.NewValues = raw
	}
	if raw, ok := marshalJSONB(input.Details); ok {
		entry.Details = raw
	}

	return r.db.WithContext(ctx).Create(&entry).Error
}

func marshalJSONB(v any) (json.RawMessage, bool) {
	if v == nil {
		return nil, false
	}
	if raw, ok := v.(json.RawMessage); ok {
		if len(raw) == 0 {
			return nil, false
		}
		return raw, true
	}
	b, err := json.Marshal(v)
	if err != nil || string(b) == "null" {
		return nil, false
	}
	return json.RawMessage(b), true
}

func nonEmpty(val, fallback string) string {
	if strings.TrimSpace(val) == "" {
		return fallback
	}
	return val
}

// MarkRecorded marks the current request as explicitly audited by the domain handler/service
// so the HTTP fallback middleware does not emit a duplicate audit row.
func MarkRecorded(c *gin.Context) {
	if c != nil {
		c.Set(auditRecordedKey, true)
	}
}

// MetaFromGin extracts actor metadata for explicit audit entries.
func MetaFromGin(c *gin.Context) (actorID, actorType, clientIP, userAgent string) {
	actorType = "WORKSPACE"
	if c == nil {
		return "", actorType, "", ""
	}
	if claims := security.GetClaims(c); claims != nil {
		actorID = claims.UserID
		if claims.AuthContext != "" {
			actorType = string(claims.AuthContext)
		}
	}
	return actorID, actorType, c.ClientIP(), c.Request.UserAgent()
}

// WorkspaceMutationMiddleware records successful write operations under /api/v1/workspace
// when a handler has not already emitted a richer domain audit entry.
func WorkspaceMutationMiddleware(recorder Recorder) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if recorder == nil {
			return
		}
		if _, already := c.Get(auditRecordedKey); already {
			return
		}

		method := c.Request.Method
		if method != http.MethodPost && method != http.MethodPut &&
			method != http.MethodPatch && method != http.MethodDelete {
			return
		}

		status := c.Writer.Status()
		if status < 200 || status >= 300 {
			return
		}

		path := c.FullPath()
		if !strings.HasPrefix(path, "/api/v1/workspace/") {
			return
		}

		claims := security.GetClaims(c)
		if claims == nil || claims.OrganizationID == "" {
			return
		}

		actorID, actorType, clientIP, userAgent := MetaFromGin(c)
		entityName, entityID := deriveEntity(path, c)

		_ = recorder.Record(c.Request.Context(), RecordInput{
			OrganizationID: claims.OrganizationID,
			ActorID:        actorID,
			ActorType:      actorType,
			Action:         methodToAction(method),
			EntityName:     entityName,
			EntityID:       entityID,
			Details: map[string]any{
				"method": method,
				"path":   c.Request.URL.Path,
				"status": status,
			},
			ClientIP:  clientIP,
			UserAgent: userAgent,
		})
	}
}

func methodToAction(method string) string {
	switch method {
	case http.MethodPost:
		return "CREATE"
	case http.MethodPut, http.MethodPatch:
		return "UPDATE"
	case http.MethodDelete:
		return "DELETE"
	default:
		return "MUTATION"
	}
}

func deriveEntity(fullPath string, c *gin.Context) (string, string) {
	trimmed := strings.TrimPrefix(fullPath, "/api/v1/workspace/")
	parts := strings.Split(trimmed, "/")
	entity := parts[0]
	if len(parts) >= 3 && !strings.HasPrefix(parts[2], ":") {
		entity = parts[2]
	}

	var entityID string
	for _, key := range []string{"id", "branchId", "contractId", "documentId", "roleId", "userId"} {
		if v := c.Param(key); v != "" {
			entityID = v
			break
		}
	}
	return strings.ReplaceAll(entity, "-", "_"), entityID
}
