import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"
import { z } from "zod"

import { applyApiFieldErrors } from "@/app/api/feedback"
import { FormActions } from "@/components/common/form-actions"
import { FormFieldGrid } from "@/components/common/form-field-grid"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { FormTextInput } from "@/components/common/form/form-text-input"
import { FormTextareaInput } from "@/components/common/form/form-textarea-input"
import { FormSection, formStackClassName } from "@/components/common/form-section"
import { NotFoundState } from "@/components/common/not-found-state"
import { Button } from "@/components/ui/button"
import { OrganizationDetailHeader } from "@/features/organizations/components/organization-detail-header"
import {
  useOrganizationQuery,
  useUpdateOrganizationMutation,
} from "@/shared/queries/organization.query"

export function OrganizationEditPage() {
  const { t } = useTranslation("organizations")
  const navigate = useNavigate()
  const { id = "" } = useParams()
  const organizationQuery = useOrganizationQuery(id)
  const updateMutation = useUpdateOrganizationMutation()
  const organization = organizationQuery.data
  const isLoading = organizationQuery.isPending
  const detailPath = `/organizations/${id}`
  const schema = useMemo(
    () =>
      z.object({
        legalName: z.string().trim().min(1, t("form.errors.legal_name")),
        displayName: z.string().trim().min(1, t("form.errors.display_name")),
        contactEmail: z
          .string()
          .trim()
          .email(t("form.errors.email"))
          .or(z.literal("")),
        contactPhone: z.string(),
        country: z.string(),
        address: z.string(),
      }),
    [t]
  )
  type FormValues = z.infer<typeof schema>
  const { control, handleSubmit, reset, setError, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      legalName: "",
      displayName: "",
      contactEmail: "",
      contactPhone: "",
      country: "",
      address: "",
    },
  })

  useEffect(() => {
    if (organization) {
      reset({
        legalName: organization.legalName,
        displayName: organization.displayName,
        contactEmail: organization.contactEmail ?? "",
        contactPhone: organization.contactPhone ?? "",
        country: organization.country ?? "",
        address: organization.address ?? "",
      })
    }
  }, [organization, reset])

  if (!organization && organizationQuery.isFetched) {
    return <NotFoundState backTo="/" backLabel={t("title")} description={t("not_found")} />
  }

  function optionalText(value: string) {
    const trimmed = value.trim()
    return trimmed === "" ? undefined : trimmed
  }

  return (
    <section className="flex flex-col gap-8 pb-6">
      <OrganizationDetailHeader
        organizationId={id}
        backTo={detailPath}
        backLabel={organization?.displayName ?? t("detail.title")}
        description={t("form.edit_subtitle")}
      />
      <form
        className={formStackClassName}
        onSubmit={handleSubmit(async (values) => {
          if (!id) {
            return
          }

          try {
            await updateMutation.mutateAsync({
              id,
              input: {
                legalName: values.legalName.trim(),
                displayName: values.displayName.trim(),
                contactEmail: optionalText(values.contactEmail),
                contactPhone: optionalText(values.contactPhone),
                country: optionalText(values.country),
                address: optionalText(values.address),
              },
            })
            void navigate(detailPath)
          } catch (error) {
            applyApiFieldErrors(error, setError)
          }
        })}
      >
        <FormSection
          legend={t("sections.identity")}
          description={t("sections.identity_description")}
        >
          {isLoading ? (
            <FormSkeleton fields={3} columns={2} />
          ) : (
            <FormFieldGrid>
              <FormTextInput
                control={control}
                name="legalName"
                required
                label={t("form.legal_name")}
              />
              <FormTextInput
                control={control}
                name="displayName"
                required
                label={t("form.display_name")}
              />
            </FormFieldGrid>
          )}
        </FormSection>
        <FormSection
          legend={t("sections.contact")}
          description={t("sections.contact_description")}
        >
          {isLoading ? (
            <FormSkeleton fields={3} columns={2} />
          ) : (
            <FormFieldGrid>
              <FormTextInput
                control={control}
                name="contactEmail"
                type="email"
                label={t("form.email")}
              />
              <FormTextInput
                control={control}
                name="contactPhone"
                label={t("form.phone")}
              />
              <FormTextInput control={control} name="country" label={t("form.country")} />
              <FormTextareaInput
                control={control}
                name="address"
                label={t("form.address")}
                className="md:col-span-2"
              />
            </FormFieldGrid>
          )}
        </FormSection>
        <FormActions>
          <Button
            type="button"
            variant="outline"
            disabled={updateMutation.isPending}
            onClick={() => void navigate(detailPath)}
          >
            {t("form.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formState.isDirty}
            loading={updateMutation.isPending}
          >
            {t("form.save")}
          </Button>
        </FormActions>
      </form>
    </section>
  )
}
