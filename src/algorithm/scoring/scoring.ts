// ============================================================
// Heritage Layer — COSMO-P Lite Scoring Engine
// 파일 위치: src/algorithm/scoring/scoring.ts
// 작성 기준: THE LAYER 스코어링 기준표 확정판
// ============================================================

// ────────────────────────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────────────────────────

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface AssetInput {
  // Block A — 입지·규제
  zoning: ZoningType;                      // 용도지역
  currentBuildingCoverage: number;         // 현재 건폐율 (%)
  legalMaxBuildingCoverage: number;        // 법정 최대 건폐율 (%)
  currentFloorAreaRatio: number;           // 현재 용적률 (%)
  legalMaxFloorAreaRatio: number;          // 법정 최대 용적률 (%)
  currentFloorArea: number;                // 현재 연면적 (m²)
  landArea: number;                        // 대지면적 (m²)
  isPublicAsset: boolean;                  // 공공자산 여부
  isPrivateNegotiationPossible: boolean;   // 수의계약 가능 여부
  isCitizenProposalPossible: boolean;      // 민간제안 가능 여부
  hasNearbyConversionPrecedent: boolean;   // 인근 용도변경 전례 여부
  isMilitaryOrHeritagZone: boolean;        // 군사·문화재보호구역 인접
  isUrbanFacilityConflict: boolean;        // 도시계획시설 저촉
  isWaterFrontEnvironmental: boolean;      // 수변구역·환경청 인가 필요
  isPrivateLand: boolean;                  // 사유지 여부
  zoningUpgradeFloorAreaGain: ZoningUpgradeGain; // 종상향 시 용적률 추가 확보
  useChangeExpansion: UseChangeExpansion;  // 용도변경 허용 용도 확대

  // Block B — 수요·환경
  populationTrend: PopulationTrend;        // 인구 추이
  commercialDensity: CommercialDensity;    // 상권 밀도
  distanceToCenter: number;               // 도심까지 거리 (km)
  idleYears: number;                       // 방치 기간 (년)

  // Block C — 심미적 가치
  historicalValue: HistoricalValue;        // 역사·건축적 가치
  naturalScenery: NaturalScenery;          // 자연경관·심미성

  // Block D — 사업성
  buildingCondition: BuildingCondition;    // 건물 상태
  estimatedROI: number;                    // 추정 ROI (%)
  isUrbanRegenerationArea: boolean;        // 도시재생·지역소멸기금 해당
  isAbandonedSchoolBudget: boolean;        // 폐교활용 교육부 예산 해당
  isBalancedDevelopmentBudget: boolean;    // 균형발전특별회계 해당
}

export interface ScoreResult {
  blockA: number;
  blockB: number;
  blockC: number;
  blockD: number;
  totalScore: number;
  grade: Grade;
  detail: {
    a1_zoning: number;
    a2_developmentCapacity: number;
    a3_permitAdjustment: number;
    a4_zoningUpgradeAdjustment: number;
    b1_populationCommercial: number;
    b2_transportation: number;
    b3_idleYearsAdjustment: number;
    c1_historicalArchitectural: number;
    c2_naturalScenery: number;
    d1_buildingCondition: number;
    d2_profitability: number;
    d3_governmentSupport: number;
    additionalFloorArea: number;        // 추가 개발 가능 연면적 (m²)
    maxFloorAreaAfterUpgrade: number;   // 종상향 후 최대 연면적 (m²) — IRR 연동용
    buildingCoverageUsageRate: number;  // 건폐율 사용률 (%)
    floorAreaRatioUsageRate: number;    // 용적률 사용률 (%)
  };
}

// ────────────────────────────────────────────────────────────
// Enum 정의
// ────────────────────────────────────────────────────────────

export type ZoningType =
  | 'commercial_general'       // 일반상업
  | 'commercial_neighborhood'  // 근린상업
  | 'commercial_central'       // 중심상업
  | 'semi_residential'         // 준주거
  | 'residential_2nd'          // 2종 일반주거
  | 'residential_3rd'          // 3종 일반주거
  | 'green_natural'            // 자연녹지
  | 'green_production'         // 생산녹지
  | 'residential_1st'          // 1종 일반주거
  | 'semi_industrial'          // 준공업
  | 'green_conservation'       // 보전녹지
  | 'agricultural'             // 농림지역
  | 'nature_conservation';     // 자연환경보전

export type PopulationTrend =
  | 'increasing'               // 인구 증가
  | 'stable'                   // 유지
  | 'decreasing'               // 감소
  | 'extinction_risk';         // 소멸위험 지역

export type CommercialDensity =
  | 'high'                     // 높음
  | 'low';                     // 낮음

