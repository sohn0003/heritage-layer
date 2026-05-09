// ============================================================
// Heritage Layer — Deal Signal Engine
// 파일 위치: src/algorithm/deal-signal/deal-signal.ts
// 유저 행동 신호를 감지하고 딜 인텔리전스로 전환합니다
// ============================================================

import type { Grade } from '../scoring/scoring';

// ────────────────────────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────────────────────────

export type SignalType =
  | 'saved'           // 자산 저장
  | 'viewed'          // Analysis 페이지 열람
  | 'repeated_view'   // Analysis 반복 열람 (동일 자산 2회 이상)
  | 'deal_interest'   // 딜 관심 표명 버튼 클릭
  | 'pro_upgrade';    // Pro 구독 전환

export type TriggerLevel =
  | 'none'            // 트리거 없음
  | 'watch'           // 관심 수집 단계
  | 'alert'           // 내부 알림 단계
  | 'action';         // 즉시 액션 단계

export type ActionType =
  | 'send_proposal'       // 유저에게 딜 제안서 발송
  | 'internal_alert'      // 내부 딜팀 알림
  | 'owner_contact'       // 자산 소유자 접촉 개시
  | 'cluster_report';     // 클러스터 리포트 생성

// 개별 유저 신호 이벤트
export interface SignalEvent {
  userId: string;
  assetId: string;
  signalType: SignalType;
  timestamp: Date;
  metadata?: {
    viewDurationSeconds?: number;  // 열람 시간
    scrollDepth?: number;          // 스크롤 깊이 (%)
    proConversionSource?: string;  // Pro 전환 경로
  };
}

// 자산별 신호 집계
export interface AssetSignalSummary {
  assetId: string;
  assetGrade: Grade;
  totalSignalScore: number;       // 종합 신호 점수
  uniqueUsers: number;            // 관심 유저 수
  savedCount: number;             // 저장 횟수
  viewCount: number;              // 열람 횟수
  repeatedViewCount: number;      // 반복 열람 횟수
  dealInterestCount: number;      // 딜 관심 표명 횟수
  proUpgradeCount: number;        // Pro 전환 횟수
  clusterDetected: boolean;       // 클러스터 감지 여부
  triggerLevel: TriggerLevel;     // 현재 트리거 단계
  recommendedActions: ActionType[]; // 권장 액션
  priorityScore: number;          // 딜소싱 우선순위 점수 (0~100)
  lastSignalAt: Date;             // 마지막 신호 발생 시각
}

// 유저별 관심 프로파일
export interface UserInterestProfile {
  userId: string;
  interestedAssets: {
    assetId: string;
    signalScore: number;
    signals: SignalType[];
    lastActivityAt: Date;
  }[];
  proposalEligible: boolean;      // 딜 제안 수신 자격
  topInterestAssetId: string;     // 관심도 가장 높은 자산
}

// 딜 제안서 데이터
export interface DealProposal {
  userId: string;
  assetId: string;
  proposalType: 'joint_investment' | 'asset_sale' | 'development_consignment';
  triggerReason: string;
  generatedAt: Date;
  messageTemplate: string;
}

// 클러스터 리포트
export interface ClusterReport {
  assetId: string;
  clusterSize: number;            // 관심 유저 수
  averageSignalScore: number;
  userTypes: string[];            // 유저 직군 분포 (추후 확장)
  recommendedAction: string;
  generatedAt: Date;
}

// 최종 출력
export interface DealSignalResult {
  assetSummaries: AssetSignalSummary[];     // 자산별 신호 요약
  topPriorityAssets: AssetSignalSummary[];  // 우선순위 상위 자산
  userProfiles: UserInterestProfile[];       // 유저별 관심 프로파일
  proposalsToSend: DealProposal[];          // 발송할 딜 제안서
  clusterReports: ClusterReport[];          // 클러스터 리포트
  internalAlerts: InternalAlert[];          // 내부 딜팀 알림
}

