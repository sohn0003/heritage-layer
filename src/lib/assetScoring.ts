// 폼/DB asset payload → calculateScore() 입력 매퍼 + 자동 채움 헬퍼
import {
  calculateScore,
  type AssetInput,
  type ZoningType,
  type PopulationTrend,
  type CommercialDensity,
  type ZoningUpgradeGain,
  type UseChangeExpansion,
  type HistoricalValue,
  type NaturalScenery,
  type BuildingCondition,
} from '@/algorithm/scoring/scoring';

const mapZoning = (v: any): ZoningType => {
  const s = String(v ?? '');
  if (s.includes('중심상업')) return 'commercial_central';
  if (s.includes('근린상업')) return 'commercial_neighborhood';
  if (s.includes('일반상업') || s.includes('상업')) return 'commercial_general';
  if (s.includes('준주거')) return 'semi_residential';
  if (s.includes('2종') || s.includes('이종')) return 'residential_2nd';
  if (s.includes('3종') || s.includes('삼종')) return 'residential_3rd';
  if (s.includes('1종') || s.includes('일종')) return 'residential_1st';
  if (s.includes('준공업')) return 'semi_industrial';
  if (s.includes('자연녹지')) return 'green_natural';
  if (s.includes('생산녹지')) return 'green_production';
  if (s.includes('보전녹지')) return 'green_conservation';
  if (s.includes('농림')) return 'agricultural';
  if (s.includes('자연환경보전')) return 'nature_conservation';
  return 'residential_2nd';
};

const mapPopulation = (v: any): PopulationTrend => {
  const s = String(v ?? '');
  if (s === 'increasing' || s === 'stable' || s === 'decreasing' || s === 'extinction_risk') return s;
  if (s.includes('증가')) return 'increasing';
  if (s.includes('유지')) return 'stable';
  if (s.includes('감소')) return 'decreasing';
  if (s.includes('소멸')) return 'extinction_risk';
  return 'stable';
};

const mapDensity = (v: any): CommercialDensity => {
  const s = String(v ?? '');
  if (s === 'high' || s === 'low') return s;
  if (s.includes('높') || s === '상') return 'high';
  return 'low';
};

const mapHistorical = (v: any): HistoricalValue => {
  const s = String(v ?? '');
  if (s === '상') return 'registered_heritage';
  if (s === '중') return 'architectural_art';
  if (s === '하') return 'ordinary';
  // 직접 enum 입력 호환
  if (['registered_heritage', 'regional_landmark', 'architectural_art', 'ordinary', 'deteriorated'].includes(s))
    return s as HistoricalValue;
  return 'ordinary';
};

const mapScenery = (v: any): NaturalScenery => {
  const s = String(v ?? '');
  if (s === '상') return 'waterfront_view';
  if (s === '중') return 'good_nature';
  if (s === '하') return 'ordinary_urban';
  if (['waterfront_view', 'good_nature', 'ordinary_urban', 'negative'].includes(s))
    return s as NaturalScenery;
  return 'ordinary_urban';
};

const mapCondition = (v: any): BuildingCondition => {
  const s = String(v ?? '');
  if (s === '양호') return 'remodel_possible';
  if (s === '보통') return 'partial_reinforcement';
  if (s === '노후') return 'major_repair';
  if (s === '심각') return 'demolish_rebuild';
  if (['remodel_possible', 'partial_reinforcement', 'major_repair', 'demolish_rebuild'].includes(s))
    return s as BuildingCondition;
  return 'partial_reinforcement';
};

const mapUpgradeGain = (v: any): ZoningUpgradeGain => {
  const s = String(v ?? '');
  if (s === '높음') return 'over_50';
  if (s === '중간') return 'between_20_50';
  if (s === '낮음') return 'under_20';
  if (s === '없음') return 'impossible';
  if (['over_50', 'between_20_50', 'under_20', 'impossible'].includes(s)) return s as ZoningUpgradeGain;
  return 'impossible';
};

const mapUseChange = (v: any): UseChangeExpansion => {
  const s = String(v ?? '');
  if (s === '높음') return 'major';
  if (s === '중간' || s === '낮음') return 'minor';
  if (s === '없음') return 'none';
  if (['major', 'minor', 'none'].includes(s)) return s as UseChangeExpansion;
  return 'none';
};

const n = (v: any, fallback = 0): number => {
  if (v === null || v === undefined || v === '') return fallback;
  const x = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(x) ? x : fallback;
};

const b = (v: any): boolean => v === true || v === 'true' || v === 1;

export interface AssetLikePayload {
  zoning?: any;
  current_building_coverage?: any;
  legal_max_building_coverage?: any;
  current_floor_area_ratio?: any;
  legal_max_floor_area_ratio?: any;
  current_floor_area?: any;
  building_coverage?: any;
  floor_area_ratio?: any;
  land_area?: any;
  ownership_type?: any;
  is_private_negotiation?: any;
  is_citizen_proposal?: any;
  has_conversion_precedent?: any;
  is_military_heritage_zone?: any;
  is_urban_facility_conflict?: any;
  is_waterfront_environmental?: any;
  zoning_upgrade_gain?: any;
  use_change_expansion?: any;
  population_trend?: any;
  commercial_density?: any;
  distance_to_center?: any;
  idle_years?: any;
  historical_value?: any;
  natural_scenery?: any;
  building_condition?: any;
  is_urban_regeneration_area?: any;
  is_abandoned_school_budget?: any;
  is_balanced_dev_budget?: any;
  irr_result?: any;
  [k: string]: any;
}