export type ZoningUpgradeGain =
  | 'over_50'                  // 종상향 시 용적률 50% 이상 추가
  | 'between_20_50'            // 20~50% 추가
  | 'under_20'                 // 20% 미만 추가
  | 'impossible';              // 종상향 불가

export type UseChangeExpansion =
  | 'major'                    // 허용 용도 대폭 확대
  | 'minor'                    // 소폭 확대
  | 'none';                    // 해당 없음

export type HistoricalValue =
  | 'registered_heritage'      // 등록문화재·근대건축 유산
  | 'regional_landmark'        // 지역 역사 상징성
  | 'architectural_art'        // 건축예술적 특성
  | 'ordinary'                 // 일반 건물
  | 'deteriorated';            // 노후 불량

export type NaturalScenery =
  | 'waterfront_view'          // 산·바다·강·호수 조망
  | 'good_nature'              // 우수한 자연경관 인접
  | 'ordinary_urban'           // 도심 내 평범
  | 'negative';                // 경관 저해 요소 존재

export type BuildingCondition =
  | 'remodel_possible'         // 리모델링 가능
  | 'partial_reinforcement'    // 일부 보강 필요
  | 'major_repair'             // 대수선 필요
  | 'demolish_rebuild';        // 전면 철거 후 신축

// ────────────────────────────────────────────────────────────
// Block A — 입지·규제 적합성 (25%)
// ────────────────────────────────────────────────────────────

function scoreA1Zoning(zoning: ZoningType): number {
  const table: Record<ZoningType, number> = {
    commercial_general: 90,
    commercial_neighborhood: 90,
    commercial_central: 90,
    semi_residential: 80,
    residential_2nd: 65,
    residential_3rd: 60,
    green_natural: 45,
    green_production: 35,
    residential_1st: 30,
    semi_industrial: 25,
    green_conservation: 10,
    agricultural: 10,
    nature_conservation: 10,
  };
  return table[zoning];
}

function scoreA2DevelopmentCapacity(input: AssetInput): number {
  const bcUsage = (input.currentBuildingCoverage / input.legalMaxBuildingCoverage) * 100;
  const farUsage = (input.currentFloorAreaRatio / input.legalMaxFloorAreaRatio) * 100;

  const isVacantLand = input.currentFloorArea === 0;

  // 건폐율 여유 점수
  let bcScore: number;
  if (isVacantLand) bcScore = 95;
  else if (bcUsage <= 40) bcScore = 90;
  else if (bcUsage <= 60) bcScore = 70;
  else if (bcUsage <= 80) bcScore = 45;
  else bcScore = 20;

  // 용적률 여유 점수
  let farScore: number;
  if (isVacantLand) farScore = 95;
  else if (farUsage <= 40) farScore = 90;
  else if (farUsage <= 60) farScore = 70;
  else if (farUsage <= 80) farScore = 45;
  else farScore = 20;

  // 추가 개발 가능 연면적
  const maxFloorArea = (input.legalMaxFloorAreaRatio / 100) * input.landArea;
  const additionalFloorArea = maxFloorArea - input.currentFloorArea;
  const additionalRatio = input.currentFloorArea > 0
    ? (additionalFloorArea / input.currentFloorArea) * 100
    : 999;

  let additionalScore: number;
  if (additionalRatio >= 200) additionalScore = 95;
  else if (additionalRatio >= 100) additionalScore = 80;
  else if (additionalRatio >= 50) additionalScore = 60;
  else if (additionalRatio >= 20) additionalScore = 40;
  else additionalScore = 15;

  return (bcScore * 0.3) + (farScore * 0.3) + (additionalScore * 0.4);
}

function scoreA3PermitAdjustment(input: AssetInput): number {
  let adjustment = 0;
  if (input.isPublicAsset && input.isPrivateNegotiationPossible) adjustment += 15;
  if (input.isCitizenProposalPossible) adjustment += 10;
  if (input.hasNearbyConversionPrecedent) adjustment += 8;
  if (input.isMilitaryOrHeritagZone) adjustment -= 15;
  if (input.isUrbanFacilityConflict) adjustment -= 12;
  if (input.isWaterFrontEnvironmental) adjustment -= 20;
  if (input.isPrivateLand) adjustment -= 5;
  return adjustment;
}

function scoreA4ZoningUpgrade(input: AssetInput): number {
  let adjustment = 0;

  const upgradeTable: Record<ZoningUpgradeGain, number> = {
    over_50: 20,
    between_20_50: 12,
    under_20: 5,
    impossible: 0,
  };
  adjustment += upgradeTable[input.zoningUpgradeFloorAreaGain];

  const useChangeTable: Record<UseChangeExpansion, number> = {
    major: 10,
    minor: 5,
    none: 0,
  };
  adjustment += useChangeTable[input.useChangeExpansion];

  return adjustment;
}

