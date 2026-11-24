package routes

import (
	"github.com/gin-gonic/gin"

	"hrgo/backend/internal/modules/workspace/shift/handler"
	"hrgo/backend/internal/shared/security"
)

func Register(rg *gin.RouterGroup, h *handler.Handler, sec *security.Middleware) {
	shifts := rg.Group("/workspace/shifts")
	shifts.Use(sec.RequireWorkspace())
	{
		shifts.GET("", sec.RequirePermission("org.shift.read"), h.ListShifts)
		shifts.POST("", sec.RequirePermission("org.shift.create"), h.CreateShift)
		shifts.GET("/:id", sec.RequirePermission("org.shift.read"), h.GetShiftByID)
		shifts.PUT("/:id", sec.RequirePermission("org.shift.update"), h.UpdateShift)
		shifts.DELETE("/:id", sec.RequirePermission("org.shift.delete"), h.DeleteShift)
	}

	assignments := rg.Group("/workspace/shift-assignments")
	assignments.Use(sec.RequireWorkspace())
	{
		assignments.GET("", sec.RequirePermission("org.shift.read"), h.ListAssignments)
		assignments.POST("", sec.RequirePermission("org.shift.assign"), h.AssignShift)
		assignments.GET("/:id", sec.RequirePermission("org.shift.read"), h.GetAssignmentByID)
	}

	empAssignments := rg.Group("/workspace/employees/:id/shift-assignments")
	empAssignments.Use(sec.RequireWorkspace())
	{
		empAssignments.GET("", sec.RequirePermission("org.shift.read"), h.ListEmployeeAssignments)
		empAssignments.GET("/history", sec.RequirePermission("org.shift.read"), h.ListAssignmentHistory)
	}
}
