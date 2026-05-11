ALTER TABLE public.assets DROP COLUMN IF EXISTS asset_use_type;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS recommended_use_type text;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS recommended_dev_direction text;