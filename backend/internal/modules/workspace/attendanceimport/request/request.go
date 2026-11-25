package request

type ImportAttendanceCSVRequest struct {
	FileReference string `json:"fileReference" binding:"required,max=255"`
	CSVContent    string `json:"csvContent" binding:"required"`
}

type ListImportBatchesQuery struct {
	Page     int `form:"page,default=1" binding:"omitempty,min=1"`
	PageSize int `form:"pageSize,default=20" binding:"omitempty,min=1,max=100"`
}

type ExportAttendanceQuery struct {
	From     string `form:"from"`
	To       string `form:"to"`
	BranchID string `form:"branchId"`
	Status   string `form:"status"`
}
