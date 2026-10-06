-- Seed reference data. All people, organizations and campaigns in the app demo are FICTIONAL
-- and live in src/data/seed.ts so demo mode works with no backend. This file seeds shared lookups only.

insert into skills (name) values ('mathematics'),('resume review'),('digital literacy'),('spoken english practice'),('physics') on conflict do nothing;
insert into interests (name) values ('Education'),('Digital assistance'),('Elder support'),('Health awareness'),('Environment'),('Accessibility'),('Community service'),('Material reuse') on conflict do nothing;
insert into training_modules (title, role_scope, minutes) values
  ('Safety orientation', 'all', 10),
  ('Child-safeguarding orientation', 'teaching volunteer', 45),
  ('What not to advise: health walk companions', 'health awareness', 20);

-- Knowledge sources start as pending-verification. Passages must be checked against the Complete Works
-- by an editor before editorial_status is set to 'verified'. The Seva Guide only cites verified passages in production.
insert into knowledge_sources (work, edition, editorial_status) values
  ('Karma-Yoga', 'Complete Works, Advaita Ashrama edition (to confirm)', 'pending-verification');
