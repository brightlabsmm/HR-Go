import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/constants/locales"
import { useLocaleStore } from "@/shared/stores/locale.store"

import enAccount from "@/locales/en/account.json"
import enAuth from "@/locales/en/auth.json"
import enBranches from "@/locales/en/branches.json"
import enCommon from "@/locales/en/common.json"
import enDepartments from "@/locales/en/departments.json"
import enHome from "@/locales/en/home.json"
import enOrganizations from "@/locales/en/organizations.json"
import enPositions from "@/locales/en/positions.json"
import enRoles from "@/locales/en/roles.json"
import enUsers from "@/locales/en/users.json"
import myAccount from "@/locales/my/account.json"
import myAuth from "@/locales/my/auth.json"
import myBranches from "@/locales/my/branches.json"
import myCommon from "@/locales/my/common.json"
import myDepartments from "@/locales/my/departments.json"
import myHome from "@/locales/my/home.json"
import myOrganizations from "@/locales/my/organizations.json"
import myPositions from "@/locales/my/positions.json"
import myRoles from "@/locales/my/roles.json"
import myUsers from "@/locales/my/users.json"
import thAccount from "@/locales/th/account.json"
import thAuth from "@/locales/th/auth.json"
import thBranches from "@/locales/th/branches.json"
import thCommon from "@/locales/th/common.json"
import thDepartments from "@/locales/th/departments.json"
import thHome from "@/locales/th/home.json"
import thOrganizations from "@/locales/th/organizations.json"
import thPositions from "@/locales/th/positions.json"
import thRoles from "@/locales/th/roles.json"
import thUsers from "@/locales/th/users.json"
import zhAccount from "@/locales/zh/account.json"
import zhAuth from "@/locales/zh/auth.json"
import zhBranches from "@/locales/zh/branches.json"
import zhCommon from "@/locales/zh/common.json"
import zhDepartments from "@/locales/zh/departments.json"
import zhHome from "@/locales/zh/home.json"
import zhOrganizations from "@/locales/zh/organizations.json"
import zhPositions from "@/locales/zh/positions.json"
import zhRoles from "@/locales/zh/roles.json"
import zhUsers from "@/locales/zh/users.json"

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    home: enHome,
    branches: enBranches,
    organizations: enOrganizations,
    departments: enDepartments,
    positions: enPositions,
    users: enUsers,
    roles: enRoles,
    account: enAccount,
  },
  th: {
    common: thCommon,
    auth: thAuth,
    home: thHome,
    branches: thBranches,
    organizations: thOrganizations,
    departments: thDepartments,
    positions: thPositions,
    users: thUsers,
    roles: thRoles,
    account: thAccount,
  },
  zh: {
    common: zhCommon,
    auth: zhAuth,
    home: zhHome,
    branches: zhBranches,
    organizations: zhOrganizations,
    departments: zhDepartments,
    positions: zhPositions,
    users: zhUsers,
    roles: zhRoles,
    account: zhAccount,
  },
  my: {
    common: myCommon,
    auth: myAuth,
    home: myHome,
    branches: myBranches,
    organizations: myOrganizations,
    departments: myDepartments,
    positions: myPositions,
    users: myUsers,
    roles: myRoles,
    account: myAccount,
  },
}

const setDocumentLanguage = (locale: string) => {
  document.documentElement.lang = locale
}

void i18n.use(initReactI18next).init({
  resources,
  lng: useLocaleStore.getState().locale,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: [...SUPPORTED_LOCALES],
  ns: [
    "common",
    "auth",
    "home",
    "branches",
    "organizations",
    "departments",
    "positions",
    "users",
    "roles",
    "account",
  ],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
})

setDocumentLanguage(i18n.language)
i18n.on("languageChanged", setDocumentLanguage)

useLocaleStore.subscribe((state) => {
  if (i18n.language !== state.locale) {
    void i18n.changeLanguage(state.locale)
  }
})

const syncLocale = (locale: string) => {
  if (i18n.language !== locale) {
    void i18n.changeLanguage(locale)
  }
}

if (useLocaleStore.persist.hasHydrated()) {
  syncLocale(useLocaleStore.getState().locale)
} else {
  useLocaleStore.persist.onFinishHydration((state) => {
    syncLocale(state.locale)
  })
}

export { i18n }
