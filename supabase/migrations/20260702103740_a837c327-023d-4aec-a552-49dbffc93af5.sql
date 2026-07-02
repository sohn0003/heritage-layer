ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS asking_land_price bigint,
  ADD COLUMN IF NOT EXISTS asking_building_price bigint;