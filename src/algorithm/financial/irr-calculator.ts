// Heritage Layer - IRR Calculator
// 이 파일에 내부수익률(IRR) 및 재무 지표 계산 알고리즘을 구현하세요.

/**
 * 재무 분석 입력 인터페이스
 */
export interface FinancialInput {
  landArea: number;             // 대지면적 (㎡)
  buildingCoverage: number;     // 건폐율 (%)
  floorAreaRatio: number;       // 용적률 (%)
  acquisitionCost: number;      // 취득 비용 (원)
  renovationCost: number;       // 리모델링 비용 (원)
  annualRevenue: number;        // 연간 예상 매출 (원)
  annualExpense: number;        // 연간 예상 비용 (원)
  holdingPeriodYears: number;   // 보유 기간 (년)
}

/**
 * 재무 분석 결과 — Analysis 페이지의 "재무 수익성 지표" 섹션에 표시
 */
export interface FinancialResult {
  irr: number;                  // 내부수익률 (%)
  npv: number;                  // 순현재가치 (원)
  dscr: number;                 // 부채상환비율
  paybackPeriod: number;        // 투자회수기간 (년)
  estimatedRevenue: number;     // 예상 매출 (원)
  operatingProfit: number;      // 영업이익 (원)
}

/**
 * 시나리오별 비교 결과 — "시나리오 비교표" 섹션에 표시
 */
export interface ScenarioComparison {
  conservative: FinancialResult;
  base: FinancialResult;
  optimistic: FinancialResult;
}

/**
 * 재무 지표 계산 함수 — 여기에 알고리즘을 구현하세요.
 */
export function calculateFinancials(input: FinancialInput): FinancialResult {
  // TODO: 실제 IRR, NPV, DSCR 등 계산 구현
  return {
    irr: 0,
    npv: 0,
    dscr: 0,
    paybackPeriod: 0,
    estimatedRevenue: 0,
    operatingProfit: 0,
  };
}

/**
 * 시나리오 비교 함수 — 보수/기본/낙관 시나리오 계산
 */
export function compareScenarios(baseInput: FinancialInput): ScenarioComparison {
  // TODO: 시나리오별 조정 계수 적용 후 계산
  const base = calculateFinancials(baseInput);
  return {
    conservative: { ...base },
    base,
    optimistic: { ...base },
  };
}
