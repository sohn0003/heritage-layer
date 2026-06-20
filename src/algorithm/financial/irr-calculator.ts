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
  ratio: number;          // 면적 비율 (%) — 전체 합계 100이어야 함
  presaleRatio?: number;  // 분양 비율 (%) — 분양 가능 용도에만 적용. 기본값 0 (전체 운영)
}

// ────────────────────────────────────────────────────────────
// 매출 산정 방식 — 회수기간 역산 + 사용자 조정
// ────────────────────────────────────────────────────────────

export interface RevenueAssumption {
  targetPaybackYears: number;        // 권장 매출 역산 기준 회수기간 (기본 10)
  targetOperatingMargin: number;     // 기본 영업이익률 (기본 0.40 = 40%)
  overrideAnnualRevenue?: number;    // 사용자 입력 매출 (미입력 시 권장값 자동 적용)
  overrideOperatingMargin?: number;  // 사용자 입력 영업이익률 (미입력 시 기본값 적용)
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
  revenueAssumption: RevenueAssumption;   // 매출 산정 방식 (역산 + 사용자 조정)
}

// ────────────────────────────────────────────────────────────
// 출력 타입
// ────────────────────────────────────────────────────────────

export interface UseTypeBreakdownItem {
  useType: AssetUseType;
  ratio: number;
  floorArea: number;           // 운영 면적 (분양분 제외, m²)
  presaleFloorArea: number;    // 분양 면적 (m²)
  annualRevenue: number;       // 운영 면적에 배분된 연간 매출
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
  presaleAreaRatio: number;          // 전체 면적 중 분양 처리 비율 (0~1)
  presaleRecoveredAmount: number;    // 분양으로 회수되는 투자비
  netOperatingInvestment: number;    // 분양·보조금 차감 후 실제 운영 조달 투자비
  equityAmount: number;
  loanAmount: number;
  annualInterest: number;
  loanType: string;
  recommendedAnnualRevenue: number;  // 회수기간 10년·영업이익률 40% 기준 역산 권장 매출
  annualRevenue: number;             // 적용된 연간 매출 (권장값 또는 사용자 입력)
  operatingMargin: number;           // 적용된 영업이익률
  annualOperatingCost: number;
  annualOperatingProfit: number;
  annualNetProfit: number;
  irr: number;
  dscr: number;
  totalInvestmentPaybackYears: number; // 운영투자비 회수기간 (무차입 가정, 영업이익 기준 — 역산 기준값과 직접 비교용)
  grossInvestmentPaybackYears: number; // 총 투자비 회수기간 (분양 매출 + 영업이익으로 총 투자비 회수, 보조금·대출 미고려)
  paybackYears: number;                // 자기자본 회수기간 (대출 원리금 상환 후, 레버리지 반영 실제값)
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
// 공사비 단가 (원/m²) — 리모델링 기준, 2026년 시장 현실 반영
// 평당 300만~500만원 기준으로 환산 (1평 = 3.3058m²)
// 신축(멸실 후 신축)은 CONDITION_MULTIPLIER ×2.0 적용 시 평당 약 600만~1,000만원 수준
const CONSTRUCTION_COST_BASE: Record<AssetUseType, number> = {
  accommodation:          1_210_000,   // 평당 400만원
  cultural_complex:       1_180_000,   // 평당 390만원
  education:               1_120_000,   // 평당 370만원
  senior_welfare:          1_240_000,   // 평당 410만원
  retail_fnb:               970_000,   // 평당 320만원
  shared_residence:       1_210_000,   // 평당 400만원
  logistics:                910_000,   // 평당 300만원
  knowledge_industry:     1_420_000,   // 평당 470만원
  wellness:                1_390_000,   // 평당 460만원
  public_complex:          1_150_000,   // 평당 380만원
  residential:             1_360_000,   // 평당 450만원
  mixed_use_residential:  1_450_000,   // 평당 480만원
  office:                  1_330_000,   // 평당 440만원
  retail_shopping:        1_210_000,   // 평당 400만원
  medical:                1_510_000,   // 평당 500만원
  religious_cultural:      1_150_000,   // 평당 380만원
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

// 분양 가능 용도 — 주거용·지식산업센터·오피스(오피스텔)·주상복합·숙박(리조트 분양형)
// 해당 용도는 면적의 일부 또는 전부를 분양 처리할 수 있음 (presaleRatio 설정 시)
const PRESALE_ELIGIBLE_TYPES: AssetUseType[] = [
  'residential', 'mixed_use_residential', 'knowledge_industry', 'office', 'accommodation',
];

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

// 운영 면적 / 분양 면적 배분 (용도별 분양비율 반영)
// 매출은 더 이상 m²당 단가가 아니라 회수기간 역산 방식으로 산출하므로
// 이 함수는 면적 배분만 담당한다.
function calcAreaBreakdown(
  mix: UseTypeMix[],
  totalArea: number
): {
  operatingArea: number;
  presaleArea: number;
  breakdown: { useType: AssetUseType; ratio: number; floorArea: number; presaleFloorArea: number }[];
} {
  let operatingArea = 0;
  let presaleArea = 0;
  const breakdown: { useType: AssetUseType; ratio: number; floorArea: number; presaleFloorArea: number }[] = [];

  for (const m of mix) {
    const fullArea = totalArea * (m.ratio / 100);
    const presaleR = PRESALE_ELIGIBLE_TYPES.includes(m.useType) ? (m.presaleRatio ?? 0) / 100 : 0;
    const opArea = fullArea * (1 - presaleR);
    const psArea = fullArea - opArea;
    operatingArea += opArea;
    presaleArea += psArea;
    breakdown.push({
      useType: m.useType, ratio: m.ratio,
      floorArea: Math.round(opArea), presaleFloorArea: Math.round(psArea),
    });
  }
  return { operatingArea, presaleArea, breakdown };
}

// ── 레거시: 시장 단가 기반 매출 산출 (estimatePreliminaryROI 전용) ──
// 스코어링 Block D 등급 차별화를 위해 시장 단가 기준 ROI를 유지한다.
// 회수기간 역산 방식을 쓰면 모든 자산의 ROI가 1/targetPaybackYears로
// 수렴해버려 등급 차별화가 사라지므로, 등급 산출용 계산에는
// 기존 시장 단가 테이블을 그대로 사용한다.
const LEGACY_REVENUE_PER_SQM: Record<AssetUseType, number> = {
  accommodation: 220_000, cultural_complex: 120_000, education: 150_000,
  senior_welfare: 180_000, retail_fnb: 200_000, shared_residence: 170_000,
  logistics: 80_000, knowledge_industry: 160_000, wellness: 250_000,
  public_complex: 100_000, residential: 150_000, mixed_use_residential: 180_000,
  office: 170_000, retail_shopping: 180_000, medical: 200_000, religious_cultural: 80_000,
};

const LEGACY_OPERATING_COST_RATIO: Record<AssetUseType, number> = {
  accommodation: 55, cultural_complex: 60, education: 50, senior_welfare: 65,
  retail_fnb: 45, shared_residence: 30, logistics: 25, knowledge_industry: 35,
  wellness: 58, public_complex: 60, residential: 25, mixed_use_residential: 38,
  office: 40, retail_shopping: 50, medical: 60, religious_cultural: 55,
};

function calcLegacyMarketRevenue(mix: UseTypeMix[], totalArea: number): number {
  return mix.reduce((sum, m) => {
    const area = totalArea * (m.ratio / 100);
    return sum + area * LEGACY_REVENUE_PER_SQM[m.useType];
  }, 0);
}

function calcLegacyWeightedOpCostRatio(mix: UseTypeMix[]): number {
  return mix.reduce((s, m) => s + LEGACY_OPERATING_COST_RATIO[m.useType] * (m.ratio / 100), 0);
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
          landArea, legalMaxFloorAreaRatio, zoningUpgradeGain, revenueAssumption } = input;
  const { grade } = scoringResult;
  const labelMap = { conservative: '보수적', base: '기본', optimistic: '낙관적' };

  const usableFloorArea = calcUsableFloorArea(
    landArea, legalMaxFloorAreaRatio, zoningUpgradeGain, scenario
  );

  // ── 공사비 ──
  const baseCostPerSqm = calcWeightedCostPerSqm(useTypeMix);
  const constructionCostPerSqm =
    baseCostPerSqm * CONDITION_MULTIPLIER[buildingCondition] * SCENARIO_COST_MULTIPLIER[scenario];
  const totalConstructionCost = Math.round(usableFloorArea * constructionCostPerSqm);
  const landAcquisitionCost = Math.round(landArea * input.landValuePerSqm);
  const softCost = Math.round(totalConstructionCost * 0.15);
  const totalInvestment = totalConstructionCost + landAcquisitionCost + softCost;

  // ── 면적 배분 (운영분 / 분양분) ──
  const { operatingArea, presaleArea, breakdown: areaBreakdown } =
    calcAreaBreakdown(useTypeMix, usableFloorArea);
  const presaleAreaRatio = usableFloorArea > 0 ? presaleArea / usableFloorArea : 0;

  // 분양분 투자비 회수: 총 투자비 중 분양 면적 비율에 해당하는 금액은
  // 분양 매출로 즉시 회수된 것으로 간주 (대출·자기자본 조달 대상에서 제외)
  const presaleRecoveredAmount = Math.round(totalInvestment * presaleAreaRatio);

  const governmentSubsidy = estimateSubsidy(totalInvestment, input.isGovernmentSupported, grade);
  const netInvestmentAfterSubsidy = totalInvestment - governmentSubsidy;
  const netOperatingInvestment = Math.max(0, netInvestmentAfterSubsidy - presaleRecoveredAmount);

  // 자기자본 = 분양회수·보조금 차감 후 실제 운영 조달 투자비 기준
  const equityAmount = Math.round(netOperatingInvestment * (input.equityRatio / 100));
  const loanAmount = netOperatingInvestment - equityAmount;
  const loanType = grade === 'S' || grade === 'A' ? 'PF' : '담보';
  const interestRate = loanType === 'PF' ? input.loanRates.pf : input.loanRates.collateral;
  const annualInterest = Math.round(loanAmount * (interestRate / 100));

  // ── 매출: 회수기간 역산 권장값 + 사용자 조정 ──
  // 권장 연매출 = 운영투자비 ÷ (목표 회수기간 × 목표 영업이익률)
  const { targetPaybackYears, targetOperatingMargin, overrideAnnualRevenue, overrideOperatingMargin } =
    revenueAssumption;

  const recommendedAnnualRevenue =
    targetPaybackYears > 0 && targetOperatingMargin > 0
      ? Math.round(netOperatingInvestment / (targetPaybackYears * targetOperatingMargin))
      : 0;

  const baseAnnualRevenue = overrideAnnualRevenue ?? recommendedAnnualRevenue;
  const annualRevenue = Math.round(baseAnnualRevenue * SCENARIO_REVENUE_MULTIPLIER[scenario]);

  const operatingMargin = overrideOperatingMargin ?? targetOperatingMargin;
  const annualOperatingProfit = Math.round(annualRevenue * operatingMargin);
  const annualOperatingCost = annualRevenue - annualOperatingProfit;

  // 용도별 매출 배분 (운영 면적 비율 기준)
  const useTypeBreakdown: UseTypeBreakdownItem[] = areaBreakdown.map(b => ({
    useType: b.useType,
    ratio: b.ratio,
    floorArea: b.floorArea,
    presaleFloorArea: b.presaleFloorArea,
    annualRevenue: operatingArea > 0 ? Math.round(annualRevenue * (b.floorArea / operatingArea)) : 0,
  }));

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

  // 초기 지출 = 자기자본만 (분양분은 이미 netOperatingInvestment에서 차감됨)
  // 100% 분양 등으로 운영 조달 투자비가 0이면 자기자본 IRR 개념이 적용되지 않음
  const isFullyPresaleFunded = netOperatingInvestment <= 0;

  let irr: number;
  let dscr: number;
  let paybackYears: number;
  let roi: number;

  if (isFullyPresaleFunded) {
    // 전액 분양 회수 — 자기자본 투입 없음. IRR·회수기간 개념 해당 없음
    irr = 0;
    dscr = 99;
    paybackYears = 0;
    roi = 0;
  } else {
    const cashFlows = [-equityAmount, ...Array(input.projectYears).fill(annualNetProfit)];
    cashFlows[cashFlows.length - 1] += Math.round(netOperatingInvestment * input.residualValueRatio);

    irr = calculateIRR(cashFlows);
    dscr = calculateDSCR(annualOperatingProfit, loanAmount, interestRate, input.projectYears);
    paybackYears = annualNetProfit > 0
      ? Math.round((equityAmount / annualNetProfit) * 10) / 10 : 999;
    roi = Math.round((annualOperatingProfit / netOperatingInvestment) * 100 * 10) / 10;
  }

  // 운영투자비 회수기간 (무차입 가정) — 역산 기준값과 직접 비교 가능
  const totalInvestmentPaybackYears = annualOperatingProfit > 0 && netOperatingInvestment > 0
    ? Math.round((netOperatingInvestment / annualOperatingProfit) * 10) / 10
    : 0;

  // 총 투자비 회수기간 — 분양 매출이 0년차에 들어오고, 이후 영업이익으로 잔여 총 투자비 회수 (보조금·대출 미고려)
  const grossRemaining = Math.max(0, totalInvestment - presaleRecoveredAmount);
  const grossInvestmentPaybackYears = grossRemaining === 0
    ? 0
    : annualOperatingProfit > 0
      ? Math.round((grossRemaining / annualOperatingProfit) * 10) / 10
      : 0;

  return {
    scenario, label: labelMap[scenario], usableFloorArea, useTypeBreakdown,
    constructionCostPerSqm: Math.round(constructionCostPerSqm),
    totalConstructionCost, landAcquisitionCost, softCost, totalInvestment,
    presaleAreaRatio: Math.round(presaleAreaRatio * 1000) / 1000,
    presaleRecoveredAmount, netOperatingInvestment,
    equityAmount, loanAmount, annualInterest, loanType,
    recommendedAnnualRevenue, annualRevenue, operatingMargin,
    annualOperatingCost, annualOperatingProfit, annualNetProfit,
    irr, dscr, totalInvestmentPaybackYears, grossInvestmentPaybackYears, paybackYears, roi,
    governmentSubsidy, netInvestmentAfterSubsidy,
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

  // 등급 차별화를 위해 시장 단가 기준(레거시) 매출로 계산
  // 회수기간 역산 방식을 쓰면 ROI가 항상 1/targetPaybackYears로 수렴해
  // 자산별 등급 차별화가 불가능해지므로 여기서는 시장 단가를 유지한다.
  const annualRevenue = calcLegacyMarketRevenue(input.useTypeMix, usableFloorArea);
  const weightedOpCost = calcLegacyWeightedOpCostRatio(input.useTypeMix);
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
  overrideAnnualRevenue?: number;     // 매출 직접 입력 (미입력 시 회수기간 역산 권장값)
  overrideOperatingMargin?: number;   // 영업이익률 직접 입력 (미입력 시 40%)
}

export interface AnalyzeAssetResult {
  preliminaryROI: number;
  scoring: ScoreResult;
  recommendation: RecommendationResult;   // 1/2/3순위 시나리오 포함
}

const DEFAULT_TARGET_PAYBACK_YEARS = 10;
const DEFAULT_TARGET_OPERATING_MARGIN = 0.40;

export function analyzeAsset(input: AnalyzeAssetInput): AnalyzeAssetResult {
  const ai = input.assetInput;

  // Step 1: 예비 ROI 추정 (상위 2개 용도 평균으로 proxy, 시장 단가 기준)
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
  const revenueAssumption: RevenueAssumption = {
    targetPaybackYears: DEFAULT_TARGET_PAYBACK_YEARS,
    targetOperatingMargin: DEFAULT_TARGET_OPERATING_MARGIN,
    overrideAnnualRevenue: input.overrideAnnualRevenue,
    overrideOperatingMargin: input.overrideOperatingMargin,
  };

  const recommendation = recommendScenarios({
    assetInput: ai,
    scoringResult: scoring,
    loanRates: input.loanRates,
    landValuePerSqm: input.landValuePerSqm,
    projectYears: input.projectYears,
    residualValueRatio: input.residualValueRatio,
    revenueAssumption,
  });

  // Step 4: 자기자본 비율 오버라이드 (슬라이더 조절 시) — 매출·영업이익률 오버라이드도 함께 반영
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
        revenueAssumption,
      });
    }
  }

  return { preliminaryROI, scoring, recommendation };
}
