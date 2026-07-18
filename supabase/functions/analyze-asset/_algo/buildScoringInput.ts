// 서버 전용 — 자산 페이로드 → AssetInput 매퍼
// src/lib/assetScoring.ts 의 buildScoringInput() 을 supabase 의존성 없이 재구현.
import type {
  AssetInput,
  ZoningType,
  PopulationTrend,
  CommercialDensity,
  ZoningUpgradeGain,
  UseChangeExpansion,
  HistoricalValue,
  NaturalScenery,
  BuildingCondition,
} from './scoring/scoring.ts';

const mapZoning = (v: unknown): ZoningType => {
  const s = String(v ?? '');
  if (s.includes('중심상업')) return 'commercial_central';
  if (s.includes('근린상업')) return 'commercial_neighborhood';
  if (s.includes('일반상업') || s.includes('상업')) return 'commercial_general';
  if (s.includes('준주거')) return 'semi_residential';
  if (s.includes('2종') || s.includes('이종')) return 'residential_2nd';
  if (s.includes('3종') || s.includes('삼종')) return 'residential_3rd';
  if (s.includes('1종') || s.includes('일종')) return 'residential_1st';
  if (s.includes('계획관리')) return 'management_planning';
  if (s.includes('준공업')) return 'semi_industrial';
  if (s.includes('자연녹지')) return 'green_natural';
  if (s.includes('생산녹지')) return 'green_production';
  if (s.includes('보전녹지')) return 'green_conservation';
  if (s.includes('농림')) return 'agricultural';
  if (s.includes('자연환경보전')) return 'nature_conservation';
  return 'residential_2nd';
};
const mapPopulation = (v: unknown): PopulationTrend => {
  const s = String(v ?? '');
  if (s === 'increasing' || s === 'stable' || s === 'decreasing' || s === 'extinction_risk') return s;
  if (s.includes('증가')) return 'increasing';
  if (s.includes('유지')) return 'stable';
  if (s.includes('감소')) return 'decreasing';
  if (s.includes('소멸')) return 'extinction_risk';
  return 'stable';
};
const mapDensity = (v: unknown): CommercialDensity => {
  const s = String(v ?? '');
  if (s === 'high' || s === 'low') return s;
  if (s.includes('높') || s === '상') return 'high';
  return 'low';
};
const mapHistorical = (v: unknown): HistoricalValue => {
  const s = String(v ?? '');
  if (s === '상') return 'registered_heritage';
  if (s === '중') return 'architectural_art';
  if (s === '하') return 'ordinary';
  if (['registered_heritage', 'regional_landmark', 'architectural_art', 'ordinary', 'deteriorated'].includes(s)) return s as HistoricalValue;
  return 'ordinary';
};
const mapScenery = (v: unknown): NaturalScenery => {
  const s = String(v ?? '');
  if (s === '상') return 'waterfront_view';
  if (s === '중') return 'good_nature';
  if (s === '하') return 'ordinary_urban';
  if (['waterfront_view', 'good_nature', 'ordinary_urban', 'negative'].includes(s)) return s as NaturalScenery;
  return 'ordinary_urban';
};
const mapCondition = (v: unknown): BuildingCondition => {
  const s = String(v ?? '');
  if (s === '양호') return 'remodel_possible';
  if (s === '보통') return 'partial_reinforcement';
  if (s === '노후') return 'major_repair';
  if (s === '심각') return 'demolish_rebuild';
  if (['remodel_possible', 'partial_reinforcement', 'major_repair', 'demolish_rebuild'].includes(s)) return s as BuildingCondition;
  return 'partial_reinforcement';
};
const mapUpgradeGain = (v: unknown): ZoningUpgradeGain => {
  const s = String(v ?? '');
  if (s === '높음') return 'over_50';
  if (s === '중간') return 'between_20_50';
  if (s === '낮음') return 'under_20';
  if (s === '없음') return 'impossible';
  if (['over_50', 'between_20_50', 'under_20', 'impossible'].includes(s)) return s as ZoningUpgradeGain;
  return 'impossible';
};
const mapUseChange = (v: unknown): UseChangeExpansion => {
  const s = String(v ?? '');
  if (s === '높음') return 'major';
  if (s === '중간' || s === '낮음') return 'minor';
  if (s === '없음') return 'none';
  if (['major', 'minor', 'none'].includes(s)) return s as UseChangeExpansion;
  return 'none';
};
const n = (v: unknown, fallback = 0): number => {
  if (v === null || v === undefined || v === '') return fallback;
  const x = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(x) ? x : fallback;
};
const b = (v: unknown): boolean => v === true || v === 'true' || v === 1;

export const buildScoringInput = (a: Record<string, unknown>): AssetInput => {
  const ownership = String(a.ownership_type ?? '');
  const isPublic = ownership === 'public' || ownership === 'Public' || ownership === '국유' || ownership === '공유';
  const cbc = n(a.current_building_coverage, n(a.building_coverage, 0));
  const lbc = n(a.legal_max_building_coverage, n(a.building_coverage, 60) || 60) || 60;
  const cfar = n(a.current_floor_area_ratio, n(a.floor_area_ratio, 0));
  const lfar = n(a.legal_max_floor_area_ratio, n(a.floor_area_ratio, 200) || 200) || 200;
  return {
    zoning: mapZoning(a.zoning),
    currentBuildingCoverage: cbc,
    legalMaxBuildingCoverage: lbc,
    currentFloorAreaRatio: cfar,
    legalMaxFloorAreaRatio: lfar,
    currentFloorArea: n(a.current_floor_area, 0),
    landArea: n(a.land_area, 0) || 1,
    isPublicAsset: isPublic,
    isPrivateNegotiationPossible: b(a.is_private_negotiation),
    isCitizenProposalPossible: b(a.is_citizen_proposal),
    hasNearbyConversionPrecedent: b(a.has_conversion_precedent),
    isMilitaryOrHeritagZone: b(a.is_military_heritage_zone),
    isUrbanFacilityConflict: b(a.is_urban_facility_conflict),
    isWaterFrontEnvironmental: b(a.is_waterfront_environmental),
    isPrivateLand: ownership === 'private' || ownership === 'Private' || ownership === '사유',
    zoningUpgradeFloorAreaGain: mapUpgradeGain(a.zoning_upgrade_gain),
    useChangeExpansion: mapUseChange(a.use_change_expansion),
    populationTrend: mapPopulation(a.population_trend),
    commercialDensity: mapDensity(a.commercial_density),
    distanceToCenter: n(a.distance_to_center, 5),
    idleYears: n(a.idle_years, 0),
    historicalValue: mapHistorical(a.historical_value),
    naturalScenery: mapScenery(a.natural_scenery),
    buildingCondition: mapCondition(a.building_condition),
    preliminaryROI: 7,
    isUrbanRegenerationArea: b(a.is_urban_regeneration_area),
    isAbandonedSchoolBudget: b(a.is_abandoned_school_budget),
    isBalancedDevelopmentBudget: b(a.is_balanced_dev_budget),
  };
};
