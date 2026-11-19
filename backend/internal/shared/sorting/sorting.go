package sorting

import (
	"strings"

	"gorm.io/gorm"
)

// Query holds multi-column list sort query parameters.
//
// Contract (GET query):
//   - sortBy: one or more fields (repeat param and/or comma-separated)
//   - sortOrder: parallel asc/desc values (repeat param and/or comma-separated)
//   - sortDirection: legacy alias for sortOrder (still accepted)
//
// Pairing: sortOrder[i] applies to sortBy[i]. If only one sortOrder value is
// provided, it applies to every sortBy column. Missing orders use DefaultOrder.
type Query struct {
	SortBy        []string `form:"sortBy"`
	SortOrder     []string `form:"sortOrder"`
	SortDirection []string `form:"sortDirection"`
}

// Options configures whitelist mapping and defaults for a list endpoint.
type Options struct {
	// Allowed maps lowercased API field names to SQL expressions/columns.
	Allowed map[string]string
	// Default is the full ORDER BY clause used when no valid sortBy is given.
	Default string
	// DefaultOrder is ASC or DESC when sortBy is set but an order slot is missing.
	// Empty means DESC.
	DefaultOrder string
}

// Orders returns the effective order list, preferring sortOrder over legacy sortDirection.
func (q Query) Orders() []string {
	if expanded := Expand(q.SortOrder); len(expanded) > 0 {
		return expanded
	}
	return Expand(q.SortDirection)
}

// Expand flattens repeated and comma-separated query values.
func Expand(values []string) []string {
	if len(values) == 0 {
		return nil
	}
	out := make([]string, 0, len(values))
	for _, v := range values {
		for _, part := range strings.Split(v, ",") {
			part = strings.TrimSpace(part)
			if part != "" {
				out = append(out, part)
			}
		}
	}
	return out
}

// Clause builds a safe ORDER BY clause from whitelisted sort fields.
func Clause(sortBy, sortOrder []string, opt Options) string {
	fields := Expand(sortBy)
	orders := Expand(sortOrder)
	defaultOrder := strings.ToUpper(strings.TrimSpace(opt.DefaultOrder))
	if defaultOrder != "ASC" {
		defaultOrder = "DESC"
	}

	parts := make([]string, 0, len(fields))
	for i, field := range fields {
		col, ok := opt.Allowed[strings.ToLower(strings.TrimSpace(field))]
		if !ok || col == "" {
			continue
		}
		parts = append(parts, col+" "+orderAt(orders, i, defaultOrder))
	}

	if len(parts) == 0 {
		if strings.TrimSpace(opt.Default) != "" {
			return opt.Default
		}
		return "created_at " + defaultOrder
	}
	return strings.Join(parts, ", ")
}

// Apply attaches a whitelisted ORDER BY clause to db.
func Apply(db *gorm.DB, sortBy, sortOrder []string, opt Options) *gorm.DB {
	return db.Order(Clause(sortBy, sortOrder, opt))
}

func orderAt(orders []string, index int, defaultOrder string) string {
	var raw string
	switch {
	case index < len(orders):
		raw = orders[index]
	case len(orders) == 1:
		raw = orders[0]
	default:
		return defaultOrder
	}
	if strings.EqualFold(strings.TrimSpace(raw), "asc") {
		return "ASC"
	}
	return "DESC"
}
