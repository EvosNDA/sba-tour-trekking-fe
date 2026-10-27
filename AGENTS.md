# Frontend contribution rules

## Internationalization

- All user-facing text must use the shared `useI18n()` translation function, including page copy, form labels, placeholders, validation and API error messages, button text, accessibility labels, tooltips, and empty/loading states.
- Keep English and Vietnamese dictionaries in `src/i18n/I18nProvider.tsx` in sync whenever adding or changing a translation key. Do not rely on English fallback for Vietnamese.
- Use interpolation values such as `{{email}}` or `{{count}}` for dynamic text; keep the same placeholders in both languages.
- Preserve UTF-8 for Vietnamese source text. Do not introduce mojibake or encode Vietnamese as HTML entities.
- Keep the user's selected language persistent through the shared i18n provider and make language switching available on pages where the app header is hidden.

## Product and workflow UX

- Every state-changing action must show the resulting state and the user's next step.
- Reversible actions such as archive, deactivate, or hide must have a clear restore/reactivate path in the same management flow. If the backend cannot reverse an action, say so before it is confirmed and do not present it as temporary.
- Explain material side effects before confirmation. After restoring an item to a draft or review state, explain what is required before it becomes public or active again.
- Keep create, edit, archive, and restore actions beside the list or item they affect. Do not leave duplicate or context-free primary actions on the page.
- Before handoff, inspect the target state in a browser when an appropriate role session is available. If the page is role-gated and no session is available, report that limitation rather than claiming visual verification.
