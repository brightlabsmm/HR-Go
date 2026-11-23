package country

import "strings"

type Country struct {
	Code      string
	Name      string
	PhoneCode string
}

var SupportedCountries = []Country{
	{Code: "MM", Name: "Myanmar", PhoneCode: "+95"},
	{Code: "TH", Name: "Thailand", PhoneCode: "+66"},
	{Code: "SG", Name: "Singapore", PhoneCode: "+65"},
	{Code: "MY", Name: "Malaysia", PhoneCode: "+60"},
	{Code: "VN", Name: "Vietnam", PhoneCode: "+84"},
	{Code: "ID", Name: "Indonesia", PhoneCode: "+62"},
	{Code: "PH", Name: "Philippines", PhoneCode: "+63"},
	{Code: "CN", Name: "China", PhoneCode: "+86"},
	{Code: "JP", Name: "Japan", PhoneCode: "+81"},
	{Code: "US", Name: "United States", PhoneCode: "+1"},
	{Code: "GB", Name: "United Kingdom", PhoneCode: "+44"},
}

var validCodes = map[string]bool{
	"MM": true,
	"TH": true,
	"SG": true,
	"MY": true,
	"VN": true,
	"ID": true,
	"PH": true,
	"CN": true,
	"JP": true,
	"US": true,
	"GB": true,
}

// DefaultCountry is Myanmar (MM) as defined in the schema.
const DefaultCountry = "MM"

// IsValid reports whether the country code is in the allowed fixed list.
func IsValid(code string) bool {
	return validCodes[strings.ToUpper(strings.TrimSpace(code))]
}

// Normalize takes any raw string (including legacy/bad values like "Myanmar12", "မြန်မာ")
// and maps it to a valid country code. If unknown, it returns DefaultCountry.
func Normalize(raw string) string {
	cleaned := strings.ToUpper(strings.TrimSpace(raw))
	if validCodes[cleaned] {
		return cleaned
	}
	lower := strings.ToLower(raw)
	if strings.Contains(lower, "myanmar") || strings.Contains(raw, "မြန်မာ") || strings.Contains(lower, "burma") {
		return "MM"
	}
	if strings.Contains(lower, "thailand") || strings.Contains(lower, "thai") {
		return "TH"
	}
	if strings.Contains(lower, "singapore") {
		return "SG"
	}
	if strings.Contains(lower, "malaysia") {
		return "MY"
	}
	if strings.Contains(lower, "vietnam") {
		return "VN"
	}
	if strings.Contains(lower, "indonesia") {
		return "ID"
	}
	if strings.Contains(lower, "philippines") {
		return "PH"
	}
	if strings.Contains(lower, "china") {
		return "CN"
	}
	if strings.Contains(lower, "japan") {
		return "JP"
	}
	if strings.Contains(lower, "united states") || strings.Contains(lower, "usa") {
		return "US"
	}
	if strings.Contains(lower, "united kingdom") || strings.Contains(lower, "uk") {
		return "GB"
	}
	return DefaultCountry
}