export interface InternalAlert {
  assetId: string;
  triggerLevel: TriggerLevel;
  reason: string;
  signalSummary: string;
  createdAt: Date;
}

// ────────────────────────────────────────────────────────────
// 신호 점수 기준표
// ────────────────────────────────────────────────────────────

const SIGNAL_SCORE: Record<SignalType, number> = {
  saved:          10,   // 저장: 관심 표명
  viewed:          5,   // 열람: 기본 관심
  repeated_view:  20,   // 반복 열람: 고의도 신호
  deal_interest:  50,   // 딜 관심: 직접 의사표시
  pro_upgrade:    30,   // Pro 전환: 구독 결정
};

// 등급별 가산 배율 (S등급 자산은 신호 가중치 높음)
const GRADE_MULTIPLIER: Record<Grade, number> = {
  S: 1.5,
  A: 1.2,
  B: 1.0,
  C: 0.8,
  D: 0.6,
};

// ────────────────────────────────────────────────────────────
// 트리거 조건 기준표
// ────────────────────────────────────────────────────────────

const TRIGGER_THRESHOLDS = {
  watch: {
    totalScore: 15,       // 종합 점수 15 이상
    uniqueUsers: 1,       // 최소 1명
  },
  alert: {
    totalScore: 40,       // 종합 점수 40 이상
    uniqueUsers: 2,       // 최소 2명
    savedCount: 3,        // 저장 3회 이상
  },
  action: {
    totalScore: 80,       // 종합 점수 80 이상
    dealInterestCount: 1, // 딜 관심 표명 1회 이상
    clusterSize: 5,       // 5명 이상 클러스터
  },
};

// ────────────────────────────────────────────────────────────
// 신호 집계 함수
// ────────────────────────────────────────────────────────────

function aggregateSignals(
  assetId: string,
  events: SignalEvent[],
  grade: Grade
): AssetSignalSummary {
  const assetEvents = events.filter(e => e.assetId === assetId);
  const uniqueUsers = new Set(assetEvents.map(e => e.userId)).size;
  const multiplier = GRADE_MULTIPLIER[grade];

  let savedCount = 0;
  let viewCount = 0;
  let repeatedViewCount = 0;
  let dealInterestCount = 0;
  let proUpgradeCount = 0;
  let totalSignalScore = 0;

  // 유저별 열람 횟수 추적 (반복 열람 감지)
  const viewCountPerUser: Record<string, number> = {};

  for (const event of assetEvents) {
    if (event.signalType === 'viewed') {
      viewCountPerUser[event.userId] =
        (viewCountPerUser[event.userId] || 0) + 1;
    }
  }

  for (const event of assetEvents) {
    const baseScore = SIGNAL_SCORE[event.signalType] * multiplier;

    switch (event.signalType) {
      case 'saved':
        savedCount++;
        totalSignalScore += baseScore;
        break;
      case 'viewed':
        viewCount++;
        totalSignalScore += baseScore;
        // 반복 열람이면 추가 점수
        if ((viewCountPerUser[event.userId] || 0) >= 2) {
          repeatedViewCount++;
          totalSignalScore += SIGNAL_SCORE['repeated_view'] * multiplier;
        }
        break;
      case 'repeated_view':
        repeatedViewCount++;
        totalSignalScore += baseScore;
        break;
      case 'deal_interest':
        dealInterestCount++;
        totalSignalScore += baseScore;
        break;
      case 'pro_upgrade':
        proUpgradeCount++;
        totalSignalScore += baseScore;
        break;
    }
  }

  const clusterDetected = uniqueUsers >= TRIGGER_THRESHOLDS.action.clusterSize;
  const lastSignalAt = assetEvents.length > 0
    ? new Date(Math.max(...assetEvents.map(e => e.timestamp.getTime())))
    : new Date();

  // 트리거 레벨 판단
  const triggerLevel = determineTriggerLevel({
    totalSignalScore,
    uniqueUsers,
    savedCount,
    dealInterestCount,
    clusterDetected,
  });

  // 권장 액션 결정
  const recommendedActions = determineActions(triggerLevel, dealInterestCount);

  // 우선순위 점수 (0~100 정규화)
  const priorityScore = Math.min(100, Math.round(totalSignalScore / 2));

  return {
    assetId,
    assetGrade: grade,
    totalSignalScore: Math.round(totalSignalScore),
    uniqueUsers,
    savedCount,
    viewCount,
    repeatedViewCount,
    dealInterestCount,
    proUpgradeCount,
    clusterDetected,
    triggerLevel,
    recommendedActions,
    priorityScore,
    lastSignalAt,
  };
}

// ────────────────────────────────────────────────────────────
// 트리거 레벨 판단
// ────────────────────────────────────────────────────────────

function determineTriggerLevel(params: {
  totalSignalScore: number;
  uniqueUsers: number;
  savedCount: number;
  dealInterestCount: number;
  clusterDetected: boolean;
}): TriggerLevel {
  const { totalSignalScore, uniqueUsers, savedCount,
          dealInterestCount, clusterDetected } = params;

  // Action: 딜 관심 표명 1회 이상 OR 클러스터 감지 OR 점수 80 이상
  if (
    dealInterestCount >= TRIGGER_THRESHOLDS.action.dealInterestCount ||
    clusterDetected ||
    totalSignalScore >= TRIGGER_THRESHOLDS.action.totalScore
  ) {
    return 'action';
  }

  // Alert: 점수 40 이상 AND 저장 3회 이상 AND 유저 2명 이상
  if (
    totalSignalScore >= TRIGGER_THRESHOLDS.alert.totalScore &&
    savedCount >= TRIGGER_THRESHOLDS.alert.savedCount &&
    uniqueUsers >= TRIGGER_THRESHOLDS.alert.uniqueUsers
  ) {
    return 'alert';
  }

  // Watch: 점수 15 이상
  if (totalSignalScore >= TRIGGER_THRESHOLDS.watch.totalScore) {
    return 'watch';
  }

  return 'none';
}

// ────────────────────────────────────────────────────────────
// 권장 액션 결정
// ────────────────────────────────────────────────────────────

function determineActions(
  triggerLevel: TriggerLevel,
  dealInterestCount: number
): ActionType[] {
  const actions: ActionType[] = [];

  switch (triggerLevel) {
    case 'action':
      actions.push('internal_alert');
      actions.push('owner_contact');
      if (dealInterestCount >= 1) actions.push('send_proposal');
      actions.push('cluster_report');
      break;
    case 'alert':
      actions.push('internal_alert');
      actions.push('send_proposal');
      break;
    case 'watch':
      actions.push('internal_alert');
      break;
    case 'none':
    default:
      break;
  }

  return actions;
}

// ────────────────────────────────────────────────────────────
// 유저별 관심 프로파일 생성
// ────────────────────────────────────────────────────────────

function buildUserProfiles(events: SignalEvent[]): UserInterestProfile[] {
  const userMap: Record<string, Map<string, {
    signals: SignalType[];
    score: number;
    lastActivityAt: Date;
  }>> = {};

  for (const event of events) {
    if (!userMap[event.userId]) {
      userMap[event.userId] = new Map();
    }

    const assetMap = userMap[event.userId];
    const existing = assetMap.get(event.assetId) || {
      signals: [],
      score: 0,
      lastActivityAt: event.timestamp,
    };

    existing.signals.push(event.signalType);
    existing.score += SIGNAL_SCORE[event.signalType];
    if (event.timestamp > existing.lastActivityAt) {
      existing.lastActivityAt = event.timestamp;
    }

    assetMap.set(event.assetId, existing);
  }

  return Object.entries(userMap).map(([userId, assetMap]) => {
    const interestedAssets = Array.from(assetMap.entries())
      .map(([assetId, data]) => ({
        assetId,
        signalScore: data.score,
        signals: data.signals,
        lastActivityAt: data.lastActivityAt,
      }))
      .sort((a, b) => b.signalScore - a.signalScore);

    const topAsset = interestedAssets[0];

    // 딜 제안 수신 자격: 딜 관심 표명 또는 신호 점수 30 이상
    const proposalEligible = interestedAssets.some(
      a =>
        a.signals.includes('deal_interest') ||
        a.signalScore >= 30
    );

    return {
      userId,
      interestedAssets,
      proposalEligible,
      topInterestAssetId: topAsset?.assetId || '',
    };
  });
}