function computeBlockA(input: AssetInput): number {
  const a1 = scoreA1Zoning(input.zoning);
  const a2 = scoreA2DevelopmentCapacity(input);
  const a3 = scoreA3PermitAdjustment(input);
  const a4 = scoreA4ZoningUpgrade(input);
  return Math.min(100, Math.max(0, (a1 * 0.4) + (a2 * 0.4) + a3 + a4));
}

// ────────────────────────────────────────────────────────────
// Block B — 수요·환경 분석 (25%)
// ────────────────────────────────────────────────────────────

function scoreB1PopulationCommercial(
  pop: PopulationTrend,
  commercial: CommercialDensity
): number {
  const matrix: Record<PopulationTrend, Record<CommercialDensity, number>> = {
    increasing: { low: 90, high: 85 },
    stable:     { low: 75, high: 70 },
    decreasing: { high: 50, low: 35 },
    extinction_risk: { high: 40, low: 20 },
  };
  return matrix[pop][commercial];
}

function scoreB2Transportation(distanceKm: number): number {
  if (distanceKm <= 1) return 90;
  if (distanceKm <= 3) return 65;
  if (distanceKm <= 5) return 40;
  return 20;
}

function scoreB3IdleYears(years: number): number {
  if (years < 5) return 5;
  if (years < 10) return 0;
  if (years < 20) return -5;
  if (years < 30) return -10;
  return -15;
}

function computeBlockB(input: AssetInput): number {
  const b1 = scoreB1PopulationCommercial(input.populationTrend, input.commercialDensity);
  const b2 = scoreB2Transportation(input.distanceToCenter);
  const b3 = scoreB3IdleYears(input.idleYears);
  return Math.min(100, Math.max(0, (b1 * 0.6) + (b2 * 0.4) + b3));
}

// ────────────────────────────────────────────────────────────
// Block C — 심미적 가치 (20%)
// ────────────────────────────────────────────────────────────

function scoreC1Historical(value: HistoricalValue): number {
  const table: Record<HistoricalValue, number> = {
    registered_heritage: 90,
    regional_landmark: 75,
    architectural_art: 65,
    ordinary: 40,
    deteriorated: 20,
  };
  return table[value];
}

function scoreC2NaturalScenery(scenery: NaturalScenery): number {
  const table: Record<NaturalScenery, number> = {
    waterfront_view: 90,
    good_nature: 70,
    ordinary_urban: 45,
    negative: 20,
  };
  return table[scenery];
}

function computeBlockC(input: AssetInput): number {
  const c1 = scoreC1Historical(input.historicalValue);
  const c2 = scoreC2NaturalScenery(input.naturalScenery);
  return (c1 * 0.5) + (c2 * 0.5);
}

// ────────────────────────────────────────────────────────────
// Block D — 사업성 추정 (30%)
// ────────────────────────────────────────────────────────────

function scoreD1BuildingCondition(condition: BuildingCondition): number {
  const table: Record<BuildingCondition, number> = {
    remodel_possible: 90,
    partial_reinforcement: 65,
    major_repair: 45,
    demolish_rebuild: 25,
  };
  return table[condition];
}

function scoreD2Profitability(roi: number): number {
  if (roi >= 15) return 90;
  if (roi >= 10) return 70;
  if (roi >= 7)  return 50;
  if (roi >= 5)  return 35;
  return 15;
}

function scoreD3GovernmentSupport(input: AssetInput): number {
  let support = 0;
  if (input.isUrbanRegenerationArea) support += 15;
  if (input.isAbandonedSchoolBudget) support += 10;
  if (input.isBalancedDevelopmentBudget) support += 8;
  return support;
}

function computeBlockD(input: AssetInput): number {
  const d1 = scoreD1BuildingCondition(input.buildingCondition);
  const d2 = scoreD2Profitability(input.estimatedROI);
  const d3 = scoreD3GovernmentSupport(input);
  return Math.min(100, Math.max(0, (d1 * 0.35) + (d2 * 0.45) + (d3 * 0.20)));
}

// ────────────────────────────────────────────────────────────
// 등급 산출
// ────────────────────────────────────────────────────────────

function deriveGrade(score: number): Grade {
  if (score >= 80) return 'S';
  if (score >= 65) return 'A';
  if (score >= 50) return 'B';
  if (score >= 35) return 'C';
  return 'D';
}

// ────────────────────────────────────────────────────────────
// IRR 연동용 보조 수치 계산
// ────────────────────────────────────────────────────────────

function calcAdditionalFloorArea(input: AssetInput): number {
  const maxFloorArea = (input.legalMaxFloorAreaRatio / 100) * input.landArea;
  return Math.max(0, maxFloorArea - input.currentFloorArea);
}

