// ============================================================
// Heritage Layer — IRR Calculator v2
// 파일 위치: src/algorithm/financial/irr-calculator.ts
//
// 변경사항:
// - 전환 용도 16종으로 확대 (주거·주상복합·오피스 등 추가)
// - 복합 용도 지원: 최소 1개 ~ 최대 3개 용도, 면적 비율 설정
// - 면적 산출: 법정 허용 용적률 + 종상향 여력 기반으로 개선
// - ROI 자동 계산 후 scoring.ts Block D에 자동 전달
// ============================================================

import type {
  ScoreResult,
  BuildingCondition,
  Grade,
  AssetInput,
  ZoningUpgradeGain,
} from '../scoring/scoring';
import { calculateScore } from '../scoring/scoring';

// ────────────────────────────────────────────────────────────
// 전환 용도 타입 — 16종
// ────────────────────────────────────────────────────────────

export type AssetUseType =
  | 'accommodation'          // 숙박시설 (호텔·펜션·게스트하우스)
  | 'cultural_complex'       // 복합문화시설
  | 'education'              // 교육·연구시설
  | 'senior_welfare'         // 시니어·복지시설
  | 'retail_fnb'             // 상가·F&B
  | 'shared_residence'       // 임대주택·공유주거
  | 'logistics'              // 물류·창고
  | 'knowledge_industry'     // 지식산업센터
  | 'wellness'               // 웰니스·헬스케어
  | 'public_complex'         // 공공복합시설
  | 'residential'            // 일반 주거시설 (아파트·다세대)
  | 'mixed_use_residential'  // 주상복합
  | 'office'                 // 오피스
  | 'retail_shopping'        // 판매시설 (쇼핑몰)
  | 'medical'                // 의료시설
  | 'religious_cultural';    // 종교·문화시설

export type ScenarioType = 'conservative' | 'base' | 'optimistic';

// ────────────────────────────────────────────────────────────
// 복합 용도 구성 타입
// 1개 ~ 3개 용도, 면적 비율 합계 = 100
// ────────────────────────────────────────────────────────────

export interface UseTypeMix {
  useType: AssetUseType;
  ratio: number;  // 면적 비율 (%) — 전체 합계 100이어야 함
}

// ────────────────────────────────────────────────────────────
// 입력 타입
// ────────────────────────────────────────────────────────────

export interface LoanRates {
  pf: number;           // PF대출 이자율 (%)
  collateral: number;   // 담보대출 이자율 (%)
}

export interface IRRInput {
  scoringResult: ScoreResult;
  buildingCondition: BuildingCondition;
  useTypeMix: [UseTypeMix, ...UseTypeMix[]];   // 최소 1개 필수
  landArea: number;
  landValuePerSqm: number;
  legalMaxFloorAreaRatio: number;
  zoningUpgradeGain: ZoningUpgradeGain;
  loanRates: LoanRates;
  equityRatio: number;
  projectYears: number;
  isGovernmentSupported: boolean;
  residualValueRatio: number;
}

// ────────────────────────────────────────────────────────────
// 출력 타입
// ────────────────────────────────────────────────────────────

export interface UseTypeBreakdownItem {
  useType: AssetUseType;
  ratio: number;
  floorArea: number;
  annualRevenue: number;
}

export interface ScenarioResult {
  scenario: ScenarioType;
  label: string;
  usableFloorArea: number;
  useTypeBreakdown: UseTypeBreakdownItem[];
  constructionCostPerSqm: number;
  totalConstructionCost: number;
  landAcquisitionCost: number;
  softCost: number;
  totalInvestment: number;
  equityAmount: number;
  loanAmount: number;
  annualInterest: number;
  loanType: string;
  annualRevenue: number;
  annualOperatingCost: number;
  annualOperatingProfit: number;
  annualNetProfit: number;
  irr: number;
  dscr: number;
  paybackYears: number;
  roi: number;
  governmentSubsidy: number;
  netInvestmentAfterSubsidy: number;
}

export interface IRRResult {
  conservative: ScenarioResult;
  base: ScenarioResult;
  optimistic: ScenarioResult;
  summary: {
    recommendedScenario: ScenarioType;
    baseUsableFloorArea: number;
    additionalFloorArea: number;
    maxFloorAreaAfterUpgrade: number;
    baseIRR: number;
    basePaybackYears: number;
    baseDSCR: number;
    investmentFeasibility: '높음' | '중간' | '낮음';
    useTypeSummary: string;
  };
}

// ────────────────────────────────────────────────────────────
// 기준표 — 16종 용도
// ────────────────────────────────────────────────────────────