// ────────────────────────────────────────────────────────────
// 딜 제안서 생성
// ────────────────────────────────────────────────────────────

function generateProposals(
  summaries: AssetSignalSummary[],
  userProfiles: UserInterestProfile[]
): DealProposal[] {
  const proposals: DealProposal[] = [];

  for (const profile of userProfiles) {
    if (!profile.proposalEligible) continue;

    for (const interest of profile.interestedAssets) {
      const summary = summaries.find(s => s.assetId === interest.assetId);
      if (!summary) continue;
      if (!summary.recommendedActions.includes('send_proposal')) continue;

      const hasDealInterest = interest.signals.includes('deal_interest');
      const proposalType = hasDealInterest
        ? 'joint_investment'
        : interest.signalScore >= 50
        ? 'asset_sale'
        : 'development_consignment';

      const triggerReason = hasDealInterest
        ? '딜 관심 표명 클릭'
        : `신호 점수 ${interest.signalScore}점 달성`;

      const messageTemplate = buildProposalMessage(
        interest.assetId,
        proposalType,
        summary.assetGrade
      );

      proposals.push({
        userId: profile.userId,
        assetId: interest.assetId,
        proposalType,
        triggerReason,
        generatedAt: new Date(),
        messageTemplate,
      });
    }
  }

  return proposals;
}

function buildProposalMessage(
  assetId: string,
  proposalType: DealProposal['proposalType'],
  grade: Grade
): string {
  const proposalLabel: Record<DealProposal['proposalType'], string> = {
    joint_investment: '공동투자',
    asset_sale: '자산 매각',
    development_consignment: '위탁 개발',
  };

  return `
안녕하세요.
Heritage Layer를 통해 관심을 보여주신 자산(ID: ${assetId})에 대해
THE LAYER의 직접 재생 제안을 드립니다.

해당 자산은 재생 가능성 ${grade}등급으로 평가되었으며,
THE LAYER가 ${proposalLabel[proposalType]} 방식의 협력을 제안드립니다.

자세한 사업 구조와 예상 수익률에 대해 미팅을 제안드립니다.
관심이 있으시면 아래 버튼을 통해 일정을 잡아주세요.
  `.trim();
}

// ────────────────────────────────────────────────────────────
// 클러스터 리포트 생성
// ────────────────────────────────────────────────────────────

function generateClusterReports(
  summaries: AssetSignalSummary[]
): ClusterReport[] {
  return summaries
    .filter(s => s.clusterDetected)
    .map(s => ({
      assetId: s.assetId,
      clusterSize: s.uniqueUsers,
      averageSignalScore: Math.round(s.totalSignalScore / s.uniqueUsers),
      userTypes: ['미분류'],   // 추후 유저 직군 데이터 연동 시 확장
      recommendedAction:
        `${s.uniqueUsers}명의 관심 클러스터 감지. ` +
        `자산 소유자 접촉 및 딜 구조화 즉시 검토 권장.`,
      generatedAt: new Date(),
    }));
}

// ────────────────────────────────────────────────────────────
// 내부 알림 생성
// ────────────────────────────────────────────────────────────

