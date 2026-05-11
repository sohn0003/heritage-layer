// ============================================================
// Heritage Layer — Development Scenario Recommendation Engine
// 파일 위치: src/algorithm/recommend/recommend-scenarios.ts
//
// 자산의 가치, 입지, 시장 현황, 용도지역, 종상향 가능성 등을
// 종합 분석해 1/2/3순위 개발 시나리오를 자동 추천합니다.
//
// 각 시나리오는 전환 용도, 개발 방향, 투자비, 매출,
// 적정 자기자본 비율, 대출 방식을 포함합니다.
// ============================================================

import type {
  ScoreResult,
  AssetInput,
  Grade,
  ZoningType,
  ZoningUpgradeGain,
  BuildingCondition,
  PopulationTrend,
  CommercialDensity,
  HistoricalValue,
  NaturalScenery,
} from '../scoring/scoring';

import type {
  AssetUseType,
  UseTypeMix,
  LoanRates,
  IRRResult,
} from '../financial/irr-calculator';

import { calculateIRRScenarios } from '../financial/irr-calculator';

// ────────────────────────────────────────────────────────────
// 개발 방향 타입
// ────────────────────────────────────────────────────────────

export type DevelopmentDirection =
  | 'remodel'              // 리모델링
  | 'major_repair'         // 대수선
  | 'remodel_extension'    // 리모델링 + 증축
  | 'demolish_rebuild'     // 멸실 후 신축
  | 'extension';           // 증축 (구조 유지 + 연면적 확대)

export type LoanStructure =
  | 'pf'                   // PF 대출
  | 'collateral'           // 담보 대출
  | 'pf_collateral_mix';   // PF + 담보 혼합

// ────────────────────────────────────────────────────────────
// 추천 시나리오 출력 타입
// ────────────────────────────────────────────────────────────

export interface DevelopmentScenario {
  rank: 1 | 2 | 3;
  label: string;                      // "1순위 시나리오"
  concept: string;                    // "수변 프리미엄 숙박 복합"

  // 전환 용도 (1~3개)
  useTypeMix: [UseTypeMix, ...UseTypeMix[]];
  useTypeSummary: string;             // "숙박시설 60% + 웰니스 40%"

  // 개발 방향
  developmentDirection: DevelopmentDirection;
  developmentDirectionLabel: string;

  // 추천 이유 (3~5개)
  reasons: string[];

  // 주요 리스크 (1~2개)
  risks: string[];

  // 적합도 점수 (0~100)
  suitabilityScore: number;

  // 금융 구조 추천
  recommendedEquityRatio: number;     // 적정 자기자본 비율 (%)
  loanStructure: LoanStructure;
  loanStructureLabel: string;
  loanReason: string;

  // IRR 계산 결과 (3시나리오)
  irrResult: IRRResult;
}

export interface RecommendationResult {
  scenarios: [DevelopmentScenario, DevelopmentScenario, DevelopmentScenario];
  assetSummary: {
    grade: Grade;
    totalScore: number;
    keyStrengths: string[];
    keyRisks: string[];
    optimalEquityRatio: number;       // 1순위 기준 적정 자기자본 비율
  };
}

// ────────────────────────────────────────────────────────────
// 용도별 한글 라벨
// ────────────────────────────────────────────────────────────

const USE_TYPE_LABEL: Record<AssetUseType, string> = {
  accommodation:         '숙박시설',
  cultural_complex:      '복합문화시설',
  education:             '교육·연구시설',
  senior_welfare:        '시니어·복지시설',
  retail_fnb:            '상가·F&B',
  shared_residence:      '임대주택·공유주거',
  logistics:             '물류·창고',
  knowledge_industry:    '지식산업센터',
  wellness:              '웰니스',
  public_complex:        '공공복합시설',
  residential:           '일반 주거시설',
  mixed_use_residential: '주상복합',
  office:                '오피스',
  retail_shopping:       '판매시설',
  medical:               '의료시설',
  religious_cultural:    '종교·문화시설',
};

const DEV_DIR_LABEL: Record<DevelopmentDirection, string> = {
  remodel:           '리모델링',
  major_repair:      '대수선',
  remodel_extension: '리모델링 + 증축',
  demolish_rebuild:  '멸실 후 신축',
  extension:         '증축',
};

