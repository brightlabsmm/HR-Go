import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"
import { z } from "zod"

import { applyApiFieldErrors } from "@/app/api/feedback"
import { DetailList } from "@/components/common/detail-list"
import { FormActions } from "@/components/common/form-actions"
import { FormFieldGrid } from "@/components/common/form-field-grid"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { FormSelectInput } from "@/components/common/form/form-select-input"
import { FormTextInput } from "@/components/common/form/form-text-input"
import { FormTextareaInput } from "@/components/common/form/form-textarea-input"
import { FormSection, formStackClassName } from "@/components/common/form-section"
import { NotFoundState } from "@/components/common/not-found-state"
import { Button } from "@/components/ui/button"
import { OrganizationDetailHeader } from "@/features/organizations/components/organization-detail-header"
import {
  useOrganizationQuery,
  useUpdateOrganizationMutation,
  useUpdateOrganizationStatusMutation,
} from "@/shared/queries/organization.query"
import { formatDate } from "@/util/format-date"

import type { OrganizationStatus } from "@/shared/services/organization.service"

export function OrganizationDetailPage() {
  const { t, i18n } = useTranslation("organizations")
  const { t: tCommon } = useTranslation("common")
  const { id = "" } = useParams()
  const organizationQuery = useOrganizationQuery(id)
  const updateMutation = useUpdateOrganizationMutation()
  const statusMutation = useUpdateOrganizationStatusMutation()
  const organization = organizationQuery.data
  const isLoading = organizationQuery.isPending
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
        status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "ARCHIVED"]),
        reason: z.string(),
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
      status: "ACTIVE",
      reason: "",
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
        status: organization.status as OrganizationStatus,
        reason: "",
      })
    }
  }, [organization, reset])

  const statusOptions = [
    { value: "PENDING", label: tCommon("status.pending") },
    { value: "ACTIVE", label: tCommon("status.active") },
    { value: "SUSPENDED", label: tCommon("status.suspended") },
    { value: "ARCHIVED", label: tCommon("status.archived") },
  ]

  if (!organization && organizationQuery.isFetched) {
    return <NotFoundState backTo="/" backLabel={t("title")} description={t("not_found")} />
  }

  function optionalText(value: string) {
    const trimmed = value.trim()
    return trimmed === "" ? undefined : trimmed
  }

  return (
    <section className="flex flex-col gap-8 pb-6">
      <OrganizationDetailHeader organizationId={id} />
      {isLoading ? (
        <FormSkeleton fields={3} columns={2} />
      ) : organization ? (
        <div className="rounded-xl bg-background p-6">
          <h2 className="mb-5 text-small-1 font-semibold text-foreground">
            {t("sections.overview")}
          </h2>
          <DetailList
            columns={2}
            className="lg:grid-cols-3"
            items={[
              { label: t("form.code"), value: organization.organizationCode, mono: true },
              {
                label: t("created_at"),
                value: formatDate(organization.createdAt, i18n.language),
              },
              { label: t("form.address"), value: organization.address },
            ]}
          />
        </div>
      ) : null}
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

            if (values.status !== organization?.status) {
              await statusMutation.mutateAsync({
                id,
                input: {
                  status: values.status,
                  confirmation: true,
                  reason: optionalText(values.reason),
                },
              })
            }
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
        <FormSection
          legend={t("sections.status")}
          description={t("sections.status_description")}
        >
          {isLoading ? (
            <FormSkeleton fields={2} columns={2} />
          ) : (
            <FormFieldGrid>
              <FormSelectInput
                control={control}
                name="status"
                required
                label={t("form.status")}
                options={statusOptions}
              />
              <FormTextInput
                control={control}
                name="reason"
                label={t("form.reason")}
              />
            </FormFieldGrid>
          )}
        </FormSection>
        <FormActions>
          <Button
            type="button"
            variant="outline"
            disabled={!formState.isDirty}
            onClick={() => reset()}
          >
            {t("form.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formState.isDirty}
            loading={updateMutation.isPending || statusMutation.isPending}
          >
            {t("form.save")}
          </Button>
        </FormActions>
      </form>
    </section>
  )
}