// 공사비 단가 (원/m²) — 리모델링 기준, 지방·유휴자산 현실 반영
const CONSTRUCTION_COST_BASE: Record<AssetUseType, number> = {
  accommodation:            650_000,   // 농촌·지방 펜션·호텔 리모델링
  cultural_complex:         600_000,
  education:                550_000,
  senior_welfare:           650_000,
  retail_fnb:               500_000,
  shared_residence:         650_000,
  logistics:                350_000,
  knowledge_industry:       800_000,
  wellness:                 750_000,
  public_complex:           600_000,
  residential:              750_000,
  mixed_use_residential:    850_000,
  office:                   750_000,
  retail_shopping:          650_000,
  medical:                  900_000,
  religious_cultural:       600_000,
};

const CONDITION_MULTIPLIER: Record<BuildingCondition, number> = {
  remodel_possible:       1.0,
  partial_reinforcement:  1.3,
  major_repair:           1.6,
  demolish_rebuild:       2.0,
};

const SCENARIO_COST_MULTIPLIER: Record<ScenarioType, number> = {
  conservative: 1.15,
  base:         1.0,
  optimistic:   0.90,
};

// 연간 매출 단가 (원/m²) — 지방 현실 기준 (도심은 1.2~1.5배 가능)
const REVENUE_PER_SQM: Record<AssetUseType, number> = {
  accommodation:          220_000,   // 지방 펜션·호텔 객실 매출
  cultural_complex:       120_000,
  education:              150_000,
  senior_welfare:         180_000,
  retail_fnb:             200_000,
  shared_residence:       170_000,   // 공유주거: 상향 (도심 소형 임대)
  logistics:               80_000,
  knowledge_industry:     160_000,
  wellness:               250_000,
  public_complex:         100_000,
  residential:            150_000,   // 임대주택: 상향
  mixed_use_residential:  180_000,   // 주상복합: 상향
  office:                 170_000,
  retail_shopping:        180_000,
  medical:                200_000,
  religious_cultural:      80_000,
};

const OPERATING_COST_RATIO: Record<AssetUseType, number> = {
  accommodation:          55,
  cultural_complex:       60,
  education:              50,
  senior_welfare:         65,
  retail_fnb:             45,
  shared_residence:       30,
  logistics:              25,
  knowledge_industry:     35,
  wellness:               58,
  public_complex:         60,
  residential:            25,
  mixed_use_residential:  38,
  office:                 40,
  retail_shopping:        50,
  medical:                60,
  religious_cultural:     55,
};

const SCENARIO_REVENUE_MULTIPLIER: Record<ScenarioType, number> = {
  conservative: 0.80,
  base:         1.0,
  optimistic:   1.20,
};

const ZONING_UPGRADE_MULTIPLIER: Record<ZoningUpgradeGain, number> = {
  over_50:       1.50,
  between_20_50: 1.35,
  under_20:      1.10,
  impossible:    1.00,
};

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

// ────────────────────────────────────────────────────────────
// 유틸리티 함수
// ────────────────────────────────────────────────────────────

function validateUseTypeMix(mix: UseTypeMix[]): void {
  if (mix.length < 1 || mix.length > 3)
    throw new Error('용도는 최소 1개, 최대 3개까지 설정 가능합니다.');
  const total = mix.reduce((s, m) => s + m.ratio, 0);
  if (Math.abs(total - 100) > 0.1)
    throw new Error(`용도별 비율 합계가 100이어야 합니다. 현재: ${total}`);
}

function calcUsableFloorArea(
  landArea: number,
  legalMaxFloorAreaRatio: number,
  zoningUpgradeGain: ZoningUpgradeGain,
  scenario: ScenarioType
): number {
  const baseMax = (legalMaxFloorAreaRatio / 100) * landArea;
  const effectiveMax =
    scenario === 'optimistic'
      ? baseMax * ZONING_UPGRADE_MULTIPLIER[zoningUpgradeGain]
      : baseMax;
  return Math.round(effectiveMax * 0.85);
}

function calcWeightedCostPerSqm(mix: UseTypeMix[]): number {
  return mix.reduce((s, m) => s + CONSTRUCTION_COST_BASE[m.useType] * (m.ratio / 100), 0);
}

function calcMixedRevenue(
  mix: UseTypeMix[],
  totalArea: number,
  scenarioMult: number
): { total: number; breakdown: UseTypeBreakdownItem[] } {
  let total = 0;
  const breakdown: UseTypeBreakdownItem[] = [];
  for (const m of mix) {
    const area = totalArea * (m.ratio / 100);
    const revenue = Math.round(area * REVENUE_PER_SQM[m.useType] * scenarioMult);
    total += revenue;
    breakdown.push({ useType: m.useType, ratio: m.ratio, floorArea: Math.round(area), annualRevenue: revenue });
  }
  return { total, breakdown };
}