const extractROI = (irr: any): number => {
  if (!irr || typeof irr !== 'object') return 7;
  // 다양한 형태에서 ROI/IRR 시도 추출
  const candidates = [irr.roi, irr.estimated_roi, irr.estimatedROI, irr.irr, irr?.base?.irr];
  for (const c of candidates) {
    const num = typeof c === 'number' ? c : Number(c);
    if (Number.isFinite(num)) return num > 1 ? num : num * 100; // 0.1 → 10%
  }
  return 7;
};

export const buildScoringInput = (a: AssetLikePayload): AssetInput => {
  const ownership = String(a.ownership_type ?? '');
  const isPublic = ownership === '국유' || ownership === '공유';
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
    isPrivateLand: ownership === '사유',
    zoningUpgradeFloorAreaGain: mapUpgradeGain(a.zoning_upgrade_gain),
    useChangeExpansion: mapUseChange(a.use_change_expansion),
    populationTrend: mapPopulation(a.population_trend),
    commercialDensity: mapDensity(a.commercial_density),
    distanceToCenter: n(a.distance_to_center, 5),
    idleYears: n(a.idle_years, 0),
    historicalValue: mapHistorical(a.historical_value),
    naturalScenery: mapScenery(a.natural_scenery),
    buildingCondition: mapCondition(a.building_condition),
    preliminaryROI: extractROI(a.irr_result),
    isUrbanRegenerationArea: b(a.is_urban_regeneration_area),
    isAbandonedSchoolBudget: b(a.is_abandoned_school_budget),
    isBalancedDevelopmentBudget: b(a.is_balanced_dev_budget),
  };
};

export interface ScoringFields {
  scoring_grade: string;
  scoring_total: number;
  scoring_detail: any;
  grade: string;
  irr_result: any;
  recommended_use_type: string | null;
  recommended_dev_direction: string | null;
}

export interface AlgoConfigLite {
  loanRates: { pf: number; collateral: number };
  projectYears: number;
  residualValueRatio: number;
}

const DEFAULT_ALGO_CONFIG: AlgoConfigLite = {
  loanRates: { pf: 5.5, collateral: 4.8 },
  projectYears: 10,
  residualValueRatio: 0.4,
};

const DEFAULT_LAND_VALUE = 4_500_000;

// 단일 진입점 — Admin 저장, Excel 업로드, Analysis 페이지가 모두 이 함수로
// 동일한 입력/파라미터로 채점하도록 하여 등급 불일치를 방지합니다.
import { analyzeAsset } from '@/algorithm/financial/irr-calculator';
import { supabase } from '@/integrations/supabase/client';

export const computeAssetAnalysis = (
  a: AssetLikePayload,
  config: AlgoConfigLite = DEFAULT_ALGO_CONFIG,
) => {
  const { preliminaryROI, ...assetInputBase } = buildScoringInput(a);
  void preliminaryROI;
  return analyzeAsset({
    assetInput: assetInputBase,
    landValuePerSqm: n(a.land_value_per_sqm, DEFAULT_LAND_VALUE) || DEFAULT_LAND_VALUE,
    loanRates: config.loanRates,
    projectYears: config.projectYears,
    residualValueRatio: config.residualValueRatio,
  });
};

export const calculateScoringFields = (
  a: AssetLikePayload,
  config: AlgoConfigLite = DEFAULT_ALGO_CONFIG,
): ScoringFields => {
  const result = computeAssetAnalysis(a, config);
  const top = result.recommendation.scenarios[0];
  return {
    scoring_grade: result.scoring.grade,
    scoring_total: result.scoring.totalScore,
    scoring_detail: result.scoring.detail,
    grade: result.scoring.grade,
    irr_result: {
      preliminaryROI: result.preliminaryROI,
      scenarios: result.recommendation.scenarios.map((s: any) => ({
        rank: s.rank,
        irr: s.irr,
        useTypeSummary: s.useTypeSummary,
        developmentDirectionLabel: s.developmentDirectionLabel,
      })),
    },
    recommended_use_type: top?.useTypeSummary ?? null,
    recommended_dev_direction: top?.developmentDirectionLabel ?? null,
  };
};

// React 외부(Excel import 등)에서 사용할 비동기 설정 로더
export const loadAlgorithmConfig = async (): Promise<AlgoConfigLite> => {
  const cfg: AlgoConfigLite = {
    loanRates: { ...DEFAULT_ALGO_CONFIG.loanRates },
    projectYears: DEFAULT_ALGO_CONFIG.projectYears,
    residualValueRatio: DEFAULT_ALGO_CONFIG.residualValueRatio,
  };
  try {
    const [ratesRes, sysRes] = await Promise.all([
      supabase.from('loan_rates').select('rate_type, rate_value, effective_date').order('effective_date', { ascending: false }),
      supabase.from('system_config').select('key, value'),
    ]);
    const seen = new Set<string>();
    (ratesRes.data ?? []).forEach((r: any) => {
      if (seen.has(r.rate_type)) return;
      seen.add(r.rate_type);
      const v = Number(r.rate_value);
      if (!Number.isFinite(v)) return;
      if (r.rate_type === 'pf') cfg.loanRates.pf = v;
      if (r.rate_type === 'collateral') cfg.loanRates.collateral = v;
    });
    (sysRes.data ?? []).forEach((row: any) => {
      const v = Number(row.value);
      if (!Number.isFinite(v)) return;
      if (row.key === 'default_project_years') cfg.projectYears = v;
      if (row.key === 'residual_value_ratio') cfg.residualValueRatio = v;
    });
  } catch (e) {
    console.error('loadAlgorithmConfig 실패, 기본값 사용', e);
  }
  return cfg;
};