function generateInternalAlerts(
  summaries: AssetSignalSummary[]
): InternalAlert[] {
  return summaries
    .filter(s => s.triggerLevel === 'alert' || s.triggerLevel === 'action')
    .map(s => ({
      assetId: s.assetId,
      triggerLevel: s.triggerLevel,
      reason: s.triggerLevel === 'action'
        ? '즉시 액션 필요 — 딜 관심 표명 또는 클러스터 감지'
        : '딜 가능성 자산 — 유저 관심 집중',
      signalSummary:
        `저장 ${s.savedCount}회 | 열람 ${s.viewCount}회 | ` +
        `반복열람 ${s.repeatedViewCount}회 | ` +
        `딜관심 ${s.dealInterestCount}회 | ` +
        `관심유저 ${s.uniqueUsers}명 | ` +
        `종합점수 ${s.totalSignalScore}점`,
      createdAt: new Date(),
    }));
}

// ────────────────────────────────────────────────────────────
// 메인 함수 — 외부 호출 진입점
// ────────────────────────────────────────────────────────────

export function processDealSignals(
  events: SignalEvent[],
  assetGradeMap: Record<string, Grade>  // assetId → Grade
): DealSignalResult {

  // 자산별 신호 집계
  const assetIds = [...new Set(events.map(e => e.assetId))];
  const assetSummaries = assetIds.map(assetId =>
    aggregateSignals(
      assetId,
      events,
      assetGradeMap[assetId] || 'C'
    )
  );

  // 우선순위 정렬
  const topPriorityAssets = [...assetSummaries]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 10);  // 상위 10개

  // 유저 프로파일
  const userProfiles = buildUserProfiles(events);

  // 딜 제안서
  const proposalsToSend = generateProposals(assetSummaries, userProfiles);

  // 클러스터 리포트
  const clusterReports = generateClusterReports(assetSummaries);

  // 내부 알림
  const internalAlerts = generateInternalAlerts(assetSummaries);

  return {
    assetSummaries,
    topPriorityAssets,
    userProfiles,
    proposalsToSend,
    clusterReports,
    internalAlerts,
  };
}

// ────────────────────────────────────────────────────────────
// 단일 자산 신호 조회 (Analysis 페이지 실시간 연동용)
// ────────────────────────────────────────────────────────────

export function getAssetSignalStatus(
  assetId: string,
  events: SignalEvent[],
  grade: Grade
): AssetSignalSummary {
  return aggregateSignals(assetId, events, grade);
}

// ────────────────────────────────────────────────────────────
// Supabase 이벤트 저장용 헬퍼
// ────────────────────────────────────────────────────────────

export function createSignalEvent(
  userId: string,
  assetId: string,
  signalType: SignalType,
  metadata?: SignalEvent['metadata']
): SignalEvent {
  return {
    userId,
    assetId,
    signalType,
    timestamp: new Date(),
    metadata,
  };
}

// ────────────────────────────────────────────────────────────
// 사용 예시
// ────────────────────────────────────────────────────────────
//
// import { processDealSignals, createSignalEvent } from './deal-signal';
//
// // Supabase deal_signals 테이블에서 이벤트 조회 후 처리
// const events: SignalEvent[] = [
//   createSignalEvent('user-001', 'asset-abc', 'saved'),
//   createSignalEvent('user-001', 'asset-abc', 'viewed'),
//   createSignalEvent('user-002', 'asset-abc', 'viewed'),
//   createSignalEvent('user-002', 'asset-abc', 'deal_interest'),
//   createSignalEvent('user-003', 'asset-abc', 'saved'),
// ];
//
// const gradeMap = { 'asset-abc': 'A' as Grade };
//
// const result = processDealSignals(events, gradeMap);
//
// console.log(result.topPriorityAssets[0].triggerLevel);  // 'action'
// console.log(result.internalAlerts.length);              // 1
// console.log(result.proposalsToSend.length);             // 1
// console.log(result.clusterReports.length);              // 0 (5명 미만)
