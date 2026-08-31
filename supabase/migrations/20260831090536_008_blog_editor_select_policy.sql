/*
# Add SELECT policy for editors to see all blog posts

## Problem
The blog_posts table only had a SELECT policy for published posts
(`is_published = true`). Editors logging into the admin panel could
not see draft articles because the RLS filtered them out.

## Fix
Add a SELECT policy `staff_read_all_blog` that allows editors (and
admins) to read ALL blog posts including drafts, using the existing
`is_editor()` SECURITY DEFINER function.

## Security
- Only authenticated users with role 'admin' or 'editor' and status
  'aprobado' can see drafts (is_editor() checks all three conditions).
- The existing `read_published_blog` policy remains for public access.
*/

DROP POLICY IF EXISTS "staff_read_all_blog" ON public.blog_posts;
CREATE POLICY "staff_read_all_blog"
ON public.blog_posts FOR SELECT
TO authenticated
USING (public.is_editor());
