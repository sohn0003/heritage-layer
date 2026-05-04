// ============================================================
// Heritage Layer — IRR Calculator
// 파일 위치: src/algorithm/financial/irr-calculator.ts
// scoring.ts의 출력값을 입력받아 재무 지표를 산출합니다
// ============================================================

import type { ScoreResult, BuildingCondition, Grade } from '../scoring/scoring';

// ────────────────────────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────────────────────────

export type AssetUseType =
  | 'accommodation'        // 숙박시설 (호텔·펜션·게스트하우스)
  | 'cultural_complex'     // 복합문화시설
  | 'education'            // 교육·연구시설
  | 'senior_welfare'       // 시니어·복지시설
  | 'retail_fnb'           // 상가·F&B
  | 'shared_residence'     // 임대주택·공유주거
  | 'logistics'            // 물류·창고
  | 'knowledge_industry'   // 지식산업센터
  | 'wellness'             // 웰니스·헬스케어
  | 'public_complex';      // 공공복합시설

export type ScenarioType = 'conservative' | 'base' | 'optimistic';

export interface LoanRates {
  pf: number;           // PF대출 이자율 (%)
  collateral: number;   // 담보대출 이자율 (%)
}

export interface IRRInput {
  // scoring.ts 연동값
  scoringResult: ScoreResult;
  buildingCondition: BuildingCondition;

  // 자산 기본 정보
  assetUseType: AssetUseType;   // 전환 용도
  landArea: number;             // 대지면적 (m²)
  landValuePerSqm: number;      // 공시지가 (원/m²)

  // 금융 구조
  loanRates: LoanRates;         // 대출 이자율
  equityRatio: number;          // 자기자본 비율 (%) — 예: 30
  projectYears: number;         // 운영 기간 (년) — 예: 10

  // 정부 지원 여부
  isGovernmentSupported: boolean; // 보조금·기금 지원 여부
}

// 시나리오별 단일 결과
export interface ScenarioResult {
  scenario: ScenarioType;
  label: string;                // '보수적' | '기본' | '낙관적'

  // 투자비
  constructionCostPerSqm: number;   // 공사비 단가 (원/m²)
  totalConstructionCost: number;    // 총 공사비 (원)
  landAcquisitionCost: number;      // 토지 취득비 (원)
  softCost: number;                 // 설계·인허가·부대비용 (원)
  totalInvestment: number;          // 총 투자비 (원)

  // 자금 조달
  equityAmount: number;             // 자기자본 (원)
  loanAmount: number;               // 대출금 (원)
  annualInterest: number;           // 연간 이자 (원)
  loanType: string;                 // 'PF' | '담보'

  // 수익
  usableFloorArea: number;          // 사용 가능 연면적 (m²)
  revenuePerSqm: number;            // m²당 연간 매출 단가
  annualRevenue: number;            // 연간 예상 매출 (원)
  operatingCostRatio: number;       // 운영비율 (%)
  annualOperatingCost: number;      // 연간 운영비 (원)
  annualOperatingProfit: number;    // 연간 영업이익 (원)
  annualNetProfit: number;          // 연간 순이익 (이자 차감 후)

  // 핵심 재무 지표
  irr: number;                      // 내부수익률 (%)
  dscr: number;                     // 부채상환비율
  paybackYears: number;             // 투자회수기간 (년)
  roi: number;                      // 단순 수익률 (%)

  // 정부 지원 효과
  governmentSubsidy: number;        // 보조금 추정액 (원)
  netInvestmentAfterSubsidy: number; // 보조금 차감 후 실투자비
}

// 최종 출력
export interface IRRResult {
  conservative: ScenarioResult;
  base: ScenarioResult;
  optimistic: ScenarioResult;
  summary: {
    recommendedScenario: ScenarioType;
    usableFloorArea: number;
    additionalFloorArea: number;
    maxFloorAreaAfterUpgrade: number;
    baseIRR: number;
    basePaybackYears: number;
    baseDSCR: number;
    investmentFeasibility: '높음' | '중간' | '낮음';
  };
}

// ────────────────────────────────────────────────────────────
// 공사비 단가 기준표 (원/m²)
// 건물 상태 × 전환 용도 조합
// ────────────────────────────────────────────────────────────

