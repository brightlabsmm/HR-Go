package bootstrap

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"hrgo/backend/internal/apidocs"
	"hrgo/backend/internal/config"
	"hrgo/backend/internal/database"
	"hrgo/backend/internal/middleware"
	ctrlauthhandler "hrgo/backend/internal/modules/control/auth/handler"
	ctrlauthrepo "hrgo/backend/internal/modules/control/auth/repository"
	ctrlauthroutes "hrgo/backend/internal/modules/control/auth/routes"
	ctrlauthsvc "hrgo/backend/internal/modules/control/auth/service"
	orghandler "hrgo/backend/internal/modules/control/organization/handler"
	orgrepo "hrgo/backend/internal/modules/control/organization/repository"
	orgroutes "hrgo/backend/internal/modules/control/organization/routes"
	orgsvc "hrgo/backend/internal/modules/control/organization/service"
	patchversionhandler "hrgo/backend/internal/modules/control/patchversion/handler"
	patchversionrepo "hrgo/backend/internal/modules/control/patchversion/repository"
	patchversionroutes "hrgo/backend/internal/modules/control/patchversion/routes"
	patchversionsvc "hrgo/backend/internal/modules/control/patchversion/service"
	rolehandler "hrgo/backend/internal/modules/control/role/handler"
	rolerepo "hrgo/backend/internal/modules/control/role/repository"
	roleroutes "hrgo/backend/internal/modules/control/role/routes"
	rolesvc "hrgo/backend/internal/modules/control/role/service"
	userhandler "hrgo/backend/internal/modules/control/user/handler"
	userrepo "hrgo/backend/internal/modules/control/user/repository"
	userroutes "hrgo/backend/internal/modules/control/user/routes"
	usersvc "hrgo/backend/internal/modules/control/user/service"
	wsauthhandler "hrgo/backend/internal/modules/workspace/auth/handler"
	wsauthrepo "hrgo/backend/internal/modules/workspace/auth/repository"
	wsauthroutes "hrgo/backend/internal/modules/workspace/auth/routes"
	wsauthsvc "hrgo/backend/internal/modules/workspace/auth/service"
	branchhandler "hrgo/backend/internal/modules/workspace/branch/handler"
	branchrepo "hrgo/backend/internal/modules/workspace/branch/repository"
	branchroutes "hrgo/backend/internal/modules/workspace/branch/routes"
	branchsvc "hrgo/backend/internal/modules/workspace/branch/service"
	depthandler "hrgo/backend/internal/modules/workspace/department/handler"
	deptrepo "hrgo/backend/internal/modules/workspace/department/repository"
	deptroutes "hrgo/backend/internal/modules/workspace/department/routes"
	deptsvc "hrgo/backend/internal/modules/workspace/department/service"
	wsorghandler "hrgo/backend/internal/modules/workspace/organization/handler"
	wsorgrepo "hrgo/backend/internal/modules/workspace/organization/repository"
	wsorgroutes "hrgo/backend/internal/modules/workspace/organization/routes"
	wsorgsvc "hrgo/backend/internal/modules/workspace/organization/service"
	poshandler "hrgo/backend/internal/modules/workspace/position/handler"
	posrepo "hrgo/backend/internal/modules/workspace/position/repository"
	posroutes "hrgo/backend/internal/modules/workspace/position/routes"
	possvc "hrgo/backend/internal/modules/workspace/position/service"
	wsrolehandler "hrgo/backend/internal/modules/workspace/role/handler"
	wsrolerepo "hrgo/backend/internal/modules/workspace/role/repository"
	wsroleroutes "hrgo/backend/internal/modules/workspace/role/routes"
	wsrolesvc "hrgo/backend/internal/modules/workspace/role/service"
	wsuserhandler "hrgo/backend/internal/modules/workspace/user/handler"
	wsuserrepo "hrgo/backend/internal/modules/workspace/user/repository"
	wsuserroutes "hrgo/backend/internal/modules/workspace/user/routes"
	wsusersvc "hrgo/backend/internal/modules/workspace/user/service"

	// Phase 2: Workforce & Attendance
	employeehandler "hrgo/backend/internal/modules/workspace/employee/handler"
	employeerepo "hrgo/backend/internal/modules/workspace/employee/repository"
	employeeroutes "hrgo/backend/internal/modules/workspace/employee/routes"
	employeesvc "hrgo/backend/internal/modules/workspace/employee/service"

	shifthandler "hrgo/backend/internal/modules/workspace/shift/handler"
	shiftrepo "hrgo/backend/internal/modules/workspace/shift/repository"
	shiftroutes "hrgo/backend/internal/modules/workspace/shift/routes"
	shiftsvc "hrgo/backend/internal/modules/workspace/shift/service"

	holidayhandler "hrgo/backend/internal/modules/workspace/holiday/handler"
	holidayrepo "hrgo/backend/internal/modules/workspace/holiday/repository"
	holidayroutes "hrgo/backend/internal/modules/workspace/holiday/routes"
	holidaysvc "hrgo/backend/internal/modules/workspace/holiday/service"

	attendancehandler "hrgo/backend/internal/modules/workspace/attendance/handler"
	attendancerepo "hrgo/backend/internal/modules/workspace/attendance/repository"
	attendanceroutes "hrgo/backend/internal/modules/workspace/attendance/routes"
	attendancesvc "hrgo/backend/internal/modules/workspace/attendance/service"

	mobilehandler "hrgo/backend/internal/modules/workspace/mobile/handler"
	mobilerepo "hrgo/backend/internal/modules/workspace/mobile/repository"
	mobileroutes "hrgo/backend/internal/modules/workspace/mobile/routes"
	mobilesvc "hrgo/backend/internal/modules/workspace/mobile/service"

	apperrors "hrgo/backend/internal/shared/errors"
	"hrgo/backend/internal/shared/responses"
	"hrgo/backend/internal/shared/security"
)

