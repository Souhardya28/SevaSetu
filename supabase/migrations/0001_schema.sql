-- SevaSetu schema. Postgres + pgvector + Row Level Security.
-- Principles: minimum data, approximate location only, reflections private, results-only verification,
-- soft deletion, audit timestamps, consent versions, retention fields.
-- NOTE: designed for review, not yet applied to a live project. Run `supabase db reset` to test locally.

create extension if not exists "pgcrypto";
create extension if not exists vector;

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create type role_key as enum ('sevak','sahabhagi','organization','anchor','donor','moderator');
create type risk_level as enum ('low','medium','high','prohibited');
create type visibility as enum ('private','circle','public');

/* ---------------- identity and profile ---------------- */
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  bio text,
  approx_area text,                    -- never exact address
  languages text[] not null default '{}',
  lang_pref text not null default 'en',
  restricted boolean not null default false,
  deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table user_roles (user_id uuid references profiles(id) on delete cascade, role role_key, primary key (user_id, role));
create table affiliations (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id) on delete cascade, name text not null, consented_public boolean not null default false, created_at timestamptz default now());
-- Verification stores RESULTS only. Never raw Aadhaar/PAN or document images.
create table verification_checks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('phone','college','identity','orientation','skill')),
  result text not null check (result in ('pending','passed','failed','expired')),
  provider text, provider_ref text, checked_at timestamptz, expires_at timestamptz, created_at timestamptz default now()
);
create table skills (id serial primary key, name text unique not null);
create table user_skills (user_id uuid references profiles(id) on delete cascade, skill_id int references skills(id), verified boolean default false, primary key (user_id, skill_id));
create table availability (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id) on delete cascade, slot text not null);
create table interests (id serial primary key, name text unique not null);
create table user_interests (user_id uuid references profiles(id) on delete cascade, interest_id int references interests(id), primary key (user_id, interest_id));
create table training_modules (id uuid primary key default gen_random_uuid(), title text not null, role_scope text, minutes int);
create table training_completions (user_id uuid references profiles(id) on delete cascade, module_id uuid references training_modules(id), completed_at timestamptz default now(), primary key (user_id, module_id));

/* ---------------- Sathi ---------------- */
create table help_requests (
  id uuid primary key default gen_random_uuid(), requester_id uuid not null references profiles(id) on delete cascade,
  original_text text not null,               -- preserved verbatim
  title text not null, category text not null, outcome text, language text, mode text check (mode in ('remote','in-person')),
  approx_area text, minutes int, accessibility text[] default '{}', skills_needed text[] default '{}', offer text,
  visibility visibility not null default 'circle', risk risk_level not null default 'low', risk_reasons text[] default '{}',
  status text not null default 'open' check (status in ('open','matched','completed','pending-review','cancelled')),
  embedding vector(384), deleted_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now()
);
create index on help_requests (status, visibility) where deleted_at is null;
create index on help_requests using ivfflat (embedding vector_cosine_ops) with (lists = 50);
create table help_request_versions (id uuid primary key default gen_random_uuid(), request_id uuid references help_requests(id) on delete cascade, snapshot jsonb not null, edited_by uuid references profiles(id), created_at timestamptz default now());
create table request_visibility (request_id uuid references help_requests(id) on delete cascade, circle_id text, primary key (request_id, circle_id));
create table matches (id uuid primary key default gen_random_uuid(), request_id uuid not null references help_requests(id), sevak_id uuid not null references profiles(id), sahabhagi_id uuid not null references profiles(id), status text not null default 'planning', contact_shared boolean not null default false, created_at timestamptz default now());
create index on matches (sevak_id); create index on matches (sahabhagi_id);
create table service_sessions (id uuid primary key default gen_random_uuid(), match_id uuid not null references matches(id) on delete cascade, starts_at timestamptz, completed_at timestamptz);
create table meeting_plans (id uuid primary key default gen_random_uuid(), match_id uuid not null references matches(id) on delete cascade, when_label text, place text, place_kind text check (place_kind in ('public','campus','online','other')), notes text);
create table safety_checkins (id uuid primary key default gen_random_uuid(), match_id uuid references matches(id) on delete cascade, user_id uuid references profiles(id), kind text check (kind in ('in','out')), at timestamptz default now());
-- Feedback is private. Aggregated trust tags are derived, never raw scores.
create table feedback (id uuid primary key default gen_random_uuid(), match_id uuid not null references matches(id), from_user uuid not null references profiles(id), arrived boolean, respected boolean, listened boolean, boundaries boolean, again boolean, comment text, created_at timestamptz default now());
create table trust_tags (user_id uuid references profiles(id) on delete cascade, tag text, aggregate_weight int not null default 0, primary key (user_id, tag));

