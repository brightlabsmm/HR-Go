package codeformat_test

import (
	"testing"

	"hrgo/backend/internal/shared/codeformat"
)

func TestFormat(t *testing.T) {
	tests := []struct {
		name     string
		pattern  string
		seq      int
		fallback string
		want     string
	}{
		{
			name:     "default branch format",
			pattern:  codeformat.DefaultBranchCodeFormat,
			seq:      1,
			fallback: codeformat.DefaultBranchCodeFormat,
			want:     "BR-0001",
		},
		{
			name:     "default department format",
			pattern:  codeformat.DefaultDepartmentCodeFormat,
			seq:      12,
			fallback: codeformat.DefaultDepartmentCodeFormat,
			want:     "DEPT-0012",
		},
		{
			name:     "custom 3-digit NNN placeholder",
			pattern:  "B-{NNN}",
			seq:      5,
			fallback: codeformat.DefaultBranchCodeFormat,
			want:     "B-005",
		},
		{
			name:     "SEQ placeholder defaults to 4-digit zero padding",
			pattern:  "BR-{SEQ}",
			seq:      5,
			fallback: codeformat.DefaultBranchCodeFormat,
			want:     "BR-0005",
		},
		{
			name:     "SEQ:3 placeholder with explicit width",
			pattern:  "DEP-{SEQ:3}",
			seq:      7,
			fallback: codeformat.DefaultDepartmentCodeFormat,
			want:     "DEP-007",
		},
		{
			name:     "plain prefix without braces",
			pattern:  "DEPT-",
			seq:      7,
			fallback: codeformat.DefaultDepartmentCodeFormat,
			want:     "DEPT-0007",
		},
		{
			name:     "empty pattern uses fallback",
			pattern:  "",
			seq:      3,
			fallback: codeformat.DefaultBranchCodeFormat,
			want:     "BR-0003",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := codeformat.Format(tc.pattern, tc.seq, tc.fallback); got != tc.want {
				t.Errorf("Format(%q, %d) = %q, want %q", tc.pattern, tc.seq, got, tc.want)
			}
		})
	}
}

func TestIsValidFormat(t *testing.T) {
	tests := []struct {
		pattern string
		valid   bool
	}{
		{"BR-{0000}", true},
		{"BR-{SEQ}", true},
		{"DEPT-{SEQ:3}", true},
		{"DEPT-{NNN}", true},
		{"{00}", true},
		{"", true},
		{"   ", true},
		{"XYZ", false},
		{"BRANCH", false},
		{"BR-0000", false},
	}

	for _, tc := range tests {
		t.Run(tc.pattern, func(t *testing.T) {
			if got := codeformat.IsValidFormat(tc.pattern); got != tc.valid {
				t.Errorf("IsValidFormat(%q) = %v, want %v", tc.pattern, got, tc.valid)
			}
		})
	}
}