const LOAN_LABEL: Record<LoanStructure, string> = {
  pf:                   'PF 대출',
  collateral:           '담보 대출',
  pf_collateral_mix:    'PF + 담보 혼합',
};

// ────────────────────────────────────────────────────────────
// 용도지역별 용도 호환성 기본 점수 (0~40)
// ────────────────────────────────────────────────────────────

type ZoningCompatibility = Record<AssetUseType, number>;

const ZONING_BASE_SCORE: Record<ZoningType, ZoningCompatibility> = {
  commercial_general: {
    accommodation: 38, cultural_complex: 40, education: 35,
    senior_welfare: 30, retail_fnb: 40, shared_residence: 25,
    logistics: 10, knowledge_industry: 38, wellness: 35,
    public_complex: 40, residential: 20, mixed_use_residential: 35,
    office: 40, retail_shopping: 40, medical: 35, religious_cultural: 30,
  },
  commercial_neighborhood: {
    accommodation: 35, cultural_complex: 38, education: 33,
    senior_welfare: 30, retail_fnb: 40, shared_residence: 25,
    logistics: 10, knowledge_industry: 33, wellness: 33,
    public_complex: 38, residential: 22, mixed_use_residential: 35,
    office: 38, retail_shopping: 38, medical: 33, religious_cultural: 30,
  },
  commercial_central: {
    accommodation: 40, cultural_complex: 38, education: 33,
    senior_welfare: 25, retail_fnb: 38, shared_residence: 20,
    logistics: 8, knowledge_industry: 40, wellness: 33,
    public_complex: 38, residential: 18, mixed_use_residential: 38,
    office: 40, retail_shopping: 40, medical: 33, religious_cultural: 28,
  },
  semi_residential: {
    accommodation: 35, cultural_complex: 35, education: 33,
    senior_welfare: 35, retail_fnb: 33, shared_residence: 35,
    logistics: 10, knowledge_industry: 30, wellness: 38,
    public_complex: 35, residential: 38, mixed_use_residential: 40,
    office: 33, retail_shopping: 30, medical: 38, religious_cultural: 33,
  },
  residential_2nd: {
    accommodation: 20, cultural_complex: 25, education: 35,
    senior_welfare: 38, retail_fnb: 20, shared_residence: 40,
    logistics: 5, knowledge_industry: 15, wellness: 28,
    public_complex: 30, residential: 40, mixed_use_residential: 25,
    office: 15, retail_shopping: 15, medical: 30, religious_cultural: 30,
  },
  residential_3rd: {
    accommodation: 18, cultural_complex: 25, education: 35,
    senior_welfare: 38, retail_fnb: 18, shared_residence: 38,
    logistics: 5, knowledge_industry: 18, wellness: 25,
    public_complex: 30, residential: 40, mixed_use_residential: 28,
    office: 18, retail_shopping: 15, medical: 30, religious_cultural: 30,
  },
  green_natural: {
    accommodation: 38, cultural_complex: 30, education: 25,
    senior_welfare: 28, retail_fnb: 15, shared_residence: 15,
    logistics: 8, knowledge_industry: 8, wellness: 40,
    public_complex: 25, residential: 10, mixed_use_residential: 8,
    office: 8, retail_shopping: 10, medical: 15, religious_cultural: 33,
  },
  green_production: {
    accommodation: 25, cultural_complex: 20, education: 20,
    senior_welfare: 22, retail_fnb: 10, shared_residence: 10,
    logistics: 25, knowledge_industry: 10, wellness: 25,
    public_complex: 20, residential: 8, mixed_use_residential: 8,
    office: 8, retail_shopping: 8, medical: 10, religious_cultural: 25,
  },
  residential_1st: {
    accommodation: 10, cultural_complex: 18, education: 30,
    senior_welfare: 35, retail_fnb: 10, shared_residence: 38,
    logistics: 3, knowledge_industry: 8, wellness: 18,
    public_complex: 28, residential: 40, mixed_use_residential: 15,
    office: 8, retail_shopping: 8, medical: 25, religious_cultural: 30,
  },
  semi_industrial: {
    accommodation: 10, cultural_complex: 18, education: 18,
    senior_welfare: 10, retail_fnb: 15, shared_residence: 10,
    logistics: 40, knowledge_industry: 38, wellness: 12,
    public_complex: 18, residential: 8, mixed_use_residential: 10,
    office: 25, retail_shopping: 20, medical: 10, religious_cultural: 12,
  },
  green_conservation: {
    accommodation: 15, cultural_complex: 15, education: 10,
    senior_welfare: 10, retail_fnb: 5, shared_residence: 5,
    logistics: 3, knowledge_industry: 3, wellness: 20,
    public_complex: 15, residential: 5, mixed_use_residential: 3,
    office: 3, retail_shopping: 3, medical: 5, religious_cultural: 18,
  },
  agricultural: {
    accommodation: 20, cultural_complex: 12, education: 10,
    senior_welfare: 12, retail_fnb: 8, shared_residence: 8,
    logistics: 15, knowledge_industry: 5, wellness: 18,
    public_complex: 12, residential: 5, mixed_use_residential: 5,
    office: 3, retail_shopping: 5, medical: 5, religious_cultural: 18,
  },
  nature_conservation: {
    accommodation: 10, cultural_complex: 10, education: 5,
    senior_welfare: 5, retail_fnb: 3, shared_residence: 3,
    logistics: 2, knowledge_industry: 2, wellness: 15,
    public_complex: 10, residential: 2, mixed_use_residential: 2,
    office: 2, retail_shopping: 2, medical: 3, religious_cultural: 15,
  },
};

