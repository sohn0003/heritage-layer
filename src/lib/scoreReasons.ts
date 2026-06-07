// 세부 항목 점수에 대해 자산별 한 줄 근거 문장을 생성하는 UI 헬퍼.
// algorithm/scoring.ts 의 룩업 테이블·구간을 미러링하며, 알고리즘 자체는 수정하지 않습니다.

import type { AssetInput, ScoreResult } from '@/algorithm/scoring/scoring';

export type ScoreReasonKey =
  | 'a1_zoning'
  | 'a2_developmentCapacity'
  | 'a3_permitAdjustment'
  | 'a4_zoningUpgradeAdjustment'
  | 'b1_populationCommercial'
  | 'b2_transportation'
  | 'b3_idleYearsAdjustment'
  | 'c1_historicalArchitectural'
  | 'c2_naturalScenery'
  | 'd1_buildingCondition'
  | 'd2_profitability'
  | 'd3_governmentSupport'
  | 'additionalFloorArea'
  | 'maxFloorAreaAfterUpgrade'
  | 'buildingCoverageUsageRate'
  | 'floorAreaRatioUsageRate';

export type ScoreReasons = Record<ScoreReasonKey, string>;

const zoningLabel: Record<AssetInput['zoning'], string> = {
  commercial_central: '중심상업',
  commercial_general: '일반상업',
  commercial_neighborhood: '근린상업',
  semi_residential: '준주거',
  residential_3rd: '3종 일반주거',
  residential_2nd: '2종 일반주거',
  residential_1st: '1종 일반주거',
  semi_industrial: '준공업',
  green_natural: '자연녹지',
  green_production: '생산녹지',
  green_conservation: '보전녹지',
  agricultural: '농림지역',
  nature_conservation: '자연환경보전',
};

const zoningComment = (z: AssetInput['zoning']): string => {
  if (z === 'commercial_central' || z === 'commercial_general' || z === 'commercial_neighborhood') {
    return '활용 폭이 가장 넓어 사업 유형 선택지가 많음';
  }
  if (z === 'semi_residential') return '주거·상업 혼합 — 복합시설에 유리';
  if (z === 'residential_3rd' || z === 'residential_2nd') return '주거 중심 — 임대·소규모 복합에 적합';
  if (z === 'residential_1st') return '저층 주거 위주 — 사업 자유도 낮음';
  if (z === 'semi_industrial') return '준공업 — 용도 제약으로 활용 폭 좁음';
  if (z === 'green_natural' || z === 'green_production') return '녹지 — 개발 제약이 큼';
  return '보전·농림 — 개발 제약이 매우 큼';
};

const populationLabel: Record<AssetInput['populationTrend'], string> = {
  increasing: '인구 증가',
  stable: '인구 유지',
  decreasing: '인구 감소',
  extinction_risk: '소멸위험',
};

const densityLabel: Record<AssetInput['commercialDensity'], string> = {
  high: '상권 두꺼움',
  low: '상권 얕음',
};

const historicalLabel: Record<AssetInput['historicalValue'], string> = {
  registered_heritage: '등록문화재·근대건축 유산',
  regional_landmark: '지역 역사 상징성',
  architectural_art: '건축예술적 특성',
  ordinary: '일반 건물',
  deteriorated: '노후 불량',
};

const sceneryLabel: Record<AssetInput['naturalScenery'], string> = {
  waterfront_view: '산·바다·강·호수 조망',
  good_nature: '우수한 자연경관 인접',
  ordinary_urban: '도심 내 평범한 경관',
  negative: '경관 저해 요소 존재',
};

const conditionLabel: Record<AssetInput['buildingCondition'], string> = {
  remodel_possible: '리모델링 가능',
  partial_reinforcement: '일부 보강 필요',
  major_repair: '대수선 필요',
  demolish_rebuild: '전면 철거 후 신축',
};

const upgradeLabel: Record<AssetInput['zoningUpgradeFloorAreaGain'], string> = {
  over_50: '종상향 시 용적률 50% 이상 추가 가능',
  between_20_50: '종상향 시 용적률 20~50% 추가 가능',
  under_20: '종상향 시 용적률 20% 미만 추가',
  impossible: '종상향 불가',
};

const useChangeLabel: Record<AssetInput['useChangeExpansion'], string> = {
  major: '허용 용도 대폭 확대',
  minor: '허용 용도 소폭 확대',
  none: '용도변경 여지 없음',
};

