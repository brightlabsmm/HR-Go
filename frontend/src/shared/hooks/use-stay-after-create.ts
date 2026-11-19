import { useState } from "react"
import { useNavigate } from "react-router"

export function useStayAfterCreate(listPath: string) {
  const navigate = useNavigate()
  const [stayAfterCreate, setStayAfterCreate] = useState(false)

  function finishCreate(resetForm: () => void) {
    if (stayAfterCreate) {
      resetForm()
      return
    }

    void navigate(listPath)
  }

  return { stayAfterCreate, setStayAfterCreate, finishCreate }
}