// ────────────────────────────────────────────────────────────
// 보조 점수 계산 함수들 (각 최대 10점)
// ────────────────────────────────────────────────────────────

// 인구·상권 조건이 해당 용도에 유리한가
function scorePopCommercial(
  useType: AssetUseType,
  pop: PopulationTrend,
  commercial: CommercialDensity
): number {
  const popIncreasing = pop === 'increasing' || pop === 'stable';
  const highDemandTypes: AssetUseType[] = [
    'retail_fnb', 'retail_shopping', 'office', 'mixed_use_residential', 'residential',
  ];
  const declineAdaptTypes: AssetUseType[] = [
    'senior_welfare', 'wellness', 'accommodation', 'public_complex', 'religious_cultural',
  ];
  const lowCommercialOpTypes: AssetUseType[] = [
    'retail_fnb', 'retail_shopping', 'accommodation', 'wellness',
  ];

  let score = 5;
  if (popIncreasing && highDemandTypes.includes(useType)) score += 4;
  if (!popIncreasing && declineAdaptTypes.includes(useType)) score += 3;
  if (commercial === 'low' && lowCommercialOpTypes.includes(useType)) score += 3;
  if (pop === 'extinction_risk' && useType === 'senior_welfare') score += 5;
  return Math.min(10, score);
}

// 자연경관·심미성이 해당 용도에 유리한가
function scoreScenery(useType: AssetUseType, scenery: NaturalScenery): number {
  const benefitMap: Record<NaturalScenery, AssetUseType[]> = {
    waterfront_view: ['accommodation', 'wellness', 'cultural_complex', 'retail_fnb'],
    good_nature: ['wellness', 'accommodation', 'education', 'religious_cultural'],
    ordinary_urban: ['office', 'retail_fnb', 'mixed_use_residential', 'retail_shopping'],
    negative: ['logistics', 'knowledge_industry'],
  };
  return benefitMap[scenery]?.includes(useType) ? 10 : 3;
}

// 역사·건축적 가치가 해당 용도에 유리한가
function scoreHistorical(useType: AssetUseType, historical: HistoricalValue): number {
  if (historical === 'ordinary' || historical === 'deteriorated') return 3;
  const heritageTypes: AssetUseType[] = [
    'cultural_complex', 'wellness', 'accommodation', 'religious_cultural', 'education',
  ];
  if (historical === 'registered_heritage' || historical === 'regional_landmark') {
    return heritageTypes.includes(useType) ? 10 : 4;
  }
  return heritageTypes.includes(useType) ? 7 : 3;
}

// 정부 지원 정책 정합성
function scoreGovernmentFit(
  useType: AssetUseType,
  isUrbanRegen: boolean,
  isSchoolBudget: boolean,
  isBalanced: boolean
): number {
  let score = 3;
  if (isSchoolBudget) {
    if (['education', 'cultural_complex', 'public_complex', 'senior_welfare'].includes(useType))
      score += 7;
  }
  if (isUrbanRegen) {
    if (['public_complex', 'senior_welfare', 'cultural_complex', 'shared_residence'].includes(useType))
      score += 5;
  }
  if (isBalanced) {
    if (['public_complex', 'education', 'medical', 'senior_welfare'].includes(useType))
      score += 4;
  }
  return Math.min(10, score);
}

