# Responsible AI notes

## What the AI does
Structures requests, suggests tone edits, suggests item categories, explains matches, flags ledger anomalies and retrieves source-labelled passages. It never makes a final decision about a person or money.

## Commitments and where they are enforced
| Commitment | Enforcement |
|---|---|
| No hidden rewriting | Tone check shows the flagged phrase, why, and a suggestion; the user chooses "Use suggestion" or "Keep mine" (`sathi/room/[id].tsx`, `services/tone.ts`) |
| Original words preserved | `HelpRequest.originalText` stored verbatim and shown beside the structure |
| No AI certainty | Match text always ends "a suggestion, not a guarantee"; no percentages shown |
| No fake quotations | Every passage carries work, chapter, location, direct-quote or paraphrase label; low retrieval confidence returns "no verified passage" (tests: `services.test.ts`) |
| No impersonation | Guide opens "I am an AI guide inspired by verified teachings... I am not him" |
| Passages are unverified | All demo passages are `demo-pending-verification` and the card says so. Verify against the Complete Works before launch |
| Crisis is not chat | `detectCrisis` runs before anything else; the reply has no philosophy and shows configured helplines; no authorities are contacted; only a counter is logged, never content |
| No accusation | Bill flags read "may be a genuine repeat purchase" and require human review; only moderators can change status or pause |
| No irreversible AI moderation | `moderation_actions.moderator_id` is NOT NULL; the UI offers override on every flag |
| Private reflections | Owner-only RLS; model training consent off by default; "point to my reflections" is a separate opt-in |
| No sensitive inference | Recommendations use only chosen interests, skills, language, distance, availability |
| No pressure | No streaks, no leaderboards, no public counts; "Trusted Sevak" threshold is never displayed (tested) |

## Known weaknesses
- Crisis detection is keyword based. It will miss indirect expressions and other languages. It errs toward showing help, and a production system needs a vetted classifier plus clinician review.
- Tone rules are English-centric and small.
- The structuring heuristics are crude. Confidence is shown so users correct them.
- Helpline numbers are in configuration and flagged for audit.

## Review checklist before any real users
Verified Vivekananda corpus; clinician-reviewed crisis wording; audited helplines for each locale; moderator training; bias review of matching; data protection impact assessment; incident response runbook.
