import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { z } from "zod"

import { applyApiFieldErrors } from "@/app/api/feedback"
import { FormCodeInput } from "@/components/common/form/form-code-input"
import { FormTextInput } from "@/components/common/form/form-text-input"
import { FormTextareaInput } from "@/components/common/form/form-textarea-input"
import { FormActions } from "@/components/common/form-actions"
import { FormFieldGrid } from "@/components/common/form-field-grid"
import { FormPageHeader } from "@/components/common/form-page-header"
import { FormSection, formStackClassName } from "@/components/common/form-section"
import { Button } from "@/components/ui/button"
import { ORGANIZATION_CODE_PREFIX } from "@/constants/codes"
import { useCreateOrganizationMutation } from "@/shared/queries/organization.query"
import { joinCodePrefix } from "@/util/code-prefix"

const CODE_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/

export function OrganizationCreatePage() {
  const { t } = useTranslation("organizations")
  const navigate = useNavigate()
  const createMutation = useCreateOrganizationMutation()
  const isPending = createMutation.isPending
  const schema = useMemo(
    () =>
      z.object({
        organizationCode: z.string().trim().regex(CODE_PATTERN, t("form.errors.code")),
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

  const { control, handleSubmit, setError } = useForm<FormValues>({
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

  function optionalText(value: string) {
    const trimmed = value.trim()
    return trimmed === "" ? undefined : trimmed
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
              organizationCode: joinCodePrefix(
                ORGANIZATION_CODE_PREFIX,
                values.organizationCode
              ),
              legalName: values.legalName.trim(),
              displayName: values.displayName.trim(),
              contactEmail: optionalText(values.contactEmail),
              contactPhone: optionalText(values.contactPhone),
              country: optionalText(values.country),
              address: optionalText(values.address),
            })
            void navigate("/")
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
            <FormCodeInput
              control={control}
              name="organizationCode"
              prefix={ORGANIZATION_CODE_PREFIX}
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
              label={t("form.email")}
              disabled={isPending}
            />
            <FormTextInput
              control={control}
              name="contactPhone"
              label={t("form.phone")}
              disabled={isPending}
            />
            <FormTextInput
              control={control}
              name="country"
              label={t("form.country")}
              disabled={isPending}
            />
            <FormTextareaInput
              control={control}
              name="address"
              label={t("form.address")}
              className="md:col-span-2"
              disabled={isPending}
            />
          </FormFieldGrid>
        </FormSection>
        <FormActions>
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
