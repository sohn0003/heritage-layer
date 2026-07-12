CREATE POLICY "Authenticated users can view assets"
ON public.assets FOR SELECT
TO authenticated
USING (true);