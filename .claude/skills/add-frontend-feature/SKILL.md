---
name: add-frontend-feature
description: Use when adding a new frontend feature (list, create and edit pages for a backend resource). Covers feature folders, service, query hooks, portal routes, nav entry, permission check, and all locale files.
---

# Add a frontend feature

Template: `frontend/src/features/branches` plus `shared/services/branch.service.ts` and `shared/queries/branch.query.ts`. Replace `widget` with the new resource. Rules: `.claude/rules/frontend-rule.md`. File names are kebab-case; components are PascalCase; one component per file.

First decide the portal: `organization` (workspace API, `workspacePath`) or `platform` (control API, `controlPath`). The backend endpoint and permission codes must already exist (see `add-backend-module`).

## Steps

1. **Service**: `frontend/src/shared/services/widget.service.ts`. Raw axios calls only.
   - Define the response type, input type and list-params type here (there is no per-feature `types.ts`; check against OpenAPI via `api-contract-sync`).
   - Use `unwrap` / `unwrapPage` from `@/app/api/http`, `workspacePath` / `controlPath` from `@/app/api/paths`, and `toListQuery` from `@/util/list-query`. The latter maps `limit` to `pageSize`, `search` to `q`, and uppercases `status`.
   - Functions: `listWidgets`, `getWidget`, `createWidget`, `updateWidget`, `deactivateWidget`.

2. **Queries**: `frontend/src/shared/queries/widget.query.ts`.
   - `widgetKeys` factory (`all`, `lists`, `list`, `details`, `detail`).
   - `useWidgetsQuery` (with `placeholderData: keepPreviousData`), `useWidgetQuery`, and create/update/deactivate mutations that `invalidateQueries({ queryKey: widgetKeys.all })`.
   - Gate queries with `enabled: Boolean(accessToken)` from `useAuthStore`.
   - Components call queries, never services.

3. **Feature folder** `frontend/src/features/widgets/`:
   - `hooks/use-widget-list-params.ts`: URL-driven page, limit, search and status (copy `use-branch-list-params.ts`).
   - Do not add a code field to the form when the backend generates the code (branches and departments); show the generated code only as a read-only column in the table, as `branch-form.tsx` and `branch-table.tsx` do. Include a code input only when the API takes one (positions).
   - `components/widget-table.tsx` (TanStack table on `components/common/data-table`) and `components/widget-form.tsx` (react-hook-form + zod, `components/common/form/*` inputs).
   - `pages/widget-list-page.tsx`, `widget-create-page.tsx`, `widget-edit-page.tsx`. Export named components (`WidgetListPage`). Reuse `PageHeader`, `ListCard`, `FilterBar`, `SearchBox`, `Pagination`, `ConfirmDialog`, `PageEmptyState`, `TableSkeleton`. Promote anything a second feature needs to `components/common`.

4. **Lazy exports** in `frontend/src/constants/lazyload.tsx`:
   ```tsx
   export const WidgetListPage = pageLoader(
     () => import("@/features/widgets/pages/widget-list-page"),
     "WidgetListPage"
   )
   ```
   One per page.

5. **Routes** in `frontend/src/portals/organization/routes.tsx` (or `platform/routes.tsx`): `widgets`, `widgets/new`, `widgets/:id/edit`. Import the lazy pages from `@/constants/lazyload`. Note: the branches list is the organization index route (`/`) via `HomePage`; new features get their own path.

6. **Nav entry** in `frontend/src/portals/organization/nav.ts` (or `platform/nav.ts`):
   ```ts
   { to: "/widgets", labelKey: "nav.widgets", groupKey: "nav_groups.structure",
     icon: WidgetIcon, matchPrefix: "/widgets", permission: "org.widget.read" }
   ```
   Icons come from `lucide-react`. Add `nav.widgets` to `common.json` in every locale (see step 8).

7. **Permission check.** The sidebar hides nav items whose `permission` the user lacks (`usePermissions().can(code)` in `shared/hooks/use-permissions.ts`). Routes themselves are not guarded, so also use `can("org.widget.create")` etc. to hide buttons and actions in pages. The backend remains the real enforcement.

8. **Locales.** Create `widgets.json` in all four dirs `frontend/src/locales/{en,my,th,zh}/` with identical keys (copy the shape of `branches.json`: `title, subtitle, add, search_placeholder, all_status, empty.*, columns.*, deactivate.*, form.*`). Register it in `frontend/src/app/i18n.ts` (four imports, four `resources` entries, and the `ns` array). Add `nav.widgets` to each `common.json`. Follow the `add-translation` skill for wording. Use it in pages with `useTranslation("widgets")`.

9. **Types check** the service types against the OpenAPI schema (`api-contract-sync`). The existing `Branch` type declares `createdAt` / `updatedAt`, which the backend response does not send; do not copy that drift.

## Done checklist

Run from `frontend/`:

- [ ] `yarn typecheck`
- [ ] `yarn lint`
- [ ] `yarn test`
- [ ] `yarn build:org` (or `yarn build:platform`)
- [ ] Pages render in `yarn dev` (or `yarn dev:platform`): list, empty state, create, edit, deactivate dialog
- [ ] Locale files have identical key sets in `en`, `my`, `th`, `zh`
- [ ] Nav item shows only with the permission; action buttons respect permissions
- [ ] No component calls a service directly