const CONSTRUCTION_COST_BASE: Record<AssetUseType, number> = {
  accommodation:      850_000,   // 숙박: 리모델링 기준
  cultural_complex:   700_000,   // 복합문화
  education:          650_000,   // 교육·연구
  senior_welfare:     750_000,   // 시니어·복지
  retail_fnb:         600_000,   // 상가·F&B
  shared_residence:   800_000,   // 임대주택
  logistics:          400_000,   // 물류·창고
  knowledge_industry: 900_000,   // 지식산업센터
  wellness:           950_000,   // 웰니스
  public_complex:     700_000,   // 공공복합
};

// 건물 상태별 공사비 배율
const CONDITION_MULTIPLIER: Record<BuildingCondition, number> = {
  remodel_possible:     1.0,   // 리모델링 기준값
  partial_reinforcement: 1.3,  // 30% 추가
  major_repair:          1.6,  // 60% 추가
  demolish_rebuild:      2.0,  // 신축 수준
};

// 시나리오별 공사비 배율
const SCENARIO_COST_MULTIPLIER: Record<ScenarioType, number> = {
  conservative: 1.15,  // 보수적: 15% 상향
  base:         1.0,
  optimistic:   0.90,  // 낙관적: 10% 절감
};

// ────────────────────────────────────────────────────────────
// 용도별 연간 매출 단가 기준 (원/m²)
// ────────────────────────────────────────────────────────────

const REVENUE_PER_SQM: Record<AssetUseType, number> = {
  accommodation:      220_000,   // 객실 매출 기준
  cultural_complex:   120_000,   // 입장·임대 수익
  education:          150_000,   // 수강료·임대
  senior_welfare:     180_000,   // 이용료·정부 지원
  retail_fnb:         200_000,   // 임대·직영 매출
  shared_residence:   130_000,   // 월세 기준
  logistics:           80_000,   // 임대료
  knowledge_industry: 160_000,   // 분양·임대
  wellness:           250_000,   // 회원권·이용료
  public_complex:     100_000,   // 공공 위탁 수익
};

// 시나리오별 매출 배율
const SCENARIO_REVENUE_MULTIPLIER: Record<ScenarioType, number> = {
  conservative: 0.80,
  base:         1.0,
  optimistic:   1.20,
};

// 용도별 운영비율 (매출 대비 %)
const OPERATING_COST_RATIO: Record<AssetUseType, number> = {
  accommodation:      55,
  cultural_complex:   60,
  education:          50,
  senior_welfare:     65,
  retail_fnb:         45,
  shared_residence:   30,
  logistics:          25,
  knowledge_industry: 35,
  wellness:           58,
  public_complex:     60,
};

// ────────────────────────────────────────────────────────────
// IRR 계산 (Newton-Raphson 방식)
// ────────────────────────────────────────────────────────────

function calculateIRR(cashFlows: number[]): number {
  // cashFlows[0] = 초기 투자 (음수), 이후 = 연간 순이익
  let rate = 0.1;
  const MAX_ITER = 1000;
  const TOLERANCE = 1e-7;

  for (let i = 0; i < MAX_ITER; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const pv = cashFlows[t] / Math.pow(1 + rate, t);
      npv += pv;
      dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }

    if (Math.abs(dnpv) < TOLERANCE) break;

    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < TOLERANCE) {
      rate = newRate;
      break;
    }
    rate = newRate;
  }

  return Math.round(rate * 1000) / 10; // % 단위, 소수 1자리
}

// ────────────────────────────────────────────────────────────
// DSCR 계산
// 연간 영업이익 / 연간 원리금 상환액
// ────────────────────────────────────────────────────────────

function calculateDSCR(
  annualOperatingProfit: number,
  loanAmount: number,
  interestRate: number,
  years: number
): number {
  if (loanAmount === 0) return 99;

  // 원리금 균등 상환 기준
  const monthlyRate = interestRate / 100 / 12;
  const months = years * 12;
  const monthlyPayment =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  const annualDebtService = monthlyPayment * 12;

  const dscr = annualOperatingProfit / annualDebtService;
  return Math.round(dscr * 100) / 100;
}

// ────────────────────────────────────────────────────────────
// 정부 보조금 추정
// ────────────────────────────────────────────────────────────

