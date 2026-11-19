package sorting_test

import (
	"testing"

	"hrgo/backend/internal/shared/sorting"
)

func TestExpand(t *testing.T) {
	got := sorting.Expand([]string{"status", "code,name", " , "})
	want := []string{"status", "code", "name"}
	if len(got) != len(want) {
		t.Fatalf("Expand len = %d, want %d (%v)", len(got), len(want), got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("Expand[%d] = %q, want %q", i, got[i], want[i])
		}
	}
}

func TestQueryOrdersPrefersSortOrder(t *testing.T) {
	q := sorting.Query{
		SortOrder:     []string{"asc"},
		SortDirection: []string{"desc"},
	}
	got := q.Orders()
	if len(got) != 1 || got[0] != "asc" {
		t.Fatalf("Orders() = %v, want [asc]", got)
	}
}

func TestClauseMultiColumn(t *testing.T) {
	opt := sorting.Options{
		Allowed: map[string]string{
			"status": "status",
			"code":   "code",
			"name":   "name",
		},
		Default:      "created_at DESC",
		DefaultOrder: "DESC",
	}

	got := sorting.Clause([]string{"status", "code"}, []string{"asc", "desc"}, opt)
	want := "status ASC, code DESC"
	if got != want {
		t.Fatalf("Clause = %q, want %q", got, want)
	}
}

func TestClauseSingleOrderAppliesToAll(t *testing.T) {
	opt := sorting.Options{
		Allowed: map[string]string{
			"name": "name",
			"code": "code",
		},
		Default:      "created_at DESC",
		DefaultOrder: "DESC",
	}

	got := sorting.Clause([]string{"name,code"}, []string{"asc"}, opt)
	want := "name ASC, code ASC"
	if got != want {
		t.Fatalf("Clause = %q, want %q", got, want)
	}
}

func TestClauseUnknownFallsBackToDefault(t *testing.T) {
	opt := sorting.Options{
		Allowed: map[string]string{
			"name": "name",
		},
		Default: "created_at DESC",
	}

	got := sorting.Clause([]string{"notAField"}, nil, opt)
	if got != "created_at DESC" {
		t.Fatalf("Clause = %q, want created_at DESC", got)
	}
}

func TestClauseDefaultOrderWhenMissing(t *testing.T) {
	opt := sorting.Options{
		Allowed: map[string]string{
			"name": "name",
		},
		Default:      "created_at DESC",
		DefaultOrder: "ASC",
	}

	got := sorting.Clause([]string{"name"}, nil, opt)
	if got != "name ASC" {
		t.Fatalf("Clause = %q, want name ASC", got)
	}
}
