/*
# Create La Casa de GH content and administrator access

1. New Tables
- `posts`: public editorial content with title, excerpt, body, category, cover image, featured flag, publication date, and timestamps.
- `admin_users`: links Supabase accounts to the small group allowed to manage posts.

2. Security
- Row Level Security is enabled on both tables.
- Visitors can read published posts and authenticated administrators can manage all posts.
- The first authenticated account can claim the initial administrator seat; later accounts cannot self-promote.
- Administrator membership is private and only readable by the signed-in account.

3. Important Notes
- The public site never exposes unpublished posts to anonymous visitors.
- The first account created in the app should claim administrator access from the admin screen.
- Post images are stored as validated external image URLs so the editorial flow stays fast and simple.
*/

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Noticias',
  image_url text NOT NULL DEFAULT '',
  featured boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_published_at_idx ON public.posts (published_at DESC);
CREATE INDEX IF NOT EXISTS posts_category_idx ON public.posts (category);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_read_own_membership" ON public.admin_users;
CREATE POLICY "admins_read_own_membership" ON public.admin_users FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "first_user_claims_admin" ON public.admin_users;
CREATE POLICY "first_user_claims_admin" ON public.admin_users FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (SELECT 1 FROM public.admin_users)
  );

DROP POLICY IF EXISTS "admins_cannot_edit_membership" ON public.admin_users;
CREATE POLICY "admins_cannot_edit_membership" ON public.admin_users FOR UPDATE
  TO authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "admins_cannot_delete_membership" ON public.admin_users;
CREATE POLICY "admins_cannot_delete_membership" ON public.admin_users FOR DELETE
  TO authenticated USING (false);

DROP POLICY IF EXISTS "public_read_published_posts" ON public.posts;
CREATE POLICY "public_read_published_posts" ON public.posts FOR SELECT
  TO anon, authenticated USING (
    published_at <= now()
    OR EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admins_create_posts" ON public.posts;
CREATE POLICY "admins_create_posts" ON public.posts FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admins_update_posts" ON public.posts;
CREATE POLICY "admins_update_posts" ON public.posts FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admins_delete_posts" ON public.posts;
CREATE POLICY "admins_delete_posts" ON public.posts FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );