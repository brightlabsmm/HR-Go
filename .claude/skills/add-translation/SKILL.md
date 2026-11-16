---
name: add-translation
description: Use when adding or changing UI text. Covers the en, my, th and zh locale files, key parity, i18n registration, and the Myanmar light-mix vocabulary.
---

# Add a translation

Locales live in `frontend/src/locales/{en,my,th,zh}/<namespace>.json`. Every namespace file must exist in all four with the same key set. Namespaces today: `account, auth, branches, common, departments, home, organizations, positions, roles, users`.

Note: `SUPPORTED_LOCALES` in `frontend/src/constants/locales.ts` is currently `["en", "my"]`, so the language switcher only offers those two. `th` and `zh` are still registered and must be kept complete. Do not change `SUPPORTED_LOCALES` unless asked.

## Steps

1. Add the key to `en/<ns>.json` first, as the source of truth. Use nested snake_case keys (`form.errors.code_required`) and `{{name}}` interpolation for variables.
2. Add the same key, at the same path, to `my`, `th` and `zh`. Keep interpolation variables identical.
3. **New namespace?** Create `<ns>.json` in all four dirs, then in `frontend/src/app/i18n.ts` add the four imports, the four `resources` entries and the name in the `ns` array.
4. Use it: `const { t } = useTranslation("<ns>")`. Shared words (status, actions, states) come from `common`, for example `tCommon("status.active")`.
5. Verify parity (run from `frontend/`):
   ```bash
   python3 - <<'EOF'
   import json, glob
   def keys(d, p=""):
       for k, v in d.items():
           if isinstance(v, dict): yield from keys(v, p + k + ".")
           else: yield p + k
   for f in glob.glob("src/locales/en/*.json"):
       e = set(keys(json.load(open(f))))
       for l in ["my", "th", "zh"]:
           o = set(keys(json.load(open(f.replace("/en/", f"/{l}/")))))
           if e != o: print("MISMATCH", f, l, sorted(e ^ o))
   print("done")
   EOF
   ```
   It must print only `done`.

## Language rules

- `en`: fully English.
- `th`, `zh`: fully localized (no English leftovers except proper nouns).
- `my` (Myanmar) uses a **light mix**: mostly Burmese, with a few loanwords kept in English.
  - Keep in English: `platform`, `account`, `admin`, `email`, `password`, `user`, `role`, `permission`, `profile`, `portal`, `tenant`. Use them inside Burmese sentences or with a Burmese plural: `account`, `Role များ`, `platform admin`.
  - Translate everything else: buttons, status, nav, places, helper text. Never leave `Save, Cancel, Settings, Sign in, Branches, Welcome, Home, Filter, Status, Actions` in English.
  - Reference vocabulary: ဝင်ရောက်ရန် (sign in), သိမ်းရန် (save), ပယ်ဖျက်ရန် (cancel), ပြင်ဆင်ရန် (edit), ဖျက်ရန် (delete), ဌာန (department), ဌာနခွဲ (branch), အဖွဲ့အစည်း (organization), ဆက်တင်များ (settings), နိုင်ငံ (country), ရက်စွဲ (date), ရှာရန် (search).
  - Examples: ✅ `"account": "ကျွန်ုပ်၏ account"`, `"roles": "Role များ"`, `"submit_button": "ဝင်ရောက်ရန်"`. ❌ `"submit_button": "Sign in"` (too English), ❌ `"roles": "အခန်းကဏ္ဍများ"` (forced calque).

## Done checklist

- [ ] Key exists at the same path in all four locales, same interpolation variables
- [ ] New namespace registered in `i18n.ts` (imports, `resources`, `ns`)
- [ ] `my` follows the light-mix vocabulary
- [ ] No hardcoded user-facing strings left in the component
- [ ] `yarn typecheck` and `yarn lint` pass (from `frontend/`)
