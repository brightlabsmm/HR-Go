package mapper

import (
	"time"

	"hrgo/backend/internal/modules/control/patchversion/models"
	"hrgo/backend/internal/modules/control/patchversion/response"
)

// bangkok is a fixed UTC+7 zone. Asia/Bangkok does not observe daylight saving.
var bangkok = time.FixedZone("Asia/Bangkok", 7*60*60)

func ToPatchVersionResponse(row *models.ApplicationPatchVersion) response.PatchVersionResponse {
	return response.PatchVersionResponse{
		PatchVersion:  row.PatchVersion,
		PatchDateTime: row.PatchDateTime.In(bangkok),
		Current:       row.IsCurrent,
	}
}
