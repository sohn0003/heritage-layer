
CREATE TABLE public.asset_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL,
  amount integer NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('toss','paddle')),
  payment_id text NOT NULL,
  status text NOT NULL DEFAULT 'paid',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, asset_id)
);

CREATE INDEX idx_asset_unlocks_user ON public.asset_unlocks(user_id);
CREATE INDEX idx_asset_unlocks_asset ON public.asset_unlocks(asset_id);

GRANT SELECT ON public.asset_unlocks TO authenticated;
GRANT ALL ON public.asset_unlocks TO service_role;

ALTER TABLE public.asset_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own unlocks"
  ON public.asset_unlocks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages unlocks"
  ON public.asset_unlocks FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.is_asset_unlocked(_user_id uuid, _asset_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.asset_unlocks
    WHERE user_id = _user_id AND asset_id = _asset_id AND status = 'paid'
  );
$$;
