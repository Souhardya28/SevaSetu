# Known limitations

**Not production ready.** This is a hackathon MVP.

- **No real backend connection.** The app runs entirely on local state. `backend/` and `supabase/` exist and are tested (backend) or written for review (SQL), but the app does not call them yet. The SQL was not applied to a live database.
- **Authentication is simulated.** OTP is `123456`. Verification (phone, college, identity) is simulated; there is no DigiLocker integration.
- **Voice is simulated.** No microphone or speech-to-text; a sample transcript is inserted.
- **OCR is simulated.** Two sample bills produce deterministic output. Any real photo is analysed as sample A and labelled as such.
- **Payments are sandbox only**; no money moves. Blood-centre booking is a mock sheet.
- **Counterpart behaviour is simulated** (auto check-in/out, canned chat replies, labelled demo). Both sides run on one device.
- **Vivekananda passages are demo content**, unverified, with locations marked "to be verified". Do not present them as authenticated quotations.
- **Crisis detection is keyword based** and helpline numbers need an audit per locale before launch.
- **Hindi coverage is partial**: navigation, Home headings and a few labels. Most body copy is English. Marathi etc. are not provided.
- **Dynamic text** follows the platform setting but was not tested at extreme sizes. Screen-reader labels are set on interactive components but were not tested with a real screen reader (VoiceOver/TalkBack).
- **Reduced motion** follows the OS setting or the in-app toggle (OS path untested on device).
- **Android and iOS devices were not tested.** Verified on the web target in a 320 to 375 px viewport plus Jest. Native modules (haptics, image picker) should be checked on device.
- **Notifications are in-app only**, no push.
- **Not built**: organization-to-organization exchange, WhatsApp/IVR, advanced anomaly detection, vision-based condition estimation, Realtime chat, moderation SLAs, trust-tag aggregation job.
- Dismissed campaigns can be restored; "Not interested" does not yet feed back into a model.
- The persisted store has no migrations: after changing seed data, use Profile > Reset all demo data.