function calcWeightedOpCostRatio(mix: UseTypeMix[]): number {
  return mix.reduce((s, m) => s + OPERATING_COST_RATIO[m.useType] * (m.ratio / 100), 0);
}

function calculateIRR(cashFlows: number[]): number {
  // 비할인 합계 검증 — 양의 IRR 가능 여부 사전 확인
  const futureSum = cashFlows.slice(1).reduce((a, b) => a + b, 0);
  const initialOut = Math.abs(cashFlows[0]);

  if (futureSum <= initialOut * 0.05) {
    // 양의 IRR 불가 → 이분법으로 음의 IRR 추정
    let lo = -0.99, hi = 0.0;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      const npv = cashFlows.reduce((s, cf, t) => s + cf / Math.pow(1 + mid, t), 0);
      if (npv > 0) lo = mid; else hi = mid;
      if (hi - lo < 1e-6) break;
    }
    return Math.round(((lo + hi) / 2) * 1000) / 10;
  }

  // Newton-Raphson (발산 방지: -99% ~ 500% 범위 제한)
  let rate = 0.1;
  for (let i = 0; i < 200; i++) {
    let npv = 0, dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const pv = cashFlows[t] / Math.pow(1 + rate, t);
      npv += pv;
      dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }
    if (Math.abs(dnpv) < 1e-7) break;
    const newRate = Math.max(-0.99, Math.min(5.0, rate - npv / dnpv));
    if (Math.abs(newRate - rate) < 1e-7) { rate = newRate; break; }
    rate = newRate;
  }
  return Math.round(rate * 1000) / 10;
}

function calculateDSCR(opProfit: number, loan: number, rate: number, years: number): number {
  if (loan === 0) return 99;
  const mr = rate / 100 / 12;
  const mo = years * 12;
  const mp = (loan * mr * Math.pow(1 + mr, mo)) / (Math.pow(1 + mr, mo) - 1);
  return Math.round((opProfit / (mp * 12)) * 100) / 100;
}

function estimateSubsidy(total: number, supported: boolean, grade: Grade): number {
  if (!supported) return 0;
  const r: Record<Grade, number> = { S: 0.25, A: 0.20, B: 0.15, C: 0.10, D: 0.05 };
  return Math.round(total * r[grade]);
}

function buildUseTypeSummary(mix: UseTypeMix[]): string {
  return mix.map(m => `${USE_TYPE_LABEL[m.useType]} ${m.ratio}%`).join(' + ');
}

// ────────────────────────────────────────────────────────────
// 단일 시나리오 계산
// ────────────────────────────────────────────────────────────

