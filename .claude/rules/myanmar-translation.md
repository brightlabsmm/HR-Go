---
description: Myanmar (my) UI copy is mostly Burmese, with a few familiar English loanwords left as-is.
paths: frontend/src/locales/my/**/*.json
alwaysApply: false
---

# Myanmar translation (light mix)

Write **mostly Burmese**. Do not leave whole screens, nav items, or buttons in English. Only keep a word in English when Myanmar users already say that English word in daily work.

## Keep in English (loanwords only)

`platform`, `account`, `admin`, `email`, `password`, `user`, `role`, `permission`, `profile`, `portal`, `tenant`

Use them inside a Burmese sentence or with a Burmese plural: `account`, `Role များ`, `platform admin`.

## Translate into Burmese (everything else)

Buttons, status, nav, places, and helper text: ဝင်ရောက်ရန်, သိမ်းရန်, ပယ်ဖျက်ရန်, ပြင်ဆင်ရန်, ဖျက်ရန်, ဌာန, ဌာနခွဲ, အဖွဲ့အစည်း, ဆက်တင်များ, နိုင်ငံ, ရက်စွဲ, ရှာရန်.

Do **not** leave `Save`, `Cancel`, `Settings`, `Sign in`, `Branches`, `Welcome`, `Home`, `Filter`, `Status`, `Actions` in English.

## Examples

```json
// ❌ Too English
"roles": "Roles",
"submit_button": "Sign in",
"help_body": "Contact your platform admin."

// ❌ Too Burmese (forced calques)
"account": "ကျွန်ုပ်၏ အကောင့်",
"help_body": "ပလက်ဖောင်း စီမံခန့်ခွဲသူကို ဆက်သွယ်ပါ။",
"roles": "အခန်းကဏ္ဍများ"

// ✅ Light mix
"account": "ကျွန်ုပ်၏ account",
"help_body": "သင့် platform admin ကို ဆက်သွယ်ပါ။",
"roles": "Role များ",
"submit_button": "ဝင်ရောက်ရန်"
```

English `en` stays fully English. Thai/Chinese stay fully localized. Do not copy this mix into those files.

## Application patch versions

`application_patch_versions` stores each application patch version. `patch_version` is exactly `00.00.00` (two digits, a dot, two digits, a dot, two digits). `patch_date_time` is the PatchDateTime. `is_current` is the current-version flag, and only one row may be current.

Every `git push` reads the current row, bumps `patch_version`, and inserts one new row. Increment the last segment by 1. When a segment would pass `99`, set it to `00` and add 1 to the segment on its left (`01.00.99` becomes `01.01.00`, `01.99.99` becomes `02.00.00`). Do not bump past `99.99.99`. The new row's `patch_date_time` is the current time, its `is_current` is true, and the previous current row is set to false in the same database transaction.

The hook script is `.githooks/pre-push`. It runs `go run ./cmd/bumpversion` in `backend/`. The program is named bumpversion because Windows treats an executable whose name contains patch as an installer and will not start it from the hook. That command reads `DATABASE_URL` from the environment or from `backend/.env` and inserts the row. It does not print the database URL. Git itself has no database client, so the hook's command is the write path. Copy `.githooks/pre-push` to `.git/hooks/pre-push` and mark it executable, or set `git config core.hooksPath .githooks`. If that database cannot be reached or rejects authentication, the hook exits non-zero and inserts nothing. It does not fall back to another database. Do not pass `--no-verify`: that skips the insert. Git has no client hook after a successful push, and this repository's GitHub Actions do not connect to the application database. Apply migrations before the first bump so the seeded current row `01.00.01` exists.