// 대지면적 적합성
function scoreLandArea(useType: AssetUseType, landArea: number): number {
  const largeAreaTypes: AssetUseType[] = ['residential', 'logistics', 'mixed_use_residential', 'retail_shopping'];
  const smallAreaTypes: AssetUseType[] = ['retail_fnb', 'office', 'medical', 'religious_cultural'];
  if (landArea >= 3000 && largeAreaTypes.includes(useType)) return 10;
  if (landArea < 1000 && largeAreaTypes.includes(useType)) return 2;
  if (landArea < 500 && smallAreaTypes.includes(useType)) return 8;
  return 5;
}

// 종상향 여력 + 개발 가능성 정합성
function scoreZoningUpgrade(
  useType: AssetUseType,
  upgradeGain: ZoningUpgradeGain
): number {
  if (upgradeGain === 'impossible') return 5;
  const highValueOnUpgrade: AssetUseType[] = [
    'residential', 'mixed_use_residential', 'office', 'knowledge_industry',
  ];
  if (upgradeGain === 'over_50' && highValueOnUpgrade.includes(useType)) return 10;
  if (upgradeGain === 'between_20_50' && highValueOnUpgrade.includes(useType)) return 7;
  return 5;
}

// ────────────────────────────────────────────────────────────
// 전체 용도별 적합도 점수 계산 (0~100)
// ────────────────────────────────────────────────────────────

function scoreAllUseTypes(
  assetInput: Omit<AssetInput, 'preliminaryROI'>,
  scoringResult: ScoreResult
): Record<AssetUseType, number> {
  const allTypes: AssetUseType[] = [
    'accommodation', 'cultural_complex', 'education', 'senior_welfare',
    'retail_fnb', 'shared_residence', 'logistics', 'knowledge_industry',
    'wellness', 'public_complex', 'residential', 'mixed_use_residential',
    'office', 'retail_shopping', 'medical', 'religious_cultural',
  ];

  const scores: Record<string, number> = {};

  for (const useType of allTypes) {
    const zoningBase = ZONING_BASE_SCORE[assetInput.zoning]?.[useType] ?? 10;
    const popComm = scorePopCommercial(useType, assetInput.populationTrend, assetInput.commercialDensity);
    const scenery = scoreScenery(useType, assetInput.naturalScenery);
    const historical = scoreHistorical(useType, assetInput.historicalValue);
    const govFit = scoreGovernmentFit(
      useType,
      assetInput.isUrbanRegenerationArea,
      assetInput.isAbandonedSchoolBudget,
      assetInput.isBalancedDevelopmentBudget
    );
    const landFit = scoreLandArea(useType, assetInput.landArea);
    const upgradeFit = scoreZoningUpgrade(useType, assetInput.zoningUpgradeFloorAreaGain);

    // 합산: 기본(40) + 보조 6개(각 10) = 최대 100
    scores[useType] = Math.min(100, Math.round(
      zoningBase + popComm + scenery + historical + govFit + landFit + upgradeFit
    ));
  }

  return scores as Record<AssetUseType, number>;
}

// ────────────────────────────────────────────────────────────
// 개발 방향 추천
// ────────────────────────────────────────────────────────────

function recommendDevDirection(
  buildingCondition: BuildingCondition,
  zoningUpgradeGain: ZoningUpgradeGain,
  additionalFloorArea: number,
  scenarioRank: 1 | 2 | 3
): DevelopmentDirection {
  // 신축이 유일한 선택지
  if (buildingCondition === 'demolish_rebuild') return 'demolish_rebuild';

  // 1순위: 최대 수익 극대화
  if (scenarioRank === 1) {
    if (additionalFloorArea > 500 && zoningUpgradeGain !== 'impossible') {
      return buildingCondition === 'remodel_possible' ? 'remodel_extension' : 'demolish_rebuild';
    }
    if (buildingCondition === 'remodel_possible') return 'remodel';
    if (buildingCondition === 'partial_reinforcement') return 'remodel_extension';
    return 'major_repair';
  }

  // 2순위: 보수적 접근 (빠른 실행)
  if (scenarioRank === 2) {
    if (buildingCondition === 'remodel_possible') return 'remodel';
    if (buildingCondition === 'partial_reinforcement') return 'major_repair';
    return 'major_repair';
  }

  // 3순위: 대안적 접근
  if (buildingCondition === 'remodel_possible' && additionalFloorArea > 200) return 'extension';
  if (buildingCondition === 'major_repair') return 'demolish_rebuild';
  return 'remodel';
}

