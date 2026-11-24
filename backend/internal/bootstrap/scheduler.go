package bootstrap

import (
	"context"

	orgrepo "hrgo/backend/internal/modules/control/organization/repository"
	orgsvc "hrgo/backend/internal/modules/control/organization/service"
	"hrgo/backend/internal/scheduler"
)

// StartSchedulers initializes and starts background schedulers with the provided context.
func StartSchedulers(ctx context.Context, deps Dependencies) {
	if deps.DB == nil {
		return
	}

	repo := orgrepo.New(deps.DB)
	svc := orgsvc.New(repo)
	sched := scheduler.NewOrgSuspendScheduler(svc, deps.Config.OrgSuspendCheckInterval, deps.Logger)

	go sched.Run(ctx)
}
