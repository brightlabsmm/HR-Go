import type { ReactNode } from "react"
import type { Control, FieldPath, FieldValues } from "react-hook-form"

import { MotionCollapse } from "@/components/common/motion-collapse"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"

export interface FormFieldOption {
  value: string
  label: string
  disabled?: boolean
}

export interface FormFieldControlProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label: string
  description?: string
  disabled?: boolean
  required?: boolean
  reserveErrorSpace?: boolean
  className?: string
}

interface FormFieldShellProps {
  label: string
  htmlFor?: string
  description?: string
  error?: string
  invalid?: boolean
  required?: boolean
  reserveErrorSpace?: boolean
  orientation?: "vertical" | "horizontal"
  className?: string
  children: ReactNode
}

export function FormFieldShell({
  label,
  htmlFor,
  description,
  error,
  invalid = false,
  required = false,
  reserveErrorSpace = false,
  orientation = "vertical",
  className,
  children,
}: FormFieldShellProps) {
  const labelNode = (
    <FieldLabel htmlFor={htmlFor} className="gap-1">
      {label}
      {required ? (
        <span className="text-destructive" aria-hidden>
          *
        </span>
      ) : null}
    </FieldLabel>
  )
  const descriptionNode = description ? (
    <FieldDescription>{description}</FieldDescription>
  ) : null
  const collapsedError = (
    <MotionCollapse show={Boolean(error)}>
      <FieldError>{error}</FieldError>
    </MotionCollapse>
  )
  // A fixed-height slot stops the layout below from jumping when an error appears.
  const errorNode = reserveErrorSpace ? (
    <div className="min-h-6">{collapsedError}</div>
  ) : (
    collapsedError
  )

  if (orientation === "horizontal") {
    return (
      <Field
        orientation="horizontal"
        data-invalid={invalid || undefined}
        className={className}
      >
        {children}
        <FieldContent>
          {labelNode}
          {descriptionNode}
          {errorNode}
        </FieldContent>
      </Field>
    )
  }

  return (
    <Field data-invalid={invalid || undefined} className={className}>
      {labelNode}
      {children}
      {descriptionNode}
      {errorNode}
    </Field>
  )
}
