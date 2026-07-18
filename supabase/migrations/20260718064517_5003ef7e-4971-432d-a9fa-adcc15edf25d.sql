CREATE TABLE public.analysis_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  overrides_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_analysis_audit_user_time ON public.analysis_audit_log (user_id, created_at DESC);
GRANT ALL ON public.analysis_audit_log TO service_role;
GRANT SELECT ON public.analysis_audit_log TO authenticated;
ALTER TABLE public.analysis_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all audit logs"
  ON public.analysis_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));