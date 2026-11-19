import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Pagination } from "@/components/common/pagination"
import { BranchTablePreview } from "@/features/home/components/branch-table-preview"
import { FormComboBoxInput } from "@/components/common/form/form-combo-box-input"
import { FormPhoneInput } from "@/components/common/form/form-phone-input"
import { FormPasswordInput } from "@/components/common/form/form-password-input"
import { FormRadioInput } from "@/components/common/form/form-radio-input"
import { FormSelectInput } from "@/components/common/form/form-select-input"
import { FormSwitchInput } from "@/components/common/form/form-switch-input"
import { FormTextInput } from "@/components/common/form/form-text-input"
import { SearchBox } from "@/components/common/search-box"
import { Button } from "@/components/ui/button"
import { usePaginationQuery } from "@/shared/hooks/use-pagination-query"
import { optionalE164Phone } from "@/util/phone"

const previewSchema = z.object({
  name: z.string().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  country: z.string().min(1, "Country is required"),
  status: z.string().min(1, "Status is required"),
  city: z.string().min(1, "City is required"),
  isActive: z.boolean().refine((value) => value, "Must be enabled"),
  phone: optionalE164Phone("Enter a valid phone number."),
})

type PreviewFormValues = z.infer<typeof previewSchema>

const countryOptions = [
  { value: "mm", label: "Myanmar" },
  { value: "th", label: "Thailand" },
  { value: "cn", label: "China" },
]

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

const cityOptions = [
  { value: "ygn", label: "Yangon" },
  { value: "mdy", label: "Mandalay" },
  { value: "bkk", label: "Bangkok" },
]

export function FormPreviewPage() {
  const [query, setQuery] = useState("")
  const { page, limit } = usePaginationQuery()
  const { control, handleSubmit } = useForm<PreviewFormValues>({
    resolver: zodResolver(previewSchema),
    defaultValues: {
      name: "",
      password: "",
      country: "",
      status: "",
      city: "",
      isActive: false,
      phone: "",
    },
  })

  return (
    <div className="flex flex-col gap-8">
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <SearchBox
        value={query}
        onValueChange={setQuery}
        placeholder="Search by code or branch name"
      />
      <form
        className="flex flex-col gap-5"
        onSubmit={handleSubmit(() => undefined)}
      >
        <FormTextInput control={control} name="name" label="Name" />
        <FormPhoneInput control={control} name="phone" label="Phone" />
        <FormPasswordInput control={control} name="password" label="Password" />
        <FormSelectInput
          control={control}
          name="country"
          label="Country"
          options={countryOptions}
        />
        <FormRadioInput
          control={control}
          name="status"
          label="Status"
          options={statusOptions}
          layout="horizontal"
        />
        <FormComboBoxInput
          control={control}
          name="city"
          label="City"
          options={cityOptions}
        />
        <FormSwitchInput
          control={control}
          name="isActive"
          label="Active"
          description="Enable this record"
        />
        <Button type="submit">Validate</Button>
      </form>
    </div>
      <Pagination
        meta={{
          page,
          pageSize: limit,
          totalItems: 98,
          totalPages: Math.ceil(98 / limit),
        }}
      />
      <BranchTablePreview />
    </div>
  )
}