// 개발 방향 → building condition 매핑 (공사비 계산용)
function devDirToBuildingCondition(dir: DevelopmentDirection): BuildingCondition {
  switch (dir) {
    case 'remodel': return 'remodel_possible';
    case 'extension': return 'partial_reinforcement';
    case 'remodel_extension': return 'partial_reinforcement';
    case 'major_repair': return 'major_repair';
    case 'demolish_rebuild': return 'demolish_rebuild';
  }
}

// ────────────────────────────────────────────────────────────
// 대출 구조 추천
// ────────────────────────────────────────────────────────────

function recommendLoanStructure(
  grade: Grade,
  isPublicAsset: boolean,
  isGovernmentSupported: boolean
): { structure: LoanStructure; reason: string } {
  if ((grade === 'S' || grade === 'A') && (isPublicAsset || isGovernmentSupported)) {
    return { structure: 'pf', reason: '우수한 자산 등급과 공공 지원으로 PF 대출 구조가 유리합니다.' };
  }
  if (grade === 'A' || grade === 'B') {
    return { structure: 'pf_collateral_mix', reason: 'A~B 등급 자산으로 PF와 담보 혼합 구조가 적합합니다.' };
  }
  return { structure: 'collateral', reason: '담보 대출 중심으로 안정적인 자금 조달을 권장합니다.' };
}

// ────────────────────────────────────────────────────────────
// 적정 자기자본 비율 추천
// ────────────────────────────────────────────────────────────

function recommendEquityRatio(
  grade: Grade,
  loanStructure: LoanStructure,
  isGovernmentSupported: boolean
): number {
  const base: Record<Grade, number> = { S: 20, A: 25, B: 30, C: 40, D: 50 };
  let ratio = base[grade];
  if (loanStructure === 'pf') ratio -= 5;
  if (isGovernmentSupported) ratio -= 5;
  return Math.max(15, Math.min(60, ratio));
}

// ────────────────────────────────────────────────────────────
// 용도 조합 생성 (상위 점수 기반)
// ────────────────────────────────────────────────────────────

function buildUseTypeMix(
  scores: Record<AssetUseType, number>,
  excludeTypes: AssetUseType[],
  rank: 1 | 2 | 3,
  additionalFloorArea: number
): [UseTypeMix, ...UseTypeMix[]] {
  const sorted = (Object.entries(scores) as [AssetUseType, number][])
    .filter(([t]) => !excludeTypes.includes(t))
    .sort(([, a], [, b]) => b - a);

  const top = sorted[0];
  const second = sorted[1];
  const third = sorted[2];

  // 1순위: 최고 용도 + 상위 2번째 혼합 (연면적 클 때)
  if (rank === 1) {
    if (additionalFloorArea > 300 && second && second[1] >= 60) {
      return [
        { useType: top[0], ratio: 60 },
        { useType: second[0], ratio: 40 },
      ];
    }
    return [{ useType: top[0], ratio: 100 }];
  }

  // 2순위: 2~3위 조합 (보수적, 단일 또는 2개)
  if (rank === 2) {
    if (second && third && second[1] >= 55 && third[1] >= 45) {
      return [
        { useType: second[0], ratio: 50 },
        { useType: third[0], ratio: 30 },
        { useType: top[0], ratio: 20 },
      ];
    }
    return [{ useType: second?.[0] ?? top[0], ratio: 100 }];
  }

  // 3순위: 대안적 단일 또는 2개 조합
  const alt = sorted.find(([t]) => t !== top[0] && t !== second?.[0]);
  if (alt && alt[1] >= 40) {
    return [
      { useType: alt[0], ratio: 70 },
      { useType: top[0], ratio: 30 },
    ];
  }
  return [{ useType: alt?.[0] ?? top[0], ratio: 100 }];
}