const fmt = (n: number, digits = 0) =>
  Number.isFinite(n) ? n.toLocaleString('ko-KR', { maximumFractionDigits: digits }) : '-';

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export const getScoreReasons = (
  input: AssetInput,
  detail: ScoreResult['detail'],
): ScoreReasons => {
  // A2 — 개발 여력
  const bcUsage = detail.buildingCoverageUsageRate;
  const farUsage = detail.floorAreaRatioUsageRate;
  const a2Parts: string[] = [];
  if (input.currentFloorArea === 0) {
    a2Parts.push('나대지 — 신축 여력 최대');
  } else {
    a2Parts.push(`용적률 사용률 ${fmt(farUsage)}%`);
    if (detail.additionalFloorArea > 0) a2Parts.push(`약 ${fmt(detail.additionalFloorArea)}㎡ 추가 여유`);
  }

  // A3 — 인허가 가감점 사유 모음
  const a3List: string[] = [];
  if (input.isPublicAsset && input.isPrivateNegotiationPossible) a3List.push('수의계약 가능 +15');
  if (input.isCitizenProposalPossible) a3List.push('민간제안 가능 +10');
  if (input.hasNearbyConversionPrecedent) a3List.push('인근 용도변경 전례 +8');
  if (input.isMilitaryOrHeritagZone) a3List.push('군사·문화재 구역 -15');
  if (input.isUrbanFacilityConflict) a3List.push('도시계획시설 저촉 -12');
  if (input.isWaterFrontEnvironmental) a3List.push('수변·환경청 인가 -20');
  if (input.isPrivateLand) a3List.push('사유지 -5');
  const a3 = a3List.length
    ? `${a3List.slice(0, 2).join(' · ')}${a3List.length > 2 ? ` 외 ${a3List.length - 2}건` : ''} (순효과 ${signed(detail.a3_permitAdjustment)})`
    : '특이 가감 요인 없음';

  // A4 — 종상향 + 용도변경
  const a4 = `${upgradeLabel[input.zoningUpgradeFloorAreaGain]} · ${useChangeLabel[input.useChangeExpansion]}`;

  // B1 — 인구·상권
  const b1 = `${populationLabel[input.populationTrend]} · ${densityLabel[input.commercialDensity]}`;

  // B2 — 거리
  const dist = input.distanceToCenter;
  const b2 =
    dist <= 1 ? `도심까지 ${fmt(dist, 1)}km — 도심 인접형`
    : dist <= 3 ? `도심까지 ${fmt(dist, 1)}km — 준도심`
    : dist <= 5 ? `도심까지 ${fmt(dist, 1)}km — 외곽`
    : `도심까지 ${fmt(dist, 1)}km — 원거리·체류형 컨셉 적합`;

  // B3 — 방치 기간
  const y = input.idleYears;
  const b3 =
    y < 5 ? `방치 ${y}년 — 신선도 가점`
    : y < 10 ? `방치 ${y}년 — 중립`
    : y < 20 ? `방치 ${y}년 — 노후 누적 -5`
    : y < 30 ? `방치 ${y}년 — 노후·민원 누적 -10`
    : `방치 ${y}년 — 심각한 노후 -15`;

  // D2 — 예비 ROI
  const roi = input.preliminaryROI;
  const d2 =
    roi >= 15 ? `예비 ROI ${fmt(roi, 1)}% — 매우 우수`
    : roi >= 10 ? `예비 ROI ${fmt(roi, 1)}% — 우수`
    : roi >= 7 ? `예비 ROI ${fmt(roi, 1)}% — 검토 대상`
    : roi >= 5 ? `예비 ROI ${fmt(roi, 1)}% — 보완 필요`
    : `예비 ROI ${fmt(roi, 1)}% — 사업성 낮음`;

  // D3 — 정부 지원
  const d3List: string[] = [];
  if (input.isUrbanRegenerationArea) d3List.push('도시재생 +15');
  if (input.isAbandonedSchoolBudget) d3List.push('폐교활용 예산 +10');
  if (input.isBalancedDevelopmentBudget) d3List.push('균형발전 특별회계 +8');
  const d3 = d3List.length ? `${d3List.join(' · ')} (합계 +${detail.d3_governmentSupport})` : '해당 지원사업 없음';

  // 보조 수치
  const legalMaxFloorArea = (input.legalMaxFloorAreaRatio / 100) * input.landArea;
  const upgradeRatio: Record<AssetInput['zoningUpgradeFloorAreaGain'], number> = {
    over_50: 1.5,
    between_20_50: 1.35,
    under_20: 1.1,
    impossible: 1.0,
  };

  return {
    a1_zoning: `${zoningLabel[input.zoning]} — ${zoningComment(input.zoning)}`,
    a2_developmentCapacity: a2Parts.join(' · '),
    a3_permitAdjustment: a3,
    a4_zoningUpgradeAdjustment: a4,
    b1_populationCommercial: b1,
    b2_transportation: b2,
    b3_idleYearsAdjustment: b3,
    c1_historicalArchitectural: `${historicalLabel[input.historicalValue]}`,
    c2_naturalScenery: `${sceneryLabel[input.naturalScenery]}`,
    d1_buildingCondition: `${conditionLabel[input.buildingCondition]}`,
    d2_profitability: d2,
    d3_governmentSupport: d3,
    additionalFloorArea: `법정 최대 ${fmt(legalMaxFloorArea)}㎡ − 현재 ${fmt(input.currentFloorArea)}㎡`,
    maxFloorAreaAfterUpgrade: `법정 한도 ${fmt(legalMaxFloorArea)}㎡ × 종상향 ${upgradeRatio[input.zoningUpgradeFloorAreaGain].toFixed(2)}배`,
    buildingCoverageUsageRate: `현재 ${fmt(input.currentBuildingCoverage, 1)}% / 법정 최대 ${fmt(input.legalMaxBuildingCoverage, 1)}%`,
    floorAreaRatioUsageRate: `현재 ${fmt(input.currentFloorAreaRatio, 1)}% / 법정 최대 ${fmt(input.legalMaxFloorAreaRatio, 1)}%`,
  };
};
