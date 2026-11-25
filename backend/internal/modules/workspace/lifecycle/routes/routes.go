package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/lifecycle/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	group := rg.Group("/workspace/employees/:id")
	group.Use(sec.RequireWorkspace())
	{
		group.GET("/contracts", sec.RequirePermission("org.employee.read"), h.ListContracts)
		group.POST("/contracts", sec.RequirePermission("org.employee.update"), h.CreateContract)
		group.PUT("/contracts/:contractId", sec.RequirePermission("org.employee.update"), h.UpdateContract)
		group.DELETE("/contracts/:contractId", sec.RequirePermission("org.employee.update"), h.DeleteContract)

		group.GET("/documents", sec.RequirePermission("org.employee.read"), h.ListDocuments)
		group.POST("/documents", sec.RequirePermission("org.employee.update"), h.CreateDocument)
		group.DELETE("/documents/:documentId", sec.RequirePermission("org.employee.update"), h.DeleteDocument)

		group.GET("/service-years", sec.RequirePermission("org.employee.read"), h.ListServiceYears)
		group.POST("/service-years/recalculate", sec.RequirePermission("org.employee.update"), h.RecalculateServiceYear)

		group.GET("/exits", sec.RequirePermission("org.employee.read"), h.ListExits)
		group.POST("/exits", sec.RequirePermission("org.employee.delete"), h.RecordExit)
		group.GET("/histories", sec.RequirePermission("org.employee.read"), h.ListHistories)
	}
}
