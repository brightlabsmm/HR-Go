import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"
import { z } from "zod"

import { applyApiFieldErrors, notifyApiError } from "@/app/api/feedback"
import {
  COUNTRY_OPTIONS,
  isValidCountryCode,
  normalizeCountryCode,
} from "@/constants/countries"
import { FormActions } from "@/components/common/form-actions"
import { FormFieldGrid } from "@/components/common/form-field-grid"
import { FormSkeleton } from "@/components/common/form-skeleton"
import { FormPhoneInput } from "@/components/common/form/form-phone-input"
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
} from "@/shared/queries/organization.query"
import { requiredE164Phone } from "@/util/phone"

const CODE_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/

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
        organizationCode: z
          .string()
          .trim()
          .min(1, t("form.errors.code"))
          .max(50, t("form.errors.code_max", "Code must not exceed 50 characters."))
          .regex(CODE_PATTERN, t("form.errors.code")),
        legalName: z
          .string()
          .trim()
          .min(1, t("form.errors.legal_name"))
          .max(255, t("form.errors.legal_name_max", "Legal name must not exceed 255 characters.")),
        displayName: z
          .string()
          .trim()
          .min(1, t("form.errors.display_name"))
          .max(255, t("form.errors.display_name_max", "Display name must not exceed 255 characters.")),
        contactEmail: z
          .string()
          .trim()
          .min(1, t("form.errors.email_required", "Email is required."))
          .max(255, t("form.errors.email_max", "Email must not exceed 255 characters."))
          .email(t("form.errors.email")),
        contactPhone: requiredE164Phone(
          t("form.errors.phone_required"),
          t("form.errors.phone_invalid")
        ),
        country: z
          .string()
          .trim()
          .min(1, t("form.errors.country_required", "Country is required."))
          .max(10, t("form.errors.country_max", "Country must not exceed 10 characters."))
          .refine(
            isValidCountryCode,
            t("form.errors.country_invalid", "Please select a valid country.")
          ),
        address: z
          .string()
          .trim()
          .min(1, t("form.errors.address_required", "Address is required."))
          .max(2000, t("form.errors.address_max", "Address must not exceed 2000 characters.")),
      }),
    [t]
  )
  type FormValues = z.infer<typeof schema>
  const { control, handleSubmit, reset, setError, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationCode: "",
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
        organizationCode: organization.organizationCode ?? "",
        legalName: organization.legalName,
        displayName: organization.displayName,
        contactEmail: organization.contactEmail ?? "",
        contactPhone: organization.contactPhone ?? "",
        country: normalizeCountryCode(organization.country),
        address: organization.address ?? "",
      })
    }
  }, [organization, reset])

  if (!organization && organizationQuery.isFetched) {
    return <NotFoundState backTo="/" backLabel={t("title")} description={t("not_found")} />
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
                organizationCode: values.organizationCode.trim(),
                legalName: values.legalName.trim(),
                displayName: values.displayName.trim(),
                contactEmail: values.contactEmail.trim(),
                contactPhone: values.contactPhone.trim(),
                country: values.country.trim(),
                address: values.address.trim(),
              },
            })
            void navigate(detailPath)
          } catch (error) {
            const applied = applyApiFieldErrors(error, setError)
            if (!applied) {
              notifyApiError(error)
            }
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
                name="organizationCode"
                required
                label={t("form.code")}
                placeholder={t("form.code_placeholder")}
              />
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
            <FormSkeleton fields={3} columns={2} />
          ) : (
            <FormFieldGrid>
              <FormTextInput
                control={control}
                name="contactEmail"
                type="email"
                required
                label={t("form.email")}
              />
              <FormPhoneInput
                control={control}
                name="contactPhone"
                required
                label={t("form.phone")}
              />
              <FormSelectInput
                control={control}
                name="country"
                required
                label={t("form.country")}
                options={COUNTRY_OPTIONS}
              />
              <FormTextareaInput
                control={control}
                name="address"
                required
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
