DROP POLICY IF EXISTS "Anon can view assets" ON public.assets;
DROP POLICY IF EXISTS "Authenticated users can view assets" ON public.assets;
REVOKE SELECT ON public.assets FROM anon;