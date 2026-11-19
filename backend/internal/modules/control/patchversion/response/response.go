package response

import "time"

// PatchVersionResponse is the public current patch version.
type PatchVersionResponse struct {
	PatchVersion  string    `json:"patchVersion"`
	PatchDateTime time.Time `json:"patchDateTime"`
	Current       bool      `json:"current"`
}
