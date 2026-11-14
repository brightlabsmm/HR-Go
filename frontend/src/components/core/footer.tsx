import { useTranslation } from "react-i18next"

export function Footer() {
  const { t } = useTranslation("common")

  return (
    <footer className="border-t border-border bg-background px-4 py-4 text-center text-xs text-muted-foreground">
      {t("footer.copyright", { year: new Date().getFullYear() })}
    </footer>
  )
}
