/*
# Fix profiles RLS recursion + add admin check function

## Problem
The `select_admin_profiles` policy on `profiles` contains a subquery
that reads `profiles` itself. Under RLS this causes infinite recursion,
so any query against `profiles` by an authenticated user returns empty.
This is why the admin login fails with "No tienes permisos de administrador"
even though the admin row exists with role='admin' and status='aprobado'.

## Fix
1. Create a SECURITY DEFINER function `is_admin()` that reads the
   caller's profile with the service role (bypassing RLS) and returns
   true if role='admin' AND status='aprobado'. This breaks the recursion.
2. Replace the self-referential `select_admin_profiles` policy with one
   that calls `is_admin()` instead of subquerying `profiles`.
3. Keep the existing `select_own_profile` and `update_own_profile` policies.

## Security
- `is_admin()` is SECURITY DEFINER, owned by postgres, with search_path
  set to `public`. It only exposes a boolean — no data leaks.
- EXECUTE is granted to `authenticated` so the policy can call it.
- The new SELECT policy allows: own row OR is_admin().
*/

-- 1. Create the admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'aprobado'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2. Drop the recursive policy and replace with one that uses is_admin()
DROP POLICY IF EXISTS "select_admin_profiles" ON public.profiles;
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;

CREATE POLICY "select_own_or_admin_profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

-- 3. Keep the update policy as-is (already correct)
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