/* ---------------- Abhiyan ---------------- */
create table organizations (id uuid primary key default gen_random_uuid(), name text not null, kind text, verified_on date, created_at timestamptz default now());
create table organization_members (org_id uuid references organizations(id) on delete cascade, user_id uuid references profiles(id) on delete cascade, role text, primary key (org_id, user_id));
create table organization_verifications (id uuid primary key default gen_random_uuid(), org_id uuid references organizations(id) on delete cascade, item text not null, status text not null check (status in ('verified','pending','rejected')), reviewed_by uuid references profiles(id), reviewed_at timestamptz);
create table campaigns (id uuid primary key default gen_random_uuid(), org_id uuid not null references organizations(id), title text not null, category text not null, story text, objective text, approx_area text, goal_amount numeric(12,2), status text not null default 'active' check (status in ('active','paused','completed','under-review')), external_booking boolean default false, deleted_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table campaign_roles (id uuid primary key default gen_random_uuid(), campaign_id uuid references campaigns(id) on delete cascade, title text not null, slots int not null, risk risk_level not null default 'low', training_id uuid references training_modules(id));
create table campaign_participants (campaign_id uuid references campaigns(id) on delete cascade, role_id uuid references campaign_roles(id), user_id uuid references profiles(id) on delete cascade, status text not null check (status in ('confirmed','needs-training','pending-approval')), primary key (campaign_id, role_id, user_id));
create table campaign_budgets (id uuid primary key default gen_random_uuid(), campaign_id uuid references campaigns(id) on delete cascade, label text not null, planned numeric(12,2) not null);
create table campaign_ledger_entries (
  id uuid primary key default gen_random_uuid(), campaign_id uuid not null references campaigns(id) on delete cascade,
  kind text not null check (kind in ('in','out')), amount numeric(12,2) not null check (amount >= 0), category text, purpose text, vendor text, occurred_on date not null,
  receipt_status text not null default 'pending' check (receipt_status in ('verified','pending','missing','duplicate','mismatch','corrected')),
  human_review text not null default 'pending' check (human_review in ('reviewed','pending','n/a')),
  anonymous boolean not null default false, correction_of uuid references campaign_ledger_entries(id), note text, created_at timestamptz default now()
);
create index on campaign_ledger_entries (campaign_id, occurred_on);
-- Receipt files live in a PRIVATE storage bucket; only the redacted copy path is exposed.
create table expense_documents (id uuid primary key default gen_random_uuid(), entry_id uuid references campaign_ledger_entries(id) on delete cascade, original_path text not null, redacted_path text, ocr jsonb, ocr_engine text, created_at timestamptz default now());
create table campaign_updates (id uuid primary key default gen_random_uuid(), campaign_id uuid references campaigns(id) on delete cascade, body text, consent_confirmed boolean not null default false, created_at timestamptz default now());
create table campaign_status_history (id uuid primary key default gen_random_uuid(), campaign_id uuid references campaigns(id) on delete cascade, status text not null, note text, decided_by uuid references profiles(id) not null, at timestamptz default now()); -- a human is always recorded

/* ---------------- Daan ---------------- */
create table item_listings (id uuid primary key default gen_random_uuid(), donor_id uuid not null references profiles(id) on delete cascade, title text not null, category text not null, description text, condition text, condition_confirmed boolean default false, quantity int default 1, approx_area text, pickup text, audience text, status text default 'available', photo_path text, deleted_at timestamptz, created_at timestamptz default now());
create table item_requests (id uuid primary key default gen_random_uuid(), requester_id uuid references profiles(id), org_id uuid references organizations(id), category text, body text, verified boolean default false, created_at timestamptz default now());
create table item_matches (listing_id uuid references item_listings(id) on delete cascade, request_id uuid references item_requests(id) on delete cascade, reason text, primary key (listing_id, request_id));
create table item_reservations (id uuid primary key default gen_random_uuid(), listing_id uuid references item_listings(id), request_id uuid references item_requests(id), pickup_point text, code_hash text, status text default 'reserved', expires_at timestamptz);
create table handover_confirmations (reservation_id uuid primary key references item_reservations(id) on delete cascade, condition_ok boolean, thanks text, confirmed_at timestamptz default now());

/* ---------------- growth (private) ---------------- */
create table reflections (id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id) on delete cascade, match_id uuid references matches(id), taught text, listened_well text, assumed_quickly text, next_time text, qualities text[] default '{}', embedding vector(384), created_at timestamptz default now());
create index on reflections (user_id, created_at desc);
create table reflection_themes (reflection_id uuid references reflections(id) on delete cascade, theme text, primary key (reflection_id, theme));
create table personal_commitments (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id) on delete cascade, body text not null, done boolean default false, created_at timestamptz default now());
create table prasad_messages (id uuid primary key default gen_random_uuid(), to_user uuid not null references profiles(id) on delete cascade, from_user uuid references profiles(id), kind text check (kind in ('text','voice')), body text, audio_path text, opened_at timestamptz, reported boolean default false, created_at timestamptz default now());

