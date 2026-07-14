CREATE OR REPLACE VIEW public.assets_public AS
SELECT id, address, asset_type, zoning, building_coverage, floor_area_ratio,
  land_area, idle_years, ownership_type, grade, gov_cooperation, latitude, longitude,
  is_published, created_at, current_building_coverage, legal_max_building_coverage,
  current_floor_area_ratio, legal_max_floor_area_ratio, current_floor_area,
  land_value_per_sqm, population_trend, commercial_density, distance_to_center,
  historical_value, building_condition, natural_scenery, is_private_negotiation,
  is_citizen_proposal, is_waterfront_environmental, is_military_heritage_zone,
  is_urban_facility_conflict, zoning_upgrade_gain, use_change_expansion,
  has_conversion_precedent, is_urban_regeneration_area, is_abandoned_school_budget,
  is_balanced_dev_budget, recommended_use_type, recommended_dev_direction,
  utilization_status, asking_land_price, asking_building_price
FROM public.assets
WHERE is_published = true;

GRANT SELECT ON public.assets_public TO anon, authenticated;