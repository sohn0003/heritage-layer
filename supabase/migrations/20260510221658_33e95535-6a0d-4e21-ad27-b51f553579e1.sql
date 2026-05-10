CREATE TABLE public.loan_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_type text NOT NULL CHECK (rate_type IN ('pf', 'collateral')),
  rate_value numeric NOT NULL,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.loan_rates IS '대출 이자율 (PF/담보) 시장금리 관리';
COMMENT ON COLUMN public.loan_rates.rate_type IS '대출 종류: pf(PF대출) / collateral(담보대출)';
COMMENT ON COLUMN public.loan_rates.rate_value IS '이자율(%)';
COMMENT ON COLUMN public.loan_rates.effective_date IS '적용 시작일';

ALTER TABLE public.loan_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view loan rates"
ON public.loan_rates FOR SELECT
USING (true);

CREATE POLICY "Admins can manage loan rates"
ON public.loan_rates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.loan_rates (rate_type, rate_value) VALUES
  ('pf', 5.5),
  ('collateral', 4.8);