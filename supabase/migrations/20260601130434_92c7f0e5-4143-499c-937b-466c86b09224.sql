ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'paddle',
  ADD COLUMN IF NOT EXISTS toss_billing_key TEXT,
  ADD COLUMN IF NOT EXISTS toss_customer_key TEXT;

ALTER TABLE public.subscriptions
  ALTER COLUMN paddle_subscription_id DROP NOT NULL,
  ALTER COLUMN paddle_customer_id DROP NOT NULL;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_provider_check
  CHECK (provider IN ('paddle', 'toss'));

CREATE INDEX IF NOT EXISTS subscriptions_toss_billing_key_idx
  ON public.subscriptions(toss_billing_key)
  WHERE toss_billing_key IS NOT NULL;