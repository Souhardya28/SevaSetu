# SevaSetu

> Ask with dignity. Serve with humility. Grow through consistency.

SevaSetu ("setu" means bridge) connects people seeking support, volunteers, donors, social workers and verified organizations. It moves young people from giving an item, to helping one person, to joining collective action, with a transparent system and an AI guide that helps them serve safely and humbly.

**Three sections plus a guide**
- **Sathi**: person-to-person help (Sevak helps Sahabhagi).
- **Abhiyan**: transparent campaigns with a Public Ledger and bill checking.
- **Daan**: everyday material giving with safe handover.
- **Seva Guide**: an AI guide inspired by verified teachings of Swami Vivekananda. It is not him, never claims to be, and never gives clinical, legal or medical advice.

All people, organizations and campaigns in the demo are **fictional**.

## Philosophy (what the code enforces)
1. Service is worship. The person asking is not lesser, so there is no "case", "beneficiary" or "hero" language.
2. The served person gives too. Feedback, Prasad and the optional "I can offer" are never forced reciprocity.
3. Work without attachment to results. Reflections ask "what did they teach me?", never "how successful were you?".
4. No rankings, public ratings, "people helped" counters or leaderboards. Trust shows as qualitative tags only.
5. Humans decide. The AI suggests; moderators override. Nothing is frozen or removed by AI alone.

## Screens and flows
`src/app` (Expo Router):

| Route | Purpose |
|---|---|
| `/onboarding` `setup` `auth` `verify` | splash, welcome, language, roles, interests, availability, OTP/email/demo login, simulated verification |
| `/(tabs)` Home, Sathi, Abhiyan, Daan, Profile | five-tab navigation; Guide button floats unobtrusively |
| `/sathi/new` | 5-step request flow: words or voice, AI structure, optional offer, visibility, safety review |
| `/sathi/[id]` | request detail: human story first, boundaries, why it matches, feel-first pause (skippable) |
| `/sathi/room/[id]` | protected chat with tone check, meeting plan, check-in/out, trusted contact, block, report, kind cancel |
| `/sathi/complete/[id]` | private Sahabhagi feedback or Sevak reflection; suggests a related Abhiyan |
| `/journal` `/path` `/prasad` | Seva Journal and Inner Growth Map, Seva Path, Prasad |
| `/abhiyan/[id]` `/abhiyan/ledger/[id]` `/abhiyan/bill/[id]` | campaign dossier, roles, budget, Public Ledger, OCR bill review |
| `/daan/new` `/daan/[id]` `/daan/request` | post item with AI category suggestion, matching needs, reservation, handover code, receipt |
| `/guide` | Discover, Prepare, Reflect, Learn, Support modes with source citations and crisis routing |
| `/safety` `/privacy` `/verification` `/notifications` | safety centre and Code of Conduct, consents and data export, verification, calm notifications |
| `/moderator` | queue with reasons, confidence, evidence, recommended action, override, audit log |

## Technology
- **App**: Expo SDK 57, React Native 0.86, Expo Router, strict TypeScript, Zustand (persisted to AsyncStorage), Zod, lucide icons, token-based StyleSheet.
- **Backend** (`backend/`): FastAPI service with mock-first AI providers (structuring, tone, guide, bill analysis).
- **Data** (`supabase/`): Postgres + pgvector schema with Row Level Security.
- **Tests**: Jest (+ React Native Testing Library) and pytest.

Deviations from the original wish-list, chosen deliberately: a lightweight dictionary i18n instead of i18next; a styles-token system instead of NativeWind; TanStack Query, Reanimated and real audio capture are not wired because demo mode has no network layer to query. The architecture leaves a clear seam for each.

## Install and run
```bash
cd sevasetu
npm install
npx expo start            # press w for web, a for Android, or scan with Expo Go
```
Do not run Metro with `CI=1` during development: that disables file watching.

Backend (optional, the app works without it):
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

## Tests and checks
```bash
npm test                 # Jest: services, journeys, screen render tests
npm run typecheck        # tsc --noEmit
npx expo lint
cd backend && python -m pytest
```

## Environment variables
See `.env.example`. Everything defaults to demo mode with mock providers. Nothing is required to run the app.

## Demo accounts
Tap on the sign-in screen, or switch from Profile:
- **Aarav** (Sevak, also Sahabhagi): Journal, Prasad, matching.
- **Meera** (student Sahabhagi): asks for algebra help.
- **Kavya** (Moderator): reviews the queue.
- Email/phone sign-up works with demo OTP `123456`.

## AI provider setup
`LLM_PROVIDER`, `EMBEDDING_PROVIDER`, `OCR_PROVIDER`, `STT_PROVIDER` select providers in the backend. Defaults are `mock`. The app currently uses on-device rule-based services in `src/services` (identical logic to the backend mock) so demos work offline. See `docs/ARCHITECTURE.md` for the swap plan.

## Supabase setup
1. Create a project, enable `pgvector`.
2. `supabase db reset` (applies `supabase/migrations/0001_schema.sql` and `seed.sql`).
3. Create the private storage buckets listed at the bottom of the migration.
4. Fill `EXPO_PUBLIC_SUPABASE_URL` / `ANON_KEY`. Keep the service-role key on the server only.

The schema has been written for review and has **not** been applied to a live database in this build.

## Safety limitations
SevaSetu is not an emergency, clinical or legal service. Crisis helplines come from `src/constants/crisis.ts` and are flagged `needs-audit-before-launch`. Keyword crisis detection is conservative and will miss things. See `docs/RESPONSIBLE_AI.md` and `docs/KNOWN_LIMITATIONS.md`.

## Real versus mocked
| Real in this build | Mocked or simulated |
|---|---|
| Navigation, state, persistence, validation, offline drafts | OTP/email auth (code 123456) |
| Rule-based risk, tone, matching, crisis routing | Identity/college verification (no DigiLocker) |
| Explainable matching and recommendations | Voice capture and speech-to-text (sample transcript) |
| Ledger logic, duplicate/mismatch flags, moderation | OCR (two sample bills; photos analysed as sample A) |
| Handover codes, reservations, consent records | Payments (sandbox only), blood-centre booking, push notifications |
| | Vivekananda passages (demo content, see below) |

## Vivekananda content
The passages in `src/data/seed.ts` are **demo content marked `demo-pending-verification`**. Exact lecture and page locations are deliberately labelled "to be verified". Before any public launch, an editor must verify each passage against the Complete Works. The UI says so on every card.

## Production roadmap
Real identity provider, payment partner, Supabase auth and Realtime chat, OCR and STT providers, pgvector retrieval over verified passages, push notifications, WhatsApp/IVR for low-literacy users, advanced anomaly detection, audited crisis resources per locale, security review and penetration test.
