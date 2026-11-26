package audit

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
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

const maxCapturedAuditBody = 64 * 1024

type responseCaptureWriter struct {
	gin.ResponseWriter
	body bytes.Buffer
}

func (w *responseCaptureWriter) Write(b []byte) (int, error) {
	if w.body.Len() < maxCapturedAuditBody {
		rem := maxCapturedAuditBody - w.body.Len()
		if len(b) > rem {
			w.body.Write(b[:rem])
		} else {
			w.body.Write(b)
		}
	}
	return w.ResponseWriter.Write(b)
}

func (w *responseCaptureWriter) WriteString(s string) (int, error) {
	if w.body.Len() < maxCapturedAuditBody {
		rem := maxCapturedAuditBody - w.body.Len()
		if len(s) > rem {
			w.body.WriteString(s[:rem])
		} else {
			w.body.WriteString(s)
		}
	}
	return w.ResponseWriter.WriteString(s)
}

// WorkspaceMutationMiddleware records successful write operations under /api/v1/workspace
// when a handler has not already emitted a richer domain audit entry.
func WorkspaceMutationMiddleware(recorder Recorder) gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method
		isMutation := method == http.MethodPost || method == http.MethodPut ||
			method == http.MethodPatch || method == http.MethodDelete

		var reqBody []byte
		var capture *responseCaptureWriter
		if recorder != nil && isMutation && strings.HasPrefix(c.Request.URL.Path, "/api/v1/workspace/") {
			if c.Request.Body != nil {
				raw, err := io.ReadAll(io.LimitReader(c.Request.Body, maxCapturedAuditBody))
				if err == nil {
					reqBody = raw
					c.Request.Body = io.NopCloser(bytes.NewReader(raw))
				}
			}
			capture = &responseCaptureWriter{ResponseWriter: c.Writer}
			c.Writer = capture
		}

		c.Next()

		if recorder == nil || !isMutation {
			return
		}
		if _, already := c.Get(auditRecordedKey); already {
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
		action := deriveAction(method, path)

		var reqMap map[string]any
		if len(reqBody) > 0 {
			_ = json.Unmarshal(reqBody, &reqMap)
			reqMap = sanitizeAuditMap(reqMap)
		}

		var respMap map[string]any
		if capture != nil && capture.body.Len() > 0 {
			_ = json.Unmarshal(capture.body.Bytes(), &respMap)
			respMap = sanitizeAuditMap(respMap)
		}

		if entityID == "" && respMap != nil {
			if id, ok := respMap["id"].(string); ok && strings.TrimSpace(id) != "" {
				entityID = strings.TrimSpace(id)
			}
		}

		var newValues any
		if respMap != nil && len(respMap) > 0 {
			newValues = respMap
		} else if reqMap != nil && len(reqMap) > 0 {
			newValues = reqMap
		}

		details := map[string]any{
			"method": method,
			"path":   c.Request.URL.Path,
			"status": status,
		}
		if len(reqMap) > 0 {
			details["request"] = reqMap
		}

		_ = recorder.Record(c.Request.Context(), RecordInput{
			OrganizationID: claims.OrganizationID,
			ActorID:        actorID,
			ActorType:      actorType,
			Action:         action,
			EntityName:     entityName,
			EntityID:       entityID,
			NewValues:      newValues,
			Details:        details,
			ClientIP:       clientIP,
			UserAgent:      userAgent,
		})
	}
}

func deriveAction(method, fullPath string) string {
	lower := strings.ToLower(fullPath)
	switch {
	case strings.HasSuffix(lower, "/deactivate"):
		return "DEACTIVATE"
	case strings.HasSuffix(lower, "/reactivate"):
		return "REACTIVATE"
	case strings.HasSuffix(lower, "/review"):
		return "REVIEW"
	case strings.HasSuffix(lower, "/approve"):
		return "APPROVE"
	case strings.HasSuffix(lower, "/cancel"):
		return "CANCEL"
	case strings.HasSuffix(lower, "/check-in"):
		return "CHECK_IN"
	case strings.HasSuffix(lower, "/check-out"):
		return "CHECK_OUT"
	case strings.HasSuffix(lower, "/adjustments"):
		return "ADJUST"
	case strings.HasSuffix(lower, "/assign"):
		return "ASSIGN"
	}

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

func sanitizeAuditMap(m map[string]any) map[string]any {
	if m == nil {
		return nil
	}
	out := make(map[string]any, len(m))
	for k, v := range m {
		lower := strings.ToLower(k)
		if strings.Contains(lower, "password") || strings.Contains(lower, "secret") || strings.Contains(lower, "token") {
			out[k] = "[REDACTED]"
			continue
		}
		if nested, ok := v.(map[string]any); ok {
			out[k] = sanitizeAuditMap(nested)
		} else {
			out[k] = v
		}
	}
	return out
}

func deriveEntity(fullPath string, c *gin.Context) (string, string) {
	trimmed := strings.TrimPrefix(fullPath, "/api/v1/workspace/")
	parts := strings.Split(trimmed, "/")
	entity := parts[0]
	if len(parts) >= 3 && !strings.HasPrefix(parts[2], ":") &&
		parts[2] != "deactivate" && parts[2] != "reactivate" &&
		parts[2] != "review" && parts[2] != "cancel" {
		entity = parts[2]
	}

	var entityID string
	for _, key := range []string{
		"id", "branchId", "departmentId", "positionId", "employeeId",
		"shiftId", "holidayId", "contractId", "documentId", "roleId", "userId",
	} {
		if v := c.Param(key); v != "" {
			entityID = v
			break
		}
	}
	return strings.ReplaceAll(entity, "-", "_"), entityID
}