function estimateGovernmentSubsidy(
  totalInvestment: number,
  isSupported: boolean,
  grade: Grade
): number {
  if (!isSupported) return 0;

  // 등급별 보조금 비율 (총 투자비 대비)
  const subsidyRatio: Record<Grade, number> = {
    S: 0.25,
    A: 0.20,
    B: 0.15,
    C: 0.10,
    D: 0.05,
  };

  return Math.round(totalInvestment * subsidyRatio[grade]);
}

// ────────────────────────────────────────────────────────────
// 단일 시나리오 계산
// ────────────────────────────────────────────────────────────

function computeScenario(
  input: IRRInput,
  scenario: ScenarioType
): ScenarioResult {
  const { scoringResult, buildingCondition, assetUseType } = input;
  const { detail, grade } = scoringResult;

  const labelMap: Record<ScenarioType, string> = {
    conservative: '보수적',
    base: '기본',
    optimistic: '낙관적',
  };

  // ── 사용 연면적 결정 ──
  // 기본: scoring에서 산출된 추가 개발 가능 연면적 활용
  // 낙관적: 종상향 후 최대 연면적 기준
  const usableFloorArea =
    scenario === 'optimistic'
      ? detail.maxFloorAreaAfterUpgrade * 0.75  // 공용부 제외 75%
      : (detail.additionalFloorArea > 0
          ? detail.additionalFloorArea * 0.75
          : input.landArea * 0.5);              // 나대지 기본 50% 가정

  // ── 공사비 산출 ──
  const baseCostPerSqm = CONSTRUCTION_COST_BASE[assetUseType];
  const conditionMultiplier = CONDITION_MULTIPLIER[buildingCondition];
  const scenarioCostMultiplier = SCENARIO_COST_MULTIPLIER[scenario];
  const constructionCostPerSqm =
    baseCostPerSqm * conditionMultiplier * scenarioCostMultiplier;
  const totalConstructionCost =
    Math.round(usableFloorArea * constructionCostPerSqm);

  // ── 토지 취득비 ──
  const landAcquisitionCost =
    Math.round(input.landArea * input.landValuePerSqm);

  // ── 부대비용 (설계·인허가·기타): 공사비의 15% ──
  const softCost = Math.round(totalConstructionCost * 0.15);

  // ── 총 투자비 ──
  const totalInvestment =
    totalConstructionCost + landAcquisitionCost + softCost;

  // ── 자금 조달 ──
  const equityAmount = Math.round(totalInvestment * (input.equityRatio / 100));
  const loanAmount = totalInvestment - equityAmount;

  // PF 또는 담보 구분: 공공자산이면 PF, 사유지면 담보
  const loanType = grade === 'S' || grade === 'A' ? 'PF' : '담보';
  const interestRate =
    loanType === 'PF' ? input.loanRates.pf : input.loanRates.collateral;
  const annualInterest = Math.round(loanAmount * (interestRate / 100));

  // ── 수익 산출 ──
  const revenuePerSqm =
    REVENUE_PER_SQM[assetUseType] * SCENARIO_REVENUE_MULTIPLIER[scenario];
  const annualRevenue = Math.round(usableFloorArea * revenuePerSqm);

  const operatingCostRatio = OPERATING_COST_RATIO[assetUseType];
  const annualOperatingCost =
    Math.round(annualRevenue * (operatingCostRatio / 100));
  const annualOperatingProfit = annualRevenue - annualOperatingCost;
  const annualNetProfit = annualOperatingProfit - annualInterest;

  // ── 정부 보조금 ──
  const governmentSubsidy = estimateGovernmentSubsidy(
    totalInvestment,
    input.isGovernmentSupported,
    grade
  );
  const netInvestmentAfterSubsidy = totalInvestment - governmentSubsidy;

  // ── IRR 계산 ──
  const cashFlows: number[] = [
    -(netInvestmentAfterSubsidy), // 0년차: 초기 투자
    ...Array(input.projectYears).fill(annualNetProfit), // 운영 기간
    // 마지막 해에 잔존가치 (총 투자비의 40%) 추가
    // (마지막 연도 순이익에 합산)
  ];
  // 잔존가치 마지막 연도에 추가
  cashFlows[cashFlows.length - 1] += Math.round(totalInvestment * 0.4);

  const irr = calculateIRR(cashFlows);

  // ── DSCR ──
  const dscr = calculateDSCR(
    annualOperatingProfit,
    loanAmount,
    interestRate,
    input.projectYears
  );

  // ── 투자회수기간 ──
  const paybackYears =
    annualNetProfit > 0
      ? Math.round((netInvestmentAfterSubsidy / annualNetProfit) * 10) / 10
      : 999;

  // ── 단순 ROI ──
  const roi =
    Math.round(
      (annualOperatingProfit / netInvestmentAfterSubsidy) * 100 * 10
    ) / 10;

  return {
    scenario,
    label: labelMap[scenario],
    constructionCostPerSqm: Math.round(constructionCostPerSqm),
    totalConstructionCost,
    landAcquisitionCost,
    softCost,
    totalInvestment,
    equityAmount,
    loanAmount,
    annualInterest,
    loanType,
    usableFloorArea: Math.round(usableFloorArea),
    revenuePerSqm: Math.round(revenuePerSqm),
    annualRevenue,
    operatingCostRatio,
    annualOperatingCost,
    annualOperatingProfit,
    annualNetProfit,
    irr,
    dscr,
    paybackYears,
    roi,
    governmentSubsidy,
    netInvestmentAfterSubsidy,
  };
}

