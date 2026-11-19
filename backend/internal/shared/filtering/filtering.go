package filtering

import (
	"strings"

	"gorm.io/gorm"
)

// Params holds multi-condition list filter query parameters.
//
// Named Params (not Query) so list DTOs can embed sorting.Query and
// filtering.Params together without an anonymous-field name clash.
//
// Contract (GET query):
//   - filter: one or more conditions (repeat param)
//   - each entry: field:op:value (value may contain ':' and ',')
//
// Example: filter=status:eq:ACTIVE&filter=code:like:ACME&filter=status:in:ACTIVE,SUSPENDED
//
// Conditions are AND-combined. Unknown fields/ops are ignored (same as sorting).
type Params struct {
	Filter []string `form:"filter"`
}

// Condition is a parsed field/op/value triple.
type Condition struct {
	Field string
	Op    string
	Value string
}

// Options configures whitelist mapping for a list endpoint.
type Options struct {
	// Allowed maps lowercased API field names to SQL expressions/columns.
	Allowed map[string]string
}

var allowedOps = map[string]struct{}{
	"eq": {}, "ne": {},
	"gt": {}, "gte": {}, "lt": {}, "lte": {},
	"like": {}, "ilike": {},
	"in":     {},
	"isnull": {}, "notnull": {},
}

// Parse turns raw filter query values into Conditions.
// Entries that are empty or missing field/op are skipped.
// Unlike sorting.Expand, commas inside a single filter entry are preserved
// (needed for op=in value lists).
func Parse(values []string) []Condition {
	if len(values) == 0 {
		return nil
	}
	out := make([]Condition, 0, len(values))
	for _, raw := range values {
		raw = strings.TrimSpace(raw)
		if raw == "" {
			continue
		}
		field, rest, ok := strings.Cut(raw, ":")
		if !ok {
			continue
		}
		op, value, ok := strings.Cut(rest, ":")
		if !ok {
			// Allow isnull/notnull without a trailing value: field:isnull
			op = rest
			value = ""
		}
		field = strings.TrimSpace(field)
		op = strings.ToLower(strings.TrimSpace(op))
		if field == "" || op == "" {
			continue
		}
		if _, ok := allowedOps[op]; !ok {
			continue
		}
		out = append(out, Condition{
			Field: field,
			Op:    op,
			Value: strings.TrimSpace(value),
		})
	}
	return out
}

// Apply attaches whitelisted WHERE clauses (AND) to db.
func Apply(db *gorm.DB, filters []string, opt Options) *gorm.DB {
	for _, c := range Parse(filters) {
		col, ok := opt.Allowed[normalizeField(c.Field)]
		if !ok || col == "" {
			continue
		}
		db = applyCondition(db, col, c)
	}
	return db
}

func applyCondition(db *gorm.DB, col string, c Condition) *gorm.DB {
	switch c.Op {
	case "eq":
		return db.Where(col+" = ?", c.Value)
	case "ne":
		return db.Where(col+" <> ?", c.Value)
	case "gt":
		return db.Where(col+" > ?", c.Value)
	case "gte":
		return db.Where(col+" >= ?", c.Value)
	case "lt":
		return db.Where(col+" < ?", c.Value)
	case "lte":
		return db.Where(col+" <= ?", c.Value)
	case "like":
		return db.Where(col+" LIKE ?", wrapLike(c.Value))
	case "ilike":
		return db.Where("LOWER("+col+") LIKE ?", strings.ToLower(wrapLike(c.Value)))
	case "in":
		parts := splitCSV(c.Value)
		if len(parts) == 0 {
			return db
		}
		return db.Where(col+" IN ?", parts)
	case "isnull":
		return db.Where(col + " IS NULL")
	case "notnull":
		return db.Where(col + " IS NOT NULL")
	default:
		return db
	}
}

func normalizeField(field string) string {
	return strings.ToLower(strings.TrimSpace(field))
}

func wrapLike(value string) string {
	return "%" + value + "%"
}

func splitCSV(value string) []string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}