/* ---------------- messaging ---------------- */
create table conversations (id uuid primary key default gen_random_uuid(), match_id uuid references matches(id) on delete cascade, closes_at timestamptz);
create table conversation_members (conversation_id uuid references conversations(id) on delete cascade, user_id uuid references profiles(id) on delete cascade, primary key (conversation_id, user_id));
create table messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references conversations(id) on delete cascade, sender_id uuid references profiles(id), body text not null, created_at timestamptz default now());
create index on messages (conversation_id, created_at);
create table message_safety_flags (message_id uuid references messages(id) on delete cascade, kind text, confidence text, status text default 'open', primary key (message_id, kind));

/* ---------------- safety and governance ---------------- */
create table reports (id uuid primary key default gen_random_uuid(), reporter_id uuid references profiles(id), target_type text not null, target_id text, reason text not null, detail text, status text default 'received', evidence_preserved boolean default true, created_at timestamptz default now());
create table incidents (id uuid primary key default gen_random_uuid(), report_id uuid references reports(id), status text default 'open', severity risk_level default 'medium', opened_at timestamptz default now(), closed_at timestamptz);
create table moderation_actions (id uuid primary key default gen_random_uuid(), incident_id uuid references incidents(id), moderator_id uuid not null references profiles(id), action text not null, note text, overrides_ai boolean default false, at timestamptz default now()); -- moderator_id NOT NULL: irreversible actions are never AI-only
create table appeals (id uuid primary key default gen_random_uuid(), action_id uuid references moderation_actions(id), user_id uuid references profiles(id), body text, status text default 'open', created_at timestamptz default now());
create table consents (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id) on delete cascade, purpose text not null, granted boolean not null, version text not null, at timestamptz default now());
create table data_access_logs (id uuid primary key default gen_random_uuid(), actor uuid, subject uuid, resource text, reason text, at timestamptz default now());
create table deletion_requests (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id), requested_at timestamptz default now(), purge_after timestamptz default (now() + interval '30 days'), cancelled boolean default false);
create table audit_events (id bigserial primary key, actor uuid, action text not null, target text, at timestamptz default now());
create table notifications (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id) on delete cascade, title text, body text, href text, read_at timestamptz, created_at timestamptz default now());

/* ---------------- knowledge / RAG ---------------- */
create table knowledge_sources (id uuid primary key default gen_random_uuid(), work text not null, edition text, editorial_status text not null default 'pending-verification' check (editorial_status in ('pending-verification','verified','retired')), verified_by uuid references profiles(id));
create table knowledge_passages (id uuid primary key default gen_random_uuid(), source_id uuid not null references knowledge_sources(id), chapter text, location text not null, body text not null, kind text not null check (kind in ('direct-quote','paraphrase')), tags text[] default '{}', embedding vector(384));
create index on knowledge_passages using ivfflat (embedding vector_cosine_ops) with (lists = 20);
create table retrieval_events (id uuid primary key default gen_random_uuid(), passage_id uuid references knowledge_passages(id), confidence real, at timestamptz default now()); -- no user text stored
create table chat_sessions (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id) on delete cascade, mode text, started_at timestamptz default now());
create table chat_safety_events (id uuid primary key default gen_random_uuid(), session_id uuid references chat_sessions(id) on delete cascade, kind text not null, at timestamptz default now()); -- kind only, never message content

