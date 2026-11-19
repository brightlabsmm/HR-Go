---
description: Every documentation change adds a Changed Logs row with the author name
paths:
  - "docs/**/*.md"
  - "README.md"
  - "CONTRIBUTING.md"
  - "CODE_OF_CONDUCT.md"
  - "backend/README.md"
  - "frontend/README.md"
  - "mobile/README.md"
  - ".claude/rules/backend-code-format.md"
  - ".claude/rules/backend-testing.md"
alwaysApply: false
---

# Documentation change log

When you create or edit a file matched by this rule, update its **Changed Logs** table in the same change.

- Put the section at the end of the file. Heading text is exactly `## Changed Logs`.
- Add the new row at the top of the table. Do not edit or delete older rows.
- **Author** is the name from `git config user.name` for the person making the change. Do not invent a name. If that value is empty, ask before writing the row.
- **Date** is `YYYY-MM-DD`.
- **Time** is `HH:MM` (24-hour local time).
- **Change** is one sentence describing what changed in the document.

```markdown
## Changed Logs

| Date | Time | Author | Change |
|---|---|---|---|
| 2026-10-20 | 14:30 | Jane Doe | Described the branch phone field on the create screen. |
```

This rule does not apply to `mobile/AGENTS.md` or `.github/pull_request_template.md`.

Do not edit locked Phase 0 documentation (`docs/phase_0/**` or Implementation Plan V2 PDFs).

## Application patch versions

`application_patch_versions` stores each application patch version. `patch_version` is exactly `00.00.00` (two digits, a dot, two digits, a dot, two digits). `patch_date_time` is the PatchDateTime. `is_current` is the current-version flag, and only one row may be current.

Every `git push` reads the current row, bumps `patch_version`, and inserts one new row. Increment the last segment by 1. When a segment would pass `99`, set it to `00` and add 1 to the segment on its left (`01.00.99` becomes `01.01.00`, `01.99.99` becomes `02.00.00`). Do not bump past `99.99.99`. The new row's `patch_date_time` is the current time, its `is_current` is true, and the previous current row is set to false in the same database transaction.

The hook script is `.githooks/pre-push`. It runs `go run ./cmd/bumpversion` in `backend/`. The program is named bumpversion because Windows treats an executable whose name contains patch as an installer and will not start it from the hook. That command reads `DATABASE_URL` from the environment or from `backend/.env` and inserts the row. It does not print the database URL. Git itself has no database client, so the hook's command is the write path. Copy `.githooks/pre-push` to `.git/hooks/pre-push` and mark it executable, or set `git config core.hooksPath .githooks`. If that database cannot be reached or rejects authentication, the hook exits non-zero and inserts nothing. It does not fall back to another database. Do not pass `--no-verify`: that skips the insert. Git has no client hook after a successful push, and this repository's GitHub Actions do not connect to the application database. Apply migrations before the first bump so the seeded current row `01.00.01` exists.
