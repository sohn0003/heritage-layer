CREATE POLICY "Anon can view assets" ON public.assets FOR SELECT TO anon USING (true);
GRANT SELECT ON public.assets TO anon;
GRANT SELECT ON public.assets_public TO anon;