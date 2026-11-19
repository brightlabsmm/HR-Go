package filtering_test

import (
	"testing"

	"hrgo/backend/internal/shared/filtering"
)

func TestParseBasic(t *testing.T) {
	got := filtering.Parse([]string{
		"status:eq:ACTIVE",
		" code : like : ACME ",
		"",
		"bad",
		"field:unknownop:x",
		"createdAt:gte:2024-01-01",
		"parentId:isnull",
		"status:in:ACTIVE,SUSPENDED",
	})
	want := []filtering.Condition{
		{Field: "status", Op: "eq", Value: "ACTIVE"},
		{Field: "code", Op: "like", Value: "ACME"},
		{Field: "createdAt", Op: "gte", Value: "2024-01-01"},
		{Field: "parentId", Op: "isnull", Value: ""},
		{Field: "status", Op: "in", Value: "ACTIVE,SUSPENDED"},
	}
	if len(got) != len(want) {
		t.Fatalf("Parse len = %d, want %d (%v)", len(got), len(want), got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("Parse[%d] = %+v, want %+v", i, got[i], want[i])
		}
	}
}

func TestParseValueWithColons(t *testing.T) {
	got := filtering.Parse([]string{"note:eq:a:b:c"})
	if len(got) != 1 || got[0].Field != "note" || got[0].Op != "eq" || got[0].Value != "a:b:c" {
		t.Fatalf("Parse = %+v", got)
	}
}

func TestParsePreservesInCommas(t *testing.T) {
	// Commas must not split top-level filter entries (unlike sorting.Expand).
	got := filtering.Parse([]string{"status:in:ACTIVE,SUSPENDED"})
	if len(got) != 1 || got[0].Value != "ACTIVE,SUSPENDED" {
		t.Fatalf("Parse = %+v", got)
	}
}