// ────────────────────────────────────────────────────────────
// 투자 타당성 판단
// ────────────────────────────────────────────────────────────

function assessFeasibility(
  baseIRR: number,
  baseDSCR: number
): '높음' | '중간' | '낮음' {
  if (baseIRR >= 10 && baseDSCR >= 1.3) return '높음';
  if (baseIRR >= 6 && baseDSCR >= 1.0) return '중간';
  return '낮음';
}

// ────────────────────────────────────────────────────────────
// 메인 함수 — 외부 호출 진입점
// ────────────────────────────────────────────────────────────

export function calculateIRRScenarios(input: IRRInput): IRRResult {
  const conservative = computeScenario(input, 'conservative');
  const base = computeScenario(input, 'base');
  const optimistic = computeScenario(input, 'optimistic');

  const feasibility = assessFeasibility(base.irr, base.dscr);

  // 권장 시나리오: DSCR 1.0 이상이면서 IRR 최대인 시나리오
  let recommendedScenario: ScenarioType = 'base';
  if (optimistic.dscr >= 1.0 && optimistic.irr > base.irr) {
    recommendedScenario = 'optimistic';
  } else if (base.dscr < 1.0 && conservative.dscr >= 1.0) {
    recommendedScenario = 'conservative';
  }

  return {
    conservative,
    base,
    optimistic,
    summary: {
      recommendedScenario,
      usableFloorArea: base.usableFloorArea,
      additionalFloorArea: input.scoringResult.detail.additionalFloorArea,
      maxFloorAreaAfterUpgrade:
        input.scoringResult.detail.maxFloorAreaAfterUpgrade,
      baseIRR: base.irr,
      basePaybackYears: base.paybackYears,
      baseDSCR: base.dscr,
      investmentFeasibility: feasibility,
    },
  };
}

// ────────────────────────────────────────────────────────────
// 사용 예시
// ────────────────────────────────────────────────────────────
//
// import { calculateScore } from '../scoring/scoring';
// import { calculateIRRScenarios } from './irr-calculator';
//
// const scoring = calculateScore({ ...assetInput });
//
// const result = calculateIRRScenarios({
//   scoringResult: scoring,
//   buildingCondition: 'remodel_possible',
//   assetUseType: 'accommodation',
//   landArea: 3000,
//   landValuePerSqm: 200_000,
//   loanRates: { pf: 5.5, collateral: 4.8 },
//   equityRatio: 30,
//   projectYears: 10,
//   isGovernmentSupported: true,
// });
//
// console.log(result.summary.baseIRR);              // 예: 12.4 (%)
// console.log(result.summary.baseDSCR);             // 예: 1.42
// console.log(result.summary.basePaybackYears);     // 예: 7.2 (년)
// console.log(result.summary.investmentFeasibility); // '높음'
// console.log(result.base.annualRevenue);           // 연간 예상 매출 (원)
// console.log(result.base.totalInvestment);         // 총 투자비 (원)
// console.log(result.summary.recommendedScenario);  // 'base' | 'optimistic'