function calcMaxFloorAreaAfterUpgrade(input: AssetInput): number {
  const upgradeRatioMap: Record<ZoningUpgradeGain, number> = {
    over_50: 1.5,
    between_20_50: 1.35,
    under_20: 1.1,
    impossible: 1.0,
  };
  const ratio = upgradeRatioMap[input.zoningUpgradeFloorAreaGain];
  const baseMax = (input.legalMaxFloorAreaRatio / 100) * input.landArea;
  return baseMax * ratio;
}

// ────────────────────────────────────────────────────────────
// 메인 함수 — 외부에서 호출하는 진입점
// ────────────────────────────────────────────────────────────

export function calculateScore(input: AssetInput): ScoreResult {
  const blockA = computeBlockA(input);
  const blockB = computeBlockB(input);
  const blockC = computeBlockC(input);
  const blockD = computeBlockD(input);

  const totalScore =
    blockA * 0.25 +
    blockB * 0.25 +
    blockC * 0.20 +
    blockD * 0.30;

  const grade = deriveGrade(totalScore);

  const bcUsage = (input.currentBuildingCoverage / input.legalMaxBuildingCoverage) * 100;
  const farUsage = (input.currentFloorAreaRatio / input.legalMaxFloorAreaRatio) * 100;

  return {
    blockA: Math.round(blockA * 10) / 10,
    blockB: Math.round(blockB * 10) / 10,
    blockC: Math.round(blockC * 10) / 10,
    blockD: Math.round(blockD * 10) / 10,
    totalScore: Math.round(totalScore * 10) / 10,
    grade,
    detail: {
      a1_zoning: scoreA1Zoning(input.zoning),
      a2_developmentCapacity: scoreA2DevelopmentCapacity(input),
      a3_permitAdjustment: scoreA3PermitAdjustment(input),
      a4_zoningUpgradeAdjustment: scoreA4ZoningUpgrade(input),
      b1_populationCommercial: scoreB1PopulationCommercial(
        input.populationTrend,
        input.commercialDensity
      ),
      b2_transportation: scoreB2Transportation(input.distanceToCenter),
      b3_idleYearsAdjustment: scoreB3IdleYears(input.idleYears),
      c1_historicalArchitectural: scoreC1Historical(input.historicalValue),
      c2_naturalScenery: scoreC2NaturalScenery(input.naturalScenery),
      d1_buildingCondition: scoreD1BuildingCondition(input.buildingCondition),
      d2_profitability: scoreD2Profitability(input.estimatedROI),
      d3_governmentSupport: scoreD3GovernmentSupport(input),
      additionalFloorArea: Math.round(calcAdditionalFloorArea(input)),
      maxFloorAreaAfterUpgrade: Math.round(calcMaxFloorAreaAfterUpgrade(input)),
      buildingCoverageUsageRate: Math.round(bcUsage * 10) / 10,
      floorAreaRatioUsageRate: Math.round(farUsage * 10) / 10,
    },
  };
}

// ────────────────────────────────────────────────────────────
// 사용 예시
// ────────────────────────────────────────────────────────────
//
// import { calculateScore } from 'src/algorithm/scoring/scoring';
//
// const result = calculateScore({
//   zoning: 'residential_2nd',
//   currentBuildingCoverage: 30,
//   legalMaxBuildingCoverage: 60,
//   currentFloorAreaRatio: 80,
//   legalMaxFloorAreaRatio: 200,
//   currentFloorArea: 400,
//   landArea: 1000,
//   isPublicAsset: true,
//   isPrivateNegotiationPossible: true,
//   isCitizenProposalPossible: false,
//   hasNearbyConversionPrecedent: true,
//   isMilitaryOrHeritagZone: false,
//   isUrbanFacilityConflict: false,
//   isWaterFrontEnvironmental: false,
//   isPrivateLand: false,
//   zoningUpgradeFloorAreaGain: 'between_20_50',
//   useChangeExpansion: 'major',
//   populationTrend: 'decreasing',
//   commercialDensity: 'low',
//   distanceToCenter: 2.5,
//   idleYears: 15,
//   historicalValue: 'regional_landmark',
//   naturalScenery: 'good_nature',
//   buildingCondition: 'remodel_possible',
//   estimatedROI: 11,
//   isUrbanRegenerationArea: true,
//   isAbandonedSchoolBudget: true,
//   isBalancedDevelopmentBudget: false,
// });
//
// console.log(result.grade);       // 'A'
// console.log(result.totalScore);  // 예: 68.4
// console.log(result.detail.additionalFloorArea);       // IRR 연동용
// console.log(result.detail.maxFloorAreaAfterUpgrade);  // IRR 연동용
