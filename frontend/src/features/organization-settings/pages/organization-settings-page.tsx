import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { applyApiFieldErrors } from "@/app/api/feedback"
import { FormActions } from "@/components/common/form-actions"
import { FormFieldGrid } from "@/components/common/form-field-grid"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { FormSection, formStackClassName } from "@/components/common/form-section"
import { FormTextInput } from "@/components/common/form/form-text-input"
import { FormTextareaInput } from "@/components/common/form/form-textarea-input"
import { MotionStack } from "@/components/common/motion-stack"
import { PageHeader } from "@/components/common/page-header"
import { ProfileSummaryCard } from "@/components/common/profile-summary-card"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  useUpdateWorkspaceOrganizationMutation,
  useWorkspaceOrganizationQuery,
} from "@/shared/queries/workspace-organization.query"
import { getInitials } from "@/util/initials"

export function OrganizationSettingsPage() {
  const { t } = useTranslation("organization_settings")
  const { t: tCommon } = useTranslation("common")
  const orgQuery = useWorkspaceOrganizationQuery()
  const updateMutation = useUpdateWorkspaceOrganizationMutation()
  const organization = orgQuery.data
  const isLoading = orgQuery.isPending

  const schema = useMemo(
    () =>
      z.object({
        displayName: z
          .string()
          .trim()
          .min(1, t("errors.display_name_required")),
        contactEmail: z
          .string()
          .trim()
          .min(1, t("errors.email_required"))
          .email(t("errors.email_invalid")),
        contactPhone: z
          .string()
          .trim()
          .min(1, t("errors.phone_required")),
        country: z
          .string()
          .trim()
          .min(1, t("errors.country_required")),
        address: z
          .string()
          .trim()
          .min(1, t("errors.address_required")),
        branchCodeFormat: z.string().trim().optional(),
        departmentCodeFormat: z.string().trim().optional(),
      }),
    [t]
  )

  type FormValues = z.infer<typeof schema>

  const { control, handleSubmit, reset, setError, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: "",
      contactEmail: "",
      contactPhone: "",
      country: "",
      address: "",
      branchCodeFormat: "BR-{0000}",
      departmentCodeFormat: "DEPT-{0000}",
    },
  })

  useEffect(() => {
    if (organization) {
      reset({
        displayName: organization.displayName ?? "",
        contactEmail: organization.contactEmail ?? "",
        contactPhone: organization.contactPhone ?? "",
        country: organization.country ?? "",
        address: organization.address ?? "",
        branchCodeFormat: organization.branchCodeFormat ?? "BR-{0000}",
        departmentCodeFormat: organization.departmentCodeFormat ?? "DEPT-{0000}",
      })
    }
  }, [organization, reset])

  const name = organization?.displayName || organization?.legalName || ""

  return (
    <MotionStack className="flex flex-col gap-8 pb-2">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />
      <div className="grid items-start gap-12 lg:grid-cols-[18.75rem_minmax(0,1fr)]">
        <ProfileSummaryCard
          isLoading={isLoading}
          avatarSize="xl"
          title={name}
          subtitle={organization?.organizationCode}
          initials={getInitials(...name.split(" "))}
          badges={organization ? <StatusBadge status={organization.status} /> : null}
        />
        <div className="flex min-w-0 flex-col gap-8">
          <form
            className={formStackClassName}
            onSubmit={handleSubmit(async (values) => {
              try {
                await updateMutation.mutateAsync({
                  displayName: values.displayName.trim(),
                  contactEmail: values.contactEmail.trim(),
                  contactPhone: values.contactPhone.trim(),
                  country: values.country.trim(),
                  address: values.address.trim(),
                  branchCodeFormat: values.branchCodeFormat?.trim(),
                  departmentCodeFormat: values.departmentCodeFormat?.trim(),
                })
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
                  <div>
                    <label className="text-small-2 font-medium text-muted-foreground block mb-1.5">
                      {t("fields.code")}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={organization?.organizationCode ?? ""}
                      className="w-full h-10 px-3 rounded-md border border-hair bg-muted text-muted-foreground font-mono text-small-2 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-small-2 font-medium text-muted-foreground block mb-1.5">
                      {t("fields.legal_name")}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={organization?.legalName ?? ""}
                      className="w-full h-10 px-3 rounded-md border border-hair bg-muted text-muted-foreground text-small-2 cursor-not-allowed"
                    />
                  </div>
                  <FormTextInput
                    control={control}
                    name="displayName"
                    required
                    label={t("fields.display_name")}
                    className="md:col-span-2"
                  />
                </FormFieldGrid>
              )}
            </FormSection>

            <FormSection
              legend={t("sections.contact")}
              description={t("sections.contact_description")}
            >
              {isLoading ? (
                <FormSkeleton fields={4} columns={2} />
              ) : (
                <FormFieldGrid>
                  <FormTextInput
                    control={control}
                    name="contactEmail"
                    type="email"
                    required
                    label={t("fields.email")}
                  />
                  <FormTextInput
                    control={control}
                    name="contactPhone"
                    required
                    label={t("fields.phone")}
                  />
                  <FormTextInput
                    control={control}
                    name="country"
                    required
                    label={t("fields.country")}
                  />
                  <FormTextareaInput
                    control={control}
                    name="address"
                    required
                    label={t("fields.address")}
                    className="md:col-span-2"
                  />
                </FormFieldGrid>
              )}
            </FormSection>

            <FormSection
              legend={t("sections.code_formats")}
              description={t("sections.code_formats_description")}
            >
              {isLoading ? (
                <FormSkeleton fields={2} columns={2} />
              ) : (
                <FormFieldGrid>
                  <FormTextInput
                    control={control}
                    name="branchCodeFormat"
                    label={t("fields.branch_code_format")}
                    placeholder={t("fields.branch_code_format_placeholder")}
                  />
                  <FormTextInput
                    control={control}
                    name="departmentCodeFormat"
                    label={t("fields.department_code_format")}
                    placeholder={t("fields.department_code_format_placeholder")}
                  />
                </FormFieldGrid>
              )}
            </FormSection>

            <FormActions>
              <Button
                type="submit"
                disabled={isLoading || updateMutation.isPending || !formState.isDirty}
              >
                {updateMutation.isPending
                  ? tCommon("actions.submit")
                  : t("save")}
              </Button>
            </FormActions>
          </form>
        </div>
      </div>
    </MotionStack>
  )
}
