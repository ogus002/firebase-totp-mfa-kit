# Accessibility

## Code inputs

- `type="text"` + `inputMode="numeric"` — numeric keyboard on mobile without
  losing leading-zero behavior (`type="number"` strips zeros).
- `autoComplete="one-time-code"` — iOS / Android auto-fill from SMS or 1Password.
- `pattern="\d{6}"`, `minLength={6}`, `maxLength={6}` — browser-side hint.
- `required` — form submission blocked when empty.
- Filters non-digits on every `onChange` to keep state clean.

## ARIA + screen readers

- Each card uses `role="region"` with `aria-label` (the visible title).
- Inputs reference errors via `aria-describedby` when an error is present.
- Inputs set `aria-invalid={true}` on error.
- Errors render in a `<p role="alert" aria-live="assertive">` so screen readers
  announce them immediately.
- Success state uses `role="status" aria-live="polite"` — less interruptive.
- QR image has `alt={t.qrAlt}` (translatable).

## Focus management

- On QR stage entry, the 6-digit input receives focus.
- On MFA prompt entry, the code input receives focus.
- On verification failure, focus stays on the input (no scroll jump).

## Contrast + theming

The CSS uses CSS variables. Defaults meet WCAG AA. Override:

```css
:root {
  --totp-primary: #1e40af;       /* better contrast on light bg */
  --totp-primary-fg: #ffffff;
  --totp-error: #b91c1c;
}
```

Dark mode is applied via `@media (prefers-color-scheme: dark)`. Override the same
variables under `[data-theme="dark"]` if your app uses manual theming.

## Reduced motion

The kit currently has no animations. If you add some, gate with:

```css
@media (prefers-reduced-motion: reduce) {
  .totp-card * { animation: none !important; transition: none !important; }
}
```

## Manual key

The QR fallback (manual setup key) is rendered inside a `<details>` element.
Keyboard users can `Tab` to it and `Enter` to expand. The key text is
`user-select: all` for easy copy.

## Outstanding items

- Localized texts beyond `en` — see `docs/i18n.md`.
- High-contrast mode (Windows) tested informally; no specific overrides yet.