// 용도 조합 요약 문자열
function buildUseTypeSummary(mix: UseTypeMix[]): string {
  return mix.map(m => `${USE_TYPE_LABEL[m.useType]} ${m.ratio}%`).join(' + ');
}

// ────────────────────────────────────────────────────────────
// 시나리오 개념 및 추천 이유 생성
// ────────────────────────────────────────────────────────────

function buildConcept(
  mix: UseTypeMix[],
  dir: DevelopmentDirection,
  scenery: NaturalScenery,
  historical: HistoricalValue,
  rank: 1 | 2 | 3
): { concept: string; reasons: string[]; risks: string[] } {
  const primaryType = mix[0].useType;
  const dirLabel = DEV_DIR_LABEL[dir];

  const conceptMap: Partial<Record<AssetUseType, string>> = {
    accommodation: '프리미엄 숙박 복합',
    wellness: '웰니스·힐링 허브',
    cultural_complex: '문화 재생 거점',
    senior_welfare: '시니어 케어 복합',
    residential: '주거 재생 단지',
    mixed_use_residential: '주상복합 개발',
    office: '지식산업 오피스',
    retail_fnb: '상업·F&B 복합',
    education: '교육·연구 캠퍼스',
    public_complex: '공공 복합시설',
    shared_residence: '공유주거 플랫폼',
    knowledge_industry: '지식산업센터',
    logistics: '물류 거점',
    retail_shopping: '판매·쇼핑 복합',
    medical: '의료 복합시설',
    religious_cultural: '문화·종교 복합',
  };

  const concept = `${rank}순위: ${conceptMap[primaryType] ?? USE_TYPE_LABEL[primaryType]} (${dirLabel})`;

  const reasons: string[] = [];
  if (scenery === 'waterfront_view') reasons.push('수변 조망으로 숙박·웰니스 프리미엄 형성 가능');
  if (scenery === 'good_nature') reasons.push('우수한 자연경관으로 힐링·체험 수요 흡수 가능');
  if (historical === 'registered_heritage' || historical === 'regional_landmark')
    reasons.push('역사·건축적 가치를 활용한 차별화 공간 조성 가능');
  if (dir === 'remodel' || dir === 'remodel_extension')
    reasons.push('기존 구조물 활용으로 공사비 절감 및 빠른 시장 진입 가능');
  if (dir === 'demolish_rebuild')
    reasons.push('신축을 통한 법정 최대 연면적 확보로 수익성 극대화');
  if (mix.length > 1) reasons.push(`${mix.map(m => USE_TYPE_LABEL[m.useType]).join('+')} 복합 구성으로 수익 분산`);
  if (reasons.length < 2) reasons.push('용도지역 및 입지 조건과 높은 정합성');

  const risks: string[] = [];
  if (dir === 'demolish_rebuild') risks.push('신축 공사기간 중 수익 발생 불가 (통상 18~24개월)');
  if (mix[0].useType === 'accommodation') risks.push('관광 수요 변동성에 따른 매출 편차 가능');
  if (mix[0].useType === 'residential') risks.push('분양·임대 시장 경기에 민감');
  if (risks.length === 0) risks.push('인허가 일정 지연 리스크 관리 필요');

  return { concept, reasons, risks };
}

// ────────────────────────────────────────────────────────────
// 메인 추천 함수
// ────────────────────────────────────────────────────────────

export interface RecommendScenariosInput {
  assetInput: Omit<AssetInput, 'preliminaryROI'>;
  scoringResult: ScoreResult;
  loanRates: LoanRates;
  landValuePerSqm: number;
  projectYears: number;
  residualValueRatio: number;
}