/* ---------------- updated_at triggers ---------------- */
do $$ declare t text; begin
  foreach t in array array['profiles','help_requests','campaigns'] loop
    execute format('create trigger trg_%I_updated before update on %I for each row execute function set_updated_at()', t, t);
  end loop; end $$;

/* ---------------- Row Level Security ---------------- */
create or replace function is_moderator() returns boolean language sql stable security definer as
$$ select exists (select 1 from user_roles where user_id = auth.uid() and role = 'moderator') $$;

do $$ declare t text; begin
  foreach t in array array['profiles','user_roles','verification_checks','help_requests','matches','feedback','reflections','personal_commitments','prasad_messages','messages','conversations','conversation_members',
    'reports','consents','deletion_requests','notifications','item_listings','campaign_ledger_entries','expense_documents','moderation_actions','chat_sessions','chat_safety_events']
  loop execute format('alter table %I enable row level security', t); end loop; end $$;

-- Profiles: anyone signed in sees public fields via a view; only the owner edits.
create policy profiles_self on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_mod_read on profiles for select using (is_moderator());

-- Reflections: PRIVATE. Not even moderators can read them.
create policy reflections_owner on reflections for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy commitments_owner on personal_commitments for all using (user_id = auth.uid());
create policy prasad_recipient on prasad_messages for select using (to_user = auth.uid());
create policy prasad_sender_insert on prasad_messages for insert with check (from_user = auth.uid());
create policy prasad_recipient_delete on prasad_messages for delete using (to_user = auth.uid());

-- Help requests: owner full; others only if public/circle, open, and not blocked.
create policy requests_owner on help_requests for all using (requester_id = auth.uid()) with check (requester_id = auth.uid());
create policy requests_visible on help_requests for select using (status = 'open' and visibility in ('public','circle') and deleted_at is null and risk <> 'high');
create policy requests_mod on help_requests for select using (is_moderator());

-- Matches and messages: participants only.
create policy matches_participants on matches for select using (auth.uid() in (sevak_id, sahabhagi_id));
create policy members_self on conversation_members for select using (user_id = auth.uid());
create policy messages_members on messages for select using (exists (select 1 from conversation_members m where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()));
create policy messages_send on messages for insert with check (sender_id = auth.uid() and exists (select 1 from conversation_members m where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()));
-- Feedback is private to its author and moderators.
create policy feedback_author on feedback for select using (from_user = auth.uid() or is_moderator());

-- Ledger: public read of redacted entries; writes only by organization members.
create policy ledger_public_read on campaign_ledger_entries for select using (true);
create policy ledger_org_write on campaign_ledger_entries for insert with check (exists (select 1 from campaigns c join organization_members om on om.org_id = c.org_id where c.id = campaign_id and om.user_id = auth.uid()));
create policy ledger_mod_update on campaign_ledger_entries for update using (is_moderator());
-- Original receipts (unredacted) are moderator/org-only; the public sees redacted_path via a signed URL function.
create policy docs_org_or_mod on expense_documents for select using (is_moderator() or exists (select 1 from campaign_ledger_entries e join campaigns c on c.id = e.campaign_id join organization_members om on om.org_id = c.org_id where e.id = entry_id and om.user_id = auth.uid()));

-- Reports and moderation.
create policy reports_reporter on reports for select using (reporter_id = auth.uid() or is_moderator());
create policy reports_insert on reports for insert with check (reporter_id = auth.uid());
create policy modactions_mod on moderation_actions for all using (is_moderator()) with check (is_moderator() and moderator_id = auth.uid());

-- Consent, deletion, notifications: owner only.
create policy consents_owner on consents for all using (user_id = auth.uid());
create policy deletion_owner on deletion_requests for all using (user_id = auth.uid());
create policy notifications_owner on notifications for all using (user_id = auth.uid());

-- Chat safety events carry no content and are readable only by the owner and moderators.
create policy chat_sessions_owner on chat_sessions for all using (user_id = auth.uid());
create policy chat_safety_mod on chat_safety_events for select using (is_moderator());

/* ---------------- storage buckets (create via dashboard or supabase/config.toml) ----------------
   item-photos         private, signed URLs, 1 MB compressed
   voice-notes         private, owner + recipient only
   receipts-original   private, org + moderator only
   receipts-redacted   public-read through signed URLs
   campaign-evidence   private until consent_confirmed = true
-------------------------------------------------------------------------------------------------- */
