# Aumoha event deployment

This branch includes the security fixes from PR #33 and an event-only presentation mode. It does not merge or deploy the main branch.

## Behavior

With `NEXT_PUBLIC_EVENT_MODE=true`, the original home/navigation shell opens without login. Feature routes show clearly labelled upcoming-service previews. They do not display invented providers, start calls, collect payment, submit emergencies, place orders, or collect visitor account details. The standard app remains available when this flag is disabled; admin/provider routes retain authentication.

With `APP_MODE=event`, the backend independently rejects customer checkout/donation endpoints, consultation endpoints and event-preview writes. `/api/vets` returns an empty list. `/api/capabilities` returns non-secret readiness booleans even before database setup. This prevents a frontend-only flag from being treated as an authorization control.

## Hosting projects

Create two projects under the user's intended Vercel team, both pointing to this repository and the exact reviewed event commit:

| Project | Root | Framework | Node |
|---|---|---|---|
| `aumoha-event-demo` | `frontend` | Next.js | 24.x |
| `aumoha-api` | `backend` | Express | 24.x |

Use the committed lockfiles and `npm ci`. Frontend build: `npm run build`. Backend exports the Express app for Vercel and uses a cached, retryable database connection per instance/request lifecycle; local startup remains supported. Never attach production database credentials to unreviewed preview branches.

## Required configuration

Frontend:

- `NEXT_PUBLIC_EVENT_MODE=true`
- `NEXT_PUBLIC_API_URL=https://<backend-host>/api`
- Firebase client settings belonging to the actual Aumoha Firebase project
- `NEXT_PUBLIC_AGORA_APP_ID` may contain the public app ID; never a certificate

Backend:

- `APP_MODE=event`
- `CONSULTATIONS_ENABLED=false`
- `CUSTOMER_PAYMENTS_ENABLED=false`
- `CLIENT_URL=https://<frontend-host>`
- `MONGODB_URI` for the intended database
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` for backend authentication
- Actual verified administrators in `ADMIN_EMAILS`; configure `ADMIN_PASSWORD` for the existing admin second-lock UI
- Razorpay **test** `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Agora `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE`

Enter secrets directly into the hosting environment settings. Do not commit them or paste them into chat. The templates in `backend/.env.example` and `frontend/.env.example` contain no credentials. Previously committed test credentials must be rotated rather than reused.

## Integration checks

These checks are separate from public customer actions and require a genuine Firebase identity with verified admin access:

- `POST /api/integrations/razorpay/test-order`: creates an INR 1 **test-mode** order. Rejects live Razorpay keys. This verifies API access, not successful checkout/capture; follow with a private test checkout and reconciliation after credentials are configured.
- `GET /api/integrations/agora/test-token`: returns a ten-minute token for a private integration-test channel and an authenticated UID. Verify a two-device call privately. No public booking or doctor profile is required for this admin-only token test.
- `GET /api/capabilities`: reports presence of settings and whether customer actions are enabled, without returning keys or secrets. Presence is not provider validation.

The existing paid checkout and booked-consultation code remains for the later full app. Do not enable `CUSTOMER_PAYMENTS_ENABLED=true` or consultations solely because credentials are present. Resolve the release blockers in `AUDIT_2026-11-01.md`, onboard genuine providers and complete the required integration checks first.

## Verification and current blocker

Local backend TypeScript build and 20 mocked HTTP/security tests pass. Four frontend checkout tests pass, including an event-mode test that verifies checkout is never opened. Event frontend production build passes. Lint has zero errors and 150 existing warnings. These are not live Razorpay/Agora checks or rendered browser QA.

At preparation time, Vercel allowed reading team/project listings but returned HTTP 403 (`You don't have permission to create the project`) for project creation in `team_YaAnoAKvdvfgLMECyINn7JNf`. No Aumoha project or deployment was created, and no credentials were available. Actual hosting, browser smoke tests, live integration checks and a final public event link remain pending project/deployment access and the configuration above. No production data, real transactions or customer emails were used.