export function recommendScenarios(input: RecommendScenariosInput): RecommendationResult {
  const { assetInput, scoringResult, loanRates } = input;
  const { grade, detail } = scoringResult;

  // 전체 용도 적합도 점수 계산
  const useTypeScores = scoreAllUseTypes(assetInput, scoringResult);

  // 대출 구조 + 자기자본 비율 추천
  const loanRec = recommendLoanStructure(
    grade, assetInput.isPublicAsset,
    assetInput.isUrbanRegenerationArea || assetInput.isAbandonedSchoolBudget
  );
  const isGovSupported =
    assetInput.isUrbanRegenerationArea ||
    assetInput.isAbandonedSchoolBudget ||
    assetInput.isBalancedDevelopmentBudget;

  // 시나리오 3개 생성
  const scenarios: DevelopmentScenario[] = [];
  const usedTypes: AssetUseType[] = [];

  for (const rank of [1, 2, 3] as const) {
    const useTypeMix = buildUseTypeMix(
      useTypeScores, usedTypes, rank, detail.additionalFloorArea
    );

    // 사용된 용도 추적
    useTypeMix.forEach(m => { if (!usedTypes.includes(m.useType)) usedTypes.push(m.useType); });

    const devDir = recommendDevDirection(
      assetInput.buildingCondition,
      assetInput.zoningUpgradeFloorAreaGain,
      detail.additionalFloorArea,
      rank
    );

    const equityRatio = recommendEquityRatio(grade, loanRec.structure, isGovSupported);
    const mappedCondition = devDirToBuildingCondition(devDir);

    // IRR 계산
    const irrResult = calculateIRRScenarios({
      scoringResult,
      buildingCondition: mappedCondition,
      useTypeMix,
      landArea: assetInput.landArea,
      landValuePerSqm: input.landValuePerSqm,
      legalMaxFloorAreaRatio: assetInput.legalMaxFloorAreaRatio,
      zoningUpgradeGain: assetInput.zoningUpgradeFloorAreaGain,
      loanRates,
      equityRatio,
      projectYears: input.projectYears,
      isGovernmentSupported: isGovSupported,
      residualValueRatio: input.residualValueRatio,
    });

    const { concept, reasons, risks } = buildConcept(
      useTypeMix, devDir, assetInput.naturalScenery, assetInput.historicalValue, rank
    );

    // 적합도 점수 (상위 용도 평균)
    const suitabilityScore = Math.round(
      useTypeMix.reduce((sum, m) => sum + (useTypeScores[m.useType] ?? 0) * (m.ratio / 100), 0)
    );

    scenarios.push({
      rank,
      label: `${rank}순위 시나리오`,
      concept,
      useTypeMix,
      useTypeSummary: buildUseTypeSummary(useTypeMix),
      developmentDirection: devDir,
      developmentDirectionLabel: DEV_DIR_LABEL[devDir],
      reasons,
      risks,
      suitabilityScore,
      recommendedEquityRatio: equityRatio,
      loanStructure: loanRec.structure,
      loanStructureLabel: LOAN_LABEL[loanRec.structure],
      loanReason: loanRec.reason,
      irrResult,
    });
  }

  // 자산 강점·리스크 요약
  const keyStrengths: string[] = [];
  const keyRisks: string[] = [];

  if (scoringResult.blockC >= 65) keyStrengths.push('높은 심미적 가치 — 차별화 공간 조성 가능');
  if (scoringResult.blockB >= 65) keyStrengths.push('우수한 입지·수요 환경');
  if (scoringResult.blockA >= 65) keyStrengths.push('규제 여건 유리 — 개발 자유도 높음');
  if (detail.additionalFloorArea > 500) keyStrengths.push('상당한 추가 개발 가능 면적 확보');
  if (isGovSupported) keyStrengths.push('정부 지원 사업 해당 — 보조금 수혜 가능');
  if (keyStrengths.length === 0) keyStrengths.push('잠재 가치 발굴 가능 자산');

  if (assetInput.isWaterFrontEnvironmental) keyRisks.push('수변구역 환경청 인가 필요 — 인허가 기간 장기화');
  if (assetInput.idleYears >= 20) keyRisks.push('장기 방치로 인한 구조물 노후화 확인 필요');
  if (scoringResult.blockD < 40) keyRisks.push('현 시점 사업성 낮음 — 정부 지원 또는 창의적 용도 필수');
  if (keyRisks.length === 0) keyRisks.push('인허가 일정 변수 사전 검토 권장');

  return {
    scenarios: [scenarios[0], scenarios[1], scenarios[2]] as
      [DevelopmentScenario, DevelopmentScenario, DevelopmentScenario],
    assetSummary: {
      grade,
      totalScore: scoringResult.totalScore,
      keyStrengths,
      keyRisks,
      optimalEquityRatio: scenarios[0].recommendedEquityRatio,
    },
  };
}
