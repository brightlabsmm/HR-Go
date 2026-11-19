package repository

import (
	"errors"
	"fmt"
	"strconv"
)

const versionWidth = 2

// ErrInvalidVersion means the stored patch version is not 00.00.00.
var ErrInvalidVersion = errors.New("patch version must match 00.00.00")

// ErrOverflow means the next version would exceed 99.99.99.
var ErrOverflow = errors.New("patch version cannot increase past 99.99.99")

// NextPatchVersion increments the last segment of a 00.00.00 version.
// A segment that would pass 99 rolls to 00 and carries 1 to the left.
func NextPatchVersion(current string) (string, error) {
	parts, err := parseVersion(current)
	if err != nil {
		return "", err
	}

	parts[2]++
	if parts[2] > 99 {
		parts[2] = 0
		parts[1]++
	}
	if parts[1] > 99 {
		parts[1] = 0
		parts[0]++
	}
	if parts[0] > 99 {
		return "", ErrOverflow
	}

	return fmt.Sprintf("%02d.%02d.%02d", parts[0], parts[1], parts[2]), nil
}

func parseVersion(value string) ([3]int, error) {
	var parts [3]int
	if len(value) != 8 || value[2] != '.' || value[5] != '.' {
		return parts, ErrInvalidVersion
	}

	for i, start := range []int{0, 3, 6} {
		segment := value[start : start+versionWidth]
		n, err := strconv.Atoi(segment)
		if err != nil || n < 0 || n > 99 || fmt.Sprintf("%02d", n) != segment {
			return parts, ErrInvalidVersion
		}
		parts[i] = n
	}
	return parts, nil
}
