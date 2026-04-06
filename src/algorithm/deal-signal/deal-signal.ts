// Heritage Layer - Deal Signal
// 이 파일에 딜 시그널 분석 알고리즘을 구현하세요.

/**
 * 정부협력 경로 정보
 */
export interface GovCooperationRoute {
  directContractCondition: string;  // 수의계약 조건
  privateProposaProcess: string;    // 민간제안 절차
  applicablePrograms: string[];     // 적용 가능 정부 프로그램
  estimatedTimeline: string;        // 예상 소요 기간
}

/**
 * 딜 시그널 분석 결과 — Analysis 페이지의 "정부협력 경로" 섹션에 표시
 */
export interface DealSignalResult {
  govRoute: GovCooperationRoute | null;
  dealReadiness: 'ready' | 'conditional' | 'not_ready';
  recommendations: string[];
}

/**
 * 딜 시그널 분석 함수 — 여기에 알고리즘을 구현하세요.
 * @param assetType - 자산 유형 (폐교, 빈집 등)
 * @param ownershipType - 소유 구분 (국유, 공유, 사유)
 * @param govCooperation - 정부협력 가능 여부
 */
export function analyzeDealSignal(
  assetType: string,
  ownershipType: string | null,
  govCooperation: boolean | null,
): DealSignalResult {
  // TODO: 실제 딜 시그널 분석 구현
  return {
    govRoute: null,
    dealReadiness: 'not_ready',
    recommendations: [],
  };
}
