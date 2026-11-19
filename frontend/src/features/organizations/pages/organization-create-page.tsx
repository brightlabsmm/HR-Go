import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { z } from "zod"

import { applyApiFieldErrors } from "@/app/api/feedback"
import { ForbiddenState } from "@/components/common/forbidden-state"
import { FormPhoneInput } from "@/components/common/form/form-phone-input"
import { FormTextInput } from "@/components/common/form/form-text-input"
import { FormTextareaInput } from "@/components/common/form/form-textarea-input"
import { FormActions } from "@/components/common/form-actions"
import { FormFieldGrid } from "@/components/common/form-field-grid"
import { FormPageHeader } from "@/components/common/form-page-header"
import { FormSection, formStackClassName } from "@/components/common/form-section"
import { StayAfterCreateCheckbox } from "@/components/common/stay-after-create-checkbox"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/shared/hooks/use-permissions"
import { useStayAfterCreate } from "@/shared/hooks/use-stay-after-create"
import { useCreateOrganizationMutation } from "@/shared/queries/organization.query"
import { requiredE164Phone } from "@/util/phone"

const CODE_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/

export function OrganizationCreatePage() {
  const { t } = useTranslation("organizations")
  const navigate = useNavigate()
  const createMutation = useCreateOrganizationMutation()
  const { can, isPending: isPermissionsPending } = usePermissions()
  const { stayAfterCreate, setStayAfterCreate, finishCreate } =
    useStayAfterCreate("/")
  const isPending = createMutation.isPending
  const schema = useMemo(
    () =>
      z.object({
        organizationCode: z
          .string()
          .trim()
          .min(1, t("form.errors.code"))
          .regex(CODE_PATTERN, t("form.errors.code")),
        legalName: z.string().trim().min(1, t("form.errors.legal_name")),
        displayName: z.string().trim().min(1, t("form.errors.display_name")),
        contactEmail: z
          .string()
          .trim()
          .min(1, t("form.errors.email_required", "Email is required."))
          .email(t("form.errors.email")),
        contactPhone: requiredE164Phone(
          t("form.errors.phone_required"),
          t("form.errors.phone_invalid")
        ),
        country: z
          .string()
          .trim()
          .min(1, t("form.errors.country_required", "Country is required.")),
        address: z
          .string()
          .trim()
          .min(1, t("form.errors.address_required", "Address is required.")),
      }),
    [t]
  )

  type FormValues = z.infer<typeof schema>

  const { control, handleSubmit, setError, reset } = useForm<FormValues>({
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

  if (!isPermissionsPending && !can("platform.organization.create")) {
    return <ForbiddenState backTo="/" backLabel={t("title")} />
  }

  return (
    <section className="flex flex-col gap-8 pb-6">
      <FormPageHeader
        title={t("form.create_title")}
        subtitle={t("form.create_subtitle")}
      />
      <form
        className={formStackClassName}
        onSubmit={handleSubmit(async (values) => {
          try {
            await createMutation.mutateAsync({
              organizationCode: values.organizationCode.trim(),
              legalName: values.legalName.trim(),
              displayName: values.displayName.trim(),
              contactEmail: values.contactEmail.trim(),
              contactPhone: values.contactPhone.trim(),
              country: values.country.trim(),
              address: values.address.trim(),
            })
            finishCreate(() =>
              reset({
                organizationCode: "",
                legalName: "",
                displayName: "",
                contactEmail: "",
                contactPhone: "",
                country: "",
                address: "",
              })
            )
          } catch (error) {
            applyApiFieldErrors(error, setError)
          }
        })}
      >
        <FormSection
          legend={t("sections.identity")}
          description={t("sections.identity_description")}
        >
          <FormFieldGrid>
            <FormTextInput
              control={control}
              name="organizationCode"
              required
              label={t("form.code")}
              placeholder={t("form.code_placeholder")}
              disabled={isPending}
            />
            <FormTextInput
              control={control}
              name="legalName"
              required
              label={t("form.legal_name")}
              disabled={isPending}
            />
            <FormTextInput
              control={control}
              name="displayName"
              required
              label={t("form.display_name")}
              className="md:col-span-2"
              disabled={isPending}
            />
          </FormFieldGrid>
        </FormSection>
        <FormSection
          legend={t("sections.contact")}
          description={t("sections.contact_description")}
        >
          <FormFieldGrid>
            <FormTextInput
              control={control}
              name="contactEmail"
              type="email"
              required
              label={t("form.email")}
              disabled={isPending}
            />
            <FormPhoneInput
              control={control}
              name="contactPhone"
              required
              label={t("form.phone")}
              disabled={isPending}
            />
            <FormTextInput
              control={control}
              name="country"
              required
              label={t("form.country")}
              disabled={isPending}
            />
            <FormTextareaInput
              control={control}
              name="address"
              required
              label={t("form.address")}
              className="md:col-span-2"
              disabled={isPending}
            />
          </FormFieldGrid>
        </FormSection>
        <FormActions
          start={
            <StayAfterCreateCheckbox
              checked={stayAfterCreate}
              onCheckedChange={setStayAfterCreate}
              disabled={isPending}
            />
          }
        >
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => void navigate("/")}
          >
            {t("form.cancel")}
          </Button>
          <Button type="submit" loading={isPending}>
            {t("form.create")}
          </Button>
        </FormActions>
      </form>
    </section>
  )
}
