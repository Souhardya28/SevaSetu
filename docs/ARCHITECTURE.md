# Architecture notes

## Layers
```
src/app            Expo Router screens (thin; compose components and call the store)
src/components     ui.tsx (primitives, sheets, states) and domain.tsx (named domain components)
src/services       Pure domain logic: safety, tone, structuring, matching, guide, ocr, path
src/store          One persisted Zustand store (useApp) holding all demo state and actions
src/data           Fictional seed data
src/constants      Design tokens, crisis-resource configuration
src/i18n           Dictionary-based translation (en, hi)
backend/           FastAPI mirror of the AI services behind provider switches
supabase/          Postgres + pgvector schema with RLS
```
Services are pure functions with no React or storage imports, so they are unit tested and can move behind an API without change.

## Demo mode
All data lives in the store and persists to AsyncStorage. Both sides of each journey are in one device: switch the demo account (Profile) to act as the other party. Counterpart replies and check-ins are simulated and labelled "(demo)".

## Moving to production
| Concern | Demo | Production plan |
|---|---|---|
| Auth | Local demo login | Supabase Auth (phone OTP, email) |
| Data | Zustand + AsyncStorage | TanStack Query over Supabase, RLS from `0001_schema.sql` |
| Chat | Local messages | Supabase Realtime on `messages`, RLS by conversation membership |
| Structuring, tone, guide | `src/services/*` | `backend/app/main.py` endpoints with an LLM behind a provider interface |
| Retrieval | Tag and keyword scoring | pgvector over `knowledge_passages` with `editorial_status = 'verified'` only |
| OCR | Two deterministic samples | Tesseract or cloud OCR in `OCR_PROVIDER`, results stored in `expense_documents.ocr` |
| Voice | Sample transcript | expo-audio capture, Whisper or Bhashini transcription, upload retry queue (queue UI already exists) |
| Verification | Simulated | DigiLocker or authorised provider; store results only in `verification_checks` |
| Payments | Sandbox ledger line | Licensed payment partner behind an interface; anonymity is public-only, records kept privately |

## Access control summary
- Reflections: owner-only, not even moderators.
- Requests: owner plus open public/circle requests that are not high risk.
- Matches and messages: participants only.
- Ledger: public read of redacted rows; org members insert; moderators update.
- Original receipts: org members and moderators only; the public sees the redacted copy.
- Moderation actions require a human `moderator_id` (NOT NULL), so AI cannot take irreversible actions.

## Design decisions worth knowing
- Selectors that return fresh arrays loop forever under Zustand 5. Screens select the raw array and filter with `useMemo`.
- The Guide button hides on routes with sticky footers or inputs so it never covers an action.
- A route-level `ErrorBoundary` shows a calm message and retry instead of a blank screen.
