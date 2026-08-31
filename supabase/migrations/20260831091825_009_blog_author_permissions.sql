/*
# Add author_id to blog_posts + fix editor/collaborator permissions

## Purpose
Distinguish two staff roles with different blog permissions:
- **admin** (gestor principal): can create, edit, delete ALL articles
- **editor** (colaborador): can create articles, but only edit/delete
  their OWN articles

## Changes
1. Add `author_id` column to `blog_posts` (nullable, references profiles).
   Existing posts get author_id = NULL (treated as admin-owned).
2. Add a SECURITY DEFINER function `is_blog_author(p_post_id)` that checks
   if the current user is the author of a given blog post.
3. Update blog RLS policies:
   - SELECT: staff can see all posts (for management), public sees published
   - INSERT: staff can insert (author_id auto-set to auth.uid())
   - UPDATE: admin can update all; editor can only update their own
   - DELETE: admin can delete all; editor can only delete their own
4. Add a trigger to auto-set author_id on insert.

## Security
- `is_blog_author` is SECURITY DEFINER, returns boolean only.
- Editor UPDATE/DELETE policies use `is_blog_author()` which checks
  `author_id = auth.uid()` — editors cannot touch other people's posts.
- Admin bypasses the author check via `is_admin()` which checks
  role = 'admin' specifically (not 'editor').
*/

-- 1. Add author_id column
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Auto-set author_id on insert
CREATE OR REPLACE FUNCTION public.set_blog_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.author_id IS NULL THEN
    NEW.author_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_blog_author ON public.blog_posts;
CREATE TRIGGER trg_set_blog_author
BEFORE INSERT ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.set_blog_author();

-- 3. Function to check if current user is the author of a blog post
CREATE OR REPLACE FUNCTION public.is_blog_author(p_post_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blog_posts
    WHERE id = p_post_id AND author_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_blog_author(uuid) TO authenticated;

-- 4. Update RLS policies
-- SELECT: staff see all, public sees published
DROP POLICY IF EXISTS "staff_read_all_blog" ON public.blog_posts;
CREATE POLICY "staff_read_all_blog"
ON public.blog_posts FOR SELECT
TO authenticated
USING (public.is_editor());

-- INSERT: staff can insert (author_id auto-set by trigger)
DROP POLICY IF EXISTS "staff_insert_blog" ON public.blog_posts;
CREATE POLICY "staff_insert_blog"
ON public.blog_posts FOR INSERT
TO authenticated
WITH CHECK (public.is_editor());

-- UPDATE: admin can update all; editor only their own
DROP POLICY IF EXISTS "staff_update_blog" ON public.blog_posts;
CREATE POLICY "staff_update_blog"
ON public.blog_posts FOR UPDATE
TO authenticated
USING (public.is_admin() OR public.is_blog_author(id))
WITH CHECK (public.is_admin() OR public.is_blog_author(id));

-- DELETE: admin can delete all; editor only their own
DROP POLICY IF EXISTS "staff_delete_blog" ON public.blog_posts;
CREATE POLICY "staff_delete_blog"
ON public.blog_posts FOR DELETE
TO authenticated
USING (public.is_admin() OR public.is_blog_author(id));
