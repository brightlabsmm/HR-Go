package country_test

import (
	"testing"

	"hrgo/backend/internal/shared/country"
)

func TestCountryValidation(t *testing.T) {
	t.Run("accepts valid country codes case-insensitively", func(t *testing.T) {
		valid := []string{"MM", "mm", "TH", "th", "SG", "sg", "US", "us", "GB", "gb", "JP", "jp"}
		for _, code := range valid {
			if !country.IsValid(code) {
				t.Errorf("expected %s to be valid", code)
			}
		}
	})

	t.Run("rejects invalid free-text country codes", func(t *testing.T) {
		invalid := []string{"Myanmar123!@#", "Myanmar12", "Myanmar 69", "မြန်မာ", "ABCDE", "test", "", "  "}
		for _, code := range invalid {
			if country.IsValid(code) {
				t.Errorf("expected %s to be invalid", code)
			}
		}
	})
}

func TestCountryNormalize(t *testing.T) {
	t.Run("normalizes legacy bad values and full country names", func(t *testing.T) {
		cases := []struct {
			input    string
			expected string
		}{
			{"Myanmar12", "MM"},
			{"Myanmar 69", "MM"},
			{"မြန်မာ", "MM"},
			{"myanmar", "MM"},
			{"Thailand", "TH"},
			{"Singapore", "SG"},
			{"United States", "US"},
			{"unknown-country", "MM"},
			{"", "MM"},
			{"th", "TH"},
			{"SG", "SG"},
		}

		for _, tc := range cases {
			got := country.Normalize(tc.input)
			if got != tc.expected {
				t.Errorf("Normalize(%q) = %q, expected %q", tc.input, got, tc.expected)
			}
		}
	})
}
