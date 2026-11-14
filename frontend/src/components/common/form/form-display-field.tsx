import { FormFieldShell } from "@/components/common/form/form-field"

interface FormDisplayFieldProps {
  label: string
  value: string
  description?: string
  className?: string
}

export function FormDisplayField({
  label,
  value,
  description,
  className,
}: FormDisplayFieldProps) {
  return (
    <FormFieldShell label={label} description={description} className={className}>
      <p className="flex h-input items-center font-mono text-body-2 text-secondary">
        {value}
      </p>
    </FormFieldShell>
  )
}
