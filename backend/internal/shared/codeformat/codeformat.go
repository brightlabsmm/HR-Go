package codeformat

import (
	"fmt"
	"regexp"
	"strings"
)

const (
	SettingKeyBranchCodeFormat     = "branch_code_format"
	SettingKeyDepartmentCodeFormat = "department_code_format"

	DefaultBranchCodeFormat     = "BR-{0000}"
	DefaultDepartmentCodeFormat = "DEPT-{0000}"
)

var seqPlaceholderRegex = regexp.MustCompile(`(?i)\{(?:[0N#]+|SEQ(?::(\d+))?)\}`)

// IsValidFormat checks whether pattern contains a valid sequence placeholder like {0000}, {NNNN}, or {SEQ}.
// An empty or whitespace-only pattern is considered valid because it falls back to the default format.
func IsValidFormat(pattern string) bool {
	trimmed := strings.TrimSpace(pattern)
	if trimmed == "" {
		return true
	}
	return seqPlaceholderRegex.MatchString(trimmed)
}

// Format generates a formatted entity code from a format template and 1-based sequence number.
// Supported sequence placeholders include {0000}, {NNNN}, {000}, {NNN}, {SEQ}, {SEQ:4}, etc.
// If no placeholder is present in pattern, pattern is used as a prefix with 4-digit zero padding.
func Format(pattern string, seq int, fallbackPattern string) string {
	if seq < 1 {
		seq = 1
	}

	tpl := strings.TrimSpace(pattern)
	if tpl == "" {
		tpl = fallbackPattern
	}

	if seqPlaceholderRegex.MatchString(tpl) {
		return seqPlaceholderRegex.ReplaceAllStringFunc(tpl, func(match string) string {
			inner := strings.ToUpper(strings.Trim(match, "{}"))
			width := 4
			if strings.HasPrefix(inner, "SEQ") {
				if idx := strings.Index(inner, ":"); idx >= 0 {
					var parsed int
					if _, err := fmt.Sscanf(inner[idx+1:], "%d", &parsed); err == nil && parsed > 0 && parsed <= 12 {
						width = parsed
					}
				}
			} else if len(inner) >= 1 {
				width = len(inner)
			}
			return fmt.Sprintf("%0*d", width, seq)
		})
	}

	prefix := strings.TrimRight(tpl, "-_")
	return fmt.Sprintf("%s-%04d", prefix, seq)
}