function computeScenario(input: IRRInput, scenario: ScenarioType): ScenarioResult {
  const { scoringResult, buildingCondition, useTypeMix,
          landArea, legalMaxFloorAreaRatio, zoningUpgradeGain } = input;
  const { grade } = scoringResult;
  const labelMap = { conservative: '보수적', base: '기본', optimistic: '낙관적' };

  const usableFloorArea = calcUsableFloorArea(
    landArea, legalMaxFloorAreaRatio, zoningUpgradeGain, scenario
  );

  const baseCostPerSqm = calcWeightedCostPerSqm(useTypeMix);
  const constructionCostPerSqm =
    baseCostPerSqm * CONDITION_MULTIPLIER[buildingCondition] * SCENARIO_COST_MULTIPLIER[scenario];
  const totalConstructionCost = Math.round(usableFloorArea * constructionCostPerSqm);
  const landAcquisitionCost = Math.round(landArea * input.landValuePerSqm);
  const softCost = Math.round(totalConstructionCost * 0.15);
  const totalInvestment = totalConstructionCost + landAcquisitionCost + softCost;

  const governmentSubsidy = estimateSubsidy(totalInvestment, input.isGovernmentSupported, grade);
  const netInvestmentAfterSubsidy = totalInvestment - governmentSubsidy;

  // 자기자본 = 보조금 차감 후 실투자비 기준
  const equityAmount = Math.round(netInvestmentAfterSubsidy * (input.equityRatio / 100));
  const loanAmount = netInvestmentAfterSubsidy - equityAmount;
  const loanType = grade === 'S' || grade === 'A' ? 'PF' : '담보';
  const interestRate = loanType === 'PF' ? input.loanRates.pf : input.loanRates.collateral;
  const annualInterest = Math.round(loanAmount * (interestRate / 100));

  const { total: annualRevenue, breakdown: useTypeBreakdown } =
    calcMixedRevenue(useTypeMix, usableFloorArea, SCENARIO_REVENUE_MULTIPLIER[scenario]);

  const weightedOpCostRatio = calcWeightedOpCostRatio(useTypeMix);
  const annualOperatingCost = Math.round(annualRevenue * (weightedOpCostRatio / 100));
  const annualOperatingProfit = annualRevenue - annualOperatingCost;

  // ── Equity IRR: 원리금 균등 상환 기준 연간 부채상환액 산출 ──
  const annualDebtService = loanAmount > 0
    ? (() => {
        const mr = interestRate / 100 / 12;
        const mo = input.projectYears * 12;
        const mp = mr > 0
          ? (loanAmount * mr * Math.pow(1 + mr, mo)) / (Math.pow(1 + mr, mo) - 1)
          : loanAmount / mo;
        return Math.round(mp * 12);
      })()
    : 0;
  const annualNetProfit = annualOperatingProfit - annualDebtService;

  // 초기 지출 = 자기자본만 / 만기 시 대출 완전 상환 → 잔존가치에서 차감 불필요
  const cashFlows = [-equityAmount, ...Array(input.projectYears).fill(annualNetProfit)];
  cashFlows[cashFlows.length - 1] += Math.round(netInvestmentAfterSubsidy * input.residualValueRatio);

  const irr = calculateIRR(cashFlows);
  const dscr = calculateDSCR(annualOperatingProfit, loanAmount, interestRate, input.projectYears);
  const paybackYears = annualNetProfit > 0
    ? Math.round((equityAmount / annualNetProfit) * 10) / 10 : 999;
  const roi = Math.round((annualOperatingProfit / netInvestmentAfterSubsidy) * 100 * 10) / 10;

  return {
    scenario, label: labelMap[scenario], usableFloorArea, useTypeBreakdown,
    constructionCostPerSqm: Math.round(constructionCostPerSqm),
    totalConstructionCost, landAcquisitionCost, softCost, totalInvestment,
    equityAmount, loanAmount, annualInterest, loanType,
    annualRevenue, annualOperatingCost, annualOperatingProfit, annualNetProfit,
    irr, dscr, paybackYears, roi, governmentSubsidy, netInvestmentAfterSubsidy,
  };
}

// ────────────────────────────────────────────────────────────
// 메인 IRR 계산 함수
// ────────────────────────────────────────────────────────────

export function calculateIRRScenarios(input: IRRInput): IRRResult {
  validateUseTypeMix(input.useTypeMix);
  const conservative = computeScenario(input, 'conservative');
  const base = computeScenario(input, 'base');
  const optimistic = computeScenario(input, 'optimistic');

  let recommendedScenario: ScenarioType = 'base';
  if (optimistic.dscr >= 1.0 && optimistic.irr > base.irr) recommendedScenario = 'optimistic';
  else if (base.dscr < 1.0 && conservative.dscr >= 1.0) recommendedScenario = 'conservative';

  const feasibility =
    base.irr >= 10 && base.dscr >= 1.3 ? '높음' :
    base.irr >= 6 && base.dscr >= 1.0  ? '중간' : '낮음';

  return {
    conservative, base, optimistic,
    summary: {
      recommendedScenario,
      baseUsableFloorArea: base.usableFloorArea,
      additionalFloorArea: input.scoringResult.detail.additionalFloorArea,
      maxFloorAreaAfterUpgrade: input.scoringResult.detail.maxFloorAreaAfterUpgrade,
      baseIRR: base.irr,
      basePaybackYears: base.paybackYears,
      baseDSCR: base.dscr,
      investmentFeasibility: feasibility,
      useTypeSummary: buildUseTypeSummary(input.useTypeMix),
    },
  };
}

// ────────────────────────────────────────────────────────────
// 1차 ROI 추정 — 스코어링 전 Block D 자동 입력용
// ────────────────────────────────────────────────────────────

export interface PreliminaryROIInput {
  useTypeMix: [UseTypeMix, ...UseTypeMix[]];
  landArea: number;
  legalMaxFloorAreaRatio: number;
  zoningUpgradeGain: ZoningUpgradeGain;
  buildingCondition: BuildingCondition;
  landValuePerSqm: number;
  loanRates: LoanRates;
  equityRatio: number;
  projectYears: number;
  residualValueRatio: number;
}

