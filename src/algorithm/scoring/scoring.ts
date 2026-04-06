// Heritage Layer - Scoring Algorithm
// 이 파일에 자산 재생 가능성 스코어링 알고리즘을 구현하세요.

/**
 * 자산 데이터 인터페이스 — DB assets 테이블과 매핑
 */
export interface AssetInput {
  address: string;
  asset_type: string;
  zoning: string | null;
  building_coverage: number | null;
  floor_area_ratio: number | null;
  land_area: number | null;
  idle_years: number | null;
  ownership_type: string | null;
  grade: string | null;
  gov_cooperation: boolean | null;
}

/**
 * 스코어링 결과 인터페이스
 * Analysis 페이지에서 이 타입을 사용합니다.
 */
export interface ScoringResult {
  totalScore: number;           // 0~100 종합 점수
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  breakdown: {
    locationScore: number;      // 입지 점수
    conditionScore: number;     // 건물/토지 상태 점수
    regulationScore: number;    // 규제 유리성 점수
    govCoopScore: number;       // 정부협력 가능성 점수
  };
  scenarios: ScenarioSuggestion[];
}

export interface ScenarioSuggestion {
  title: string;                // 예: '복합문화공간', '코워킹 허브'
  description: string;
  estimatedIrr: number | null;  // 예상 IRR (%)
  confidence: 'high' | 'medium' | 'low';
}

/**
 * 자산 스코어링 함수 — 여기에 알고리즘을 구현하세요.
 * @param asset - DB에서 가져온 자산 데이터
 * @returns ScoringResult
 */
export function calculateScore(asset: AssetInput): ScoringResult {
  // TODO: 실제 알고리즘 구현
  return {
    totalScore: 0,
    grade: 'C',
    breakdown: {
      locationScore: 0,
      conditionScore: 0,
      regulationScore: 0,
      govCoopScore: 0,
    },
    scenarios: [],
  };
}
