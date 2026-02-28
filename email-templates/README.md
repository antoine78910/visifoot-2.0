# DeepFoot – Supabase email templates

These HTML templates match your app’s style (dark theme, DeepFoot teal `#00ffe8`) and are ready to paste into **Supabase Dashboard**.

## How to use

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **Email Templates**.
2. For each type below, open the matching `.html` file in this folder, copy **all** its content, and paste it into the corresponding template in Supabase (replace the existing body).
3. Leave the Supabase variables as-is: `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}` (they are replaced by Supabase when sending).

## Template mapping

| Supabase template      | File in this folder              |
|------------------------|----------------------------------|
| **Confirm signup**     | `confirm-signup.html`            |
| **Change Email Address** | `confirm-email-change.html`   |
| **Reset Password**     | `reset-password.html`           |

## Design

- Dark background `#0f0f14`, card `#18181b` with subtle border.
- Brand color for logo and primary button: `#00ffe8` (DeepFoot teal).
- CTA buttons: gradient teal, dark text, rounded.
- Footer: “AI Football Predictions · deepfoot.ai”.
- Inline CSS only so it works in common email clients.