export function estimatePreliminaryROI(input: PreliminaryROIInput): number {
  validateUseTypeMix(input.useTypeMix);

  // 법정 최대 면적 × 종상향 배율 × 공용부 제외 85%
  const baseMax = (input.legalMaxFloorAreaRatio / 100) * input.landArea;
  const upgraded = baseMax * ZONING_UPGRADE_MULTIPLIER[input.zoningUpgradeGain];
  const usableFloorArea = Math.round(upgraded * 0.85);

  const weightedCost = calcWeightedCostPerSqm(input.useTypeMix);
  const condMult = CONDITION_MULTIPLIER[input.buildingCondition];
  const constructionCost = Math.round(usableFloorArea * weightedCost * condMult);
  const landCost = Math.round(input.landArea * input.landValuePerSqm);
  const softCost = Math.round(constructionCost * 0.15);
  const totalInvestment = constructionCost + landCost + softCost;

  const { total: annualRevenue } = calcMixedRevenue(input.useTypeMix, usableFloorArea, 1.0);
  const weightedOpCost = calcWeightedOpCostRatio(input.useTypeMix);
  const annualOperatingProfit = Math.round(annualRevenue * (1 - weightedOpCost / 100));

  if (totalInvestment === 0) return 0;
  return Math.round((annualOperatingProfit / totalInvestment) * 100 * 10) / 10;
}

// ────────────────────────────────────────────────────────────
// 통합 분석 함수 — Lovable에서 이 함수 하나만 호출
// 1. 예비 ROI 추정 → 스코어링 → 시나리오 추천 → IRR 계산
// ────────────────────────────────────────────────────────────

import {
  recommendScenarios,
  RecommendationResult,
} from '../recommend/recommend-scenarios';

export interface AnalyzeAssetInput {
  assetInput: Omit<AssetInput, 'preliminaryROI'>;
  landValuePerSqm: number;
  loanRates: LoanRates;
  projectYears: number;
  residualValueRatio: number;
  // 슬라이더로 조절 가능 — undefined 시 추천값 자동 사용
  overrideEquityRatio?: number;
}

export interface AnalyzeAssetResult {
  preliminaryROI: number;
  scoring: ScoreResult;
  recommendation: RecommendationResult;   // 1/2/3순위 시나리오 포함
}

export function analyzeAsset(input: AnalyzeAssetInput): AnalyzeAssetResult {
  const ai = input.assetInput;

  // Step 1: 예비 ROI 추정 (상위 2개 용도 평균으로 proxy)
  // 이 단계에서는 용도 추천 전이므로 일반 숙박+복합문화 기준 사용
  const preliminaryROI = estimatePreliminaryROI({
    useTypeMix: [{ useType: 'accommodation', ratio: 60 }, { useType: 'cultural_complex', ratio: 40 }],
    landArea:               ai.landArea,
    legalMaxFloorAreaRatio: ai.legalMaxFloorAreaRatio,
    zoningUpgradeGain:      ai.zoningUpgradeFloorAreaGain,
    buildingCondition:      ai.buildingCondition,
    landValuePerSqm:        input.landValuePerSqm,
    loanRates:              input.loanRates,
    equityRatio:            30,
    projectYears:           input.projectYears,
    residualValueRatio:     input.residualValueRatio,
  });

  // Step 2: 스코어링 (등급 산출)
  const scoring = calculateScore({ ...ai, preliminaryROI });

  // Step 3: 시나리오 추천 + IRR 계산 (recommendScenarios 내부에서 처리)
  const recommendation = recommendScenarios({
    assetInput: ai,
    scoringResult: scoring,
    loanRates: input.loanRates,
    landValuePerSqm: input.landValuePerSqm,
    projectYears: input.projectYears,
    residualValueRatio: input.residualValueRatio,
  });

  // Step 4: 자기자본 비율 오버라이드 (슬라이더 조절 시)
  if (input.overrideEquityRatio !== undefined) {
    for (const scenario of recommendation.scenarios) {
      scenario.irrResult = calculateIRRScenarios({
        scoringResult: scoring,
        buildingCondition: scenario.irrResult.base.loanType === 'PF'
          ? 'remodel_possible' : 'partial_reinforcement',
        useTypeMix: scenario.useTypeMix,
        landArea: ai.landArea,
        landValuePerSqm: input.landValuePerSqm,
        legalMaxFloorAreaRatio: ai.legalMaxFloorAreaRatio,
        zoningUpgradeGain: ai.zoningUpgradeFloorAreaGain,
        loanRates: input.loanRates,
        equityRatio: input.overrideEquityRatio,
        projectYears: input.projectYears,
        isGovernmentSupported:
          ai.isUrbanRegenerationArea || ai.isAbandonedSchoolBudget || ai.isBalancedDevelopmentBudget,
        residualValueRatio: input.residualValueRatio,
      });
    }
  }

  return { preliminaryROI, scoring, recommendation };
}
