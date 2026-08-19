/*
# SafeNet AI – Core Schema

## Overview
Creates the full multi-tenant schema for the SafeNet AI student safety platform:
profiles, trusted_contacts, journeys, safety_events, notifications, and
safety_checkins. Every table is owner-scoped to the authenticated user via
`user_id` with Row Level Security enabled and four CRUD policies each.

## New Tables
1. **profiles** – extends auth.users with student-specific fields
   (college, student_id, emergency contact, avatar). One row per user.
2. **trusted_contacts** – people the student trusts (parent, roommate, warden).
   Includes a primary flag and notification preference.
3. **journeys** – a trip the student is monitoring. Tracks start/destination,
   expected vs actual arrival, status, risk level/score, optional note and
   trusted contact, and optional lat/lng for start/destination.
4. **safety_events** – an immutable log of safety-related events tied to a
   journey (route deviation, check-in, SOS, etc.). `is_simulation` flags
   demo-mode events.
5. **notifications** – user-facing notification center items with read/unread.
6. **safety_checkins** – a check-in requested during a journey; tracks
   request/response timestamps, response, and status.

## Security
- RLS enabled on every table.
- Four policies (SELECT/INSERT/UPDATE/DELETE) per table, scoped
  `TO authenticated` with `auth.uid() = user_id` ownership checks.
- `user_id` columns default to `auth.uid()` so inserts that omit the owner
  still satisfy the WITH CHECK constraint.
- A trigger auto-creates a profile row when a new auth.users row is inserted.

## Important Notes
1. The `handle_new_user` trigger function inserts a profile row from the
   signup metadata (full_name, phone, college, student_id, emergency contact).
2. `is_primary` on trusted_contacts is enforced client-side (only one primary
   per user) — the DB allows multiple but the app toggles them.
3. All timestamps are timestamptz defaulting to now().
*/

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  college text,
  student_id text,
  emergency_contact_name text,
  emergency_contact_phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, college, student_id, emergency_contact_name, emergency_contact_phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'college',
    NEW.raw_user_meta_data->>'student_id',
    NEW.raw_user_meta_data->>'emergency_contact_name',
    NEW.raw_user_meta_data->>'emergency_contact_phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- trusted_contacts ----------
CREATE TABLE IF NOT EXISTS trusted_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text NOT NULL DEFAULT 'Other',
  phone text NOT NULL,
  email text,
  is_primary boolean NOT NULL DEFAULT false,
  notification_pref text NOT NULL DEFAULT 'both',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_contacts" ON trusted_contacts;
CREATE POLICY "select_own_contacts" ON trusted_contacts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_contacts" ON trusted_contacts;
CREATE POLICY "insert_own_contacts" ON trusted_contacts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_contacts" ON trusted_contacts;
CREATE POLICY "update_own_contacts" ON trusted_contacts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_contacts" ON trusted_contacts;
CREATE POLICY "delete_own_contacts" ON trusted_contacts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- journeys ----------
CREATE TABLE IF NOT EXISTS journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  start_location text NOT NULL,
  destination text NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  expected_arrival timestamptz NOT NULL,
  actual_arrival timestamptz,
  status text NOT NULL DEFAULT 'planned',
  risk_level text NOT NULL DEFAULT 'low',
  risk_score integer NOT NULL DEFAULT 0,
  note text,
  trusted_contact_id uuid REFERENCES trusted_contacts(id) ON DELETE SET NULL,
  distance_km numeric,
  start_lat numeric,
  start_lng numeric,
  dest_lat numeric,
  dest_lng numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_journeys" ON journeys;
CREATE POLICY "select_own_journeys" ON journeys FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_journeys" ON journeys;
CREATE POLICY "insert_own_journeys" ON journeys FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_journeys" ON journeys;
CREATE POLICY "update_own_journeys" ON journeys FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_journeys" ON journeys;
CREATE POLICY "delete_own_journeys" ON journeys FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- safety_events ----------
CREATE TABLE IF NOT EXISTS safety_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_id uuid REFERENCES journeys(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  description text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'info',
  is_simulation boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE safety_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_events" ON safety_events;
CREATE POLICY "select_own_events" ON safety_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_events" ON safety_events;
CREATE POLICY "insert_own_events" ON safety_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_events" ON safety_events;
CREATE POLICY "update_own_events" ON safety_events FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_events" ON safety_events;
CREATE POLICY "delete_own_events" ON safety_events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- notifications ----------
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- safety_checkins ----------
CREATE TABLE IF NOT EXISTS safety_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  response text,
  status text NOT NULL DEFAULT 'pending'
);

ALTER TABLE safety_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_checkins" ON safety_checkins;
CREATE POLICY "select_own_checkins" ON safety_checkins FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_checkins" ON safety_checkins;
CREATE POLICY "insert_own_checkins" ON safety_checkins FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_checkins" ON safety_checkins;
CREATE POLICY "update_own_checkins" ON safety_checkins FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_checkins" ON safety_checkins;
CREATE POLICY "delete_own_checkins" ON safety_checkins FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- indexes ----------
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_user ON trusted_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_journeys_user ON journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_journeys_status ON journeys(status);
CREATE INDEX IF NOT EXISTS idx_safety_events_user ON safety_events(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_events_journey ON safety_events(journey_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_checkins_journey ON safety_checkins(journey_id);