// Dependencies groups shared infrastructure dependencies wired into the HTTP engine.
type Dependencies struct {
	Config config.Config
	Logger *slog.Logger
	DB     *gorm.DB
}

// NewEngine constructs the Gin engine with shared middleware, probes, and all API routes.
func NewEngine(deps Dependencies) *gin.Engine {
	if deps.Config.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	logger := deps.Logger
	if logger == nil {
		logger = slog.Default()
	}

	tokenManager := security.NewTokenManager(deps.Config.JWTSecret)
	secMiddleware := security.NewMiddleware(tokenManager)
	if deps.DB != nil {
		secMiddleware.SetOrgStatusChecker(func(ctx context.Context, orgID string) (string, error) {
			var status string
			err := deps.DB.WithContext(ctx).Table("organizations").Select("status").Where("id = ? AND deleted_at IS NULL", orgID).Scan(&status).Error
			return status, err
		})
		secMiddleware.SetWorkspaceSessionChecker(func(ctx context.Context, claims *security.Claims) (bool, error) {
			if claims == nil || claims.OrganizationID == "" {
				return false, nil
			}

			var org struct {
				SessionsRevokedAt *time.Time
			}
			if err := deps.DB.WithContext(ctx).Table("organizations").
				Select("sessions_revoked_at").
				Where("id = ? AND deleted_at IS NULL", claims.OrganizationID).
				Scan(&org).Error; err != nil {
				return false, err
			}

			if org.SessionsRevokedAt != nil && claims.IssuedAt != nil {
				if claims.IssuedAt.Time.Before(*org.SessionsRevokedAt) {
					return false, nil
				}
			}

			if claims.SessionID == "" {
				return false, nil
			}

			var count int64
			err := deps.DB.WithContext(ctx).Table("workspace_sessions").
				Where("id = ? AND revoked_at IS NULL AND expires_at > ?", claims.SessionID, time.Now().UTC()).
				Count(&count).Error
			if err != nil {
				return false, err
			}
			return count > 0, nil
		})
	}

	// Ensure Superadmin platform user if DB is present
	if deps.DB != nil {
		ctrlAuthRepo := ctrlauthrepo.New(deps.DB)
		ctrlAuthService := ctrlauthsvc.New(ctrlAuthRepo, tokenManager)
		_ = ctrlAuthService.EnsureSuperadmin(
			context.Background(),
			deps.Config.PlatformAdminEmail,
			deps.Config.PlatformAdminPassword,
			deps.Config.PlatformAdminFullName,
		)
	}

	engine := gin.New()
	engine.Use(
		middleware.RequestID(),
		middleware.Recovery(logger),
		middleware.Logger(logger),
		middleware.SecurityHeaders(),
		middleware.MaxBodySize(deps.Config.MaxBodyBytes),
		middleware.CORS(deps.Config.CORSAllowedOrigins),
	)

	engine.NoRoute(func(c *gin.Context) {
		responses.Fail(c, apperrors.NotFound("Route not found."))
	})

	registerProbes(engine, deps.DB)
	apidocs.Register(engine)

	// API v1 Routing
	v1 := engine.Group("/api/v1")
	if deps.DB != nil {
		// Public. Registered on the engine so it is outside every auth middleware group.
		patchVersionRepo := patchversionrepo.New(deps.DB)
		patchVersionService := patchversionsvc.New(patchVersionRepo)
		patchversionroutes.Register(engine, patchversionhandler.New(patchVersionService))

		// Control modules
		ctrlAuthRepo := ctrlauthrepo.New(deps.DB)
		ctrlAuthService := ctrlauthsvc.New(ctrlAuthRepo, tokenManager)
		ctrlauthroutes.Register(v1, ctrlauthhandler.New(ctrlAuthService), secMiddleware)

		orgRepo := orgrepo.New(deps.DB)
		orgService := orgsvc.New(orgRepo)
		orgroutes.Register(v1, orghandler.New(orgService), secMiddleware)

		roleRepo := rolerepo.New(deps.DB)
		roleService := rolesvc.New(roleRepo)
		roleroutes.Register(v1, rolehandler.New(roleService), secMiddleware)

		userRepo := userrepo.New(deps.DB)
		userService := usersvc.New(userRepo)
		userroutes.Register(v1, userhandler.New(userService), secMiddleware)

		// Workspace modules
		wsAuthRepo := wsauthrepo.New(deps.DB)
		wsAuthService := wsauthsvc.New(wsAuthRepo, tokenManager)
		wsauthroutes.Register(v1, wsauthhandler.New(wsAuthService), secMiddleware)

		branchRepo := branchrepo.New(deps.DB)
		branchService := branchsvc.New(branchRepo)
		branchroutes.Register(v1, branchhandler.New(branchService), secMiddleware)

		deptRepo := deptrepo.New(deps.DB)
		deptService := deptsvc.New(deptRepo)
		deptroutes.Register(v1, depthandler.New(deptService), secMiddleware)

		posRepo := posrepo.New(deps.DB)
		posService := possvc.New(posRepo)
		posroutes.Register(v1, poshandler.New(posService), secMiddleware)

		wsRoleRepo := wsrolerepo.New(deps.DB)
		wsRoleService := wsrolesvc.New(wsRoleRepo)
		wsroleroutes.Register(v1, wsrolehandler.New(wsRoleService), secMiddleware)

		wsOrgRepo := wsorgrepo.New(deps.DB)
		wsOrgService := wsorgsvc.New(wsOrgRepo)
		wsorgroutes.Register(v1, wsorghandler.New(wsOrgService), secMiddleware)

		wsUserRepo := wsuserrepo.New(deps.DB)
		wsUserService := wsusersvc.New(wsUserRepo)
		wsuserroutes.Register(v1, wsuserhandler.New(wsUserService), secMiddleware)

		// Phase 2: Employee management
		empRepo := employeerepo.New(deps.DB)
		empService := employeesvc.New(empRepo)
		employeeroutes.Register(v1, employeehandler.New(empService), secMiddleware)

		// Phase 2: Shift management
		shiftRepo := shiftrepo.New(deps.DB)
		shiftService := shiftsvc.New(shiftRepo)
		shiftroutes.Register(v1, shifthandler.New(shiftService), secMiddleware)

		// Phase 2: Holiday management
		holidayRepo := holidayrepo.New(deps.DB)
		holidayService := holidaysvc.New(holidayRepo)
		holidayroutes.Register(v1, holidayhandler.New(holidayService), secMiddleware)

		// Phase 2: Attendance management
		attendanceRepo := attendancerepo.New(deps.DB)
		attendanceService := attendancesvc.New(attendanceRepo)
		attendanceroutes.Register(v1, attendancehandler.New(attendanceService), secMiddleware)

		// Phase 2: Employee Mobile
		mobileRepo := mobilerepo.New(deps.DB)
		mobileService := mobilesvc.New(mobileRepo, tokenManager)
		mobileroutes.Register(v1, mobilehandler.New(mobileService), secMiddleware)
	}

	engine.GET("/ping", func(c *gin.Context) {
		responses.OK(c, gin.H{"message": "pong"})
	})

	return engine
}

func registerProbes(engine *gin.Engine, db *gorm.DB) {
	engine.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "UP",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})

	engine.GET("/ready", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()

		if err := database.Ping(ctx, db); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status":    "DOWN",
				"database":  "DOWN",
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":    "UP",
			"database":  "UP",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})
}
