
ALTER TABLE public.deal_signals
  ADD COLUMN IF NOT EXISTS admin_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_response text,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS responded_by uuid;

CREATE POLICY "Admins can update deal signals"
ON public.deal_signals
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
