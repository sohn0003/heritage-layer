CREATE TABLE public.system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.system_config IS '알고리즘 기본값/시스템 설정';
COMMENT ON COLUMN public.system_config.key IS '설정 이름';
COMMENT ON COLUMN public.system_config.value IS '설정 값';

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system config"
ON public.system_config FOR SELECT
USING (true);

CREATE POLICY "Admins can manage system config"
ON public.system_config FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.system_config (key, value) VALUES
  ('default_equity_ratio', '30'),
  ('default_project_years', '10'),
  ('residual_value_ratio', '40');