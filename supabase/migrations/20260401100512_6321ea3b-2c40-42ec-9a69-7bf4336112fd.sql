
DROP POLICY "Anyone can submit inquiry" ON public.partner_inquiries;
CREATE POLICY "Anyone can submit inquiry with valid data" ON public.partner_inquiries
  FOR INSERT WITH CHECK (
    length(name) > 0 AND length(name) <= 100
    AND length(organization) > 0 AND length(organization) <= 200
    AND length(contact) > 0 AND length(contact) <= 100
    AND length(message) > 0 AND length(message) <= 2000
  );
