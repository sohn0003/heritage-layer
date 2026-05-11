import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import GradeBadge from '@/components/common/GradeBadge';
import ProLockOverlay from '@/components/common/ProLockOverlay';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAlgorithmConfig } from '@/hooks/useAlgorithmConfig';
import { TrendingUp, FileText, BarChart3, Building2, School, Home, Factory, Building } from 'lucide-react';
import GradeMeter from '@/components/common/GradeMeter';
import RatioBar from '@/components/common/RatioBar';

// 알고리즘 모듈 연동
import {
  calculateScore,
  type AssetInput,
  type ScoreResult,
  type ZoningType,
} from '@/algorithm/scoring/scoring';
import {
  calculateIRRScenarios,
  type IRRInput,
  type IRRResult,
} from '@/algorithm/financial/irr-calculator';
import {
  getAssetSignalStatus,
  createSignalEvent,
  type AssetSignalSummary,
  type SignalEvent,
  type SignalType,
} from '@/algorithm/deal-signal/deal-signal';

// ─────────────────────────────────────────────
// DB assets row → scoring AssetInput 매핑
// DB에 없는 필드는 합리적인 기본값으로 채움
// ─────────────────────────────────────────────
const ZONING_MAP: Record<string, ZoningType> = {
  '일반상업': 'commercial_general',
  '근린상업': 'commercial_neighborhood',
  '중심상업': 'commercial_central',
  '준주거': 'semi_residential',
  '2종일반주거': 'residential_2nd',
  '3종일반주거': 'residential_3rd',
  '자연녹지': 'green_natural',
  '생산녹지': 'green_production',
  '1종일반주거': 'residential_1st',
  '준공업': 'semi_industrial',
  '보전녹지': 'green_conservation',
  '농림': 'agricultural',
  '자연환경보전': 'nature_conservation',
};

function mapZoning(zoning: string | null): ZoningType {
  if (!zoning) return 'residential_2nd';
  return ZONING_MAP[zoning] ?? (Object.values(ZONING_MAP).includes(zoning as ZoningType)
    ? (zoning as ZoningType)
    : 'residential_2nd');
}

function buildScoringInput(asset: any): AssetInput {
  const landArea = asset.land_area ?? 0;
  const currentBC = asset.building_coverage ?? 0;
  const currentFAR = asset.floor_area_ratio ?? 0;
  // 법정 한도가 DB에 없으므로 용도지역 기반의 기본값 사용
  const zoning = mapZoning(asset.zoning);
  const legalMaxBC = zoning.startsWith('commercial') ? 80 : zoning.startsWith('residential') ? 60 : 40;
  const legalMaxFAR = zoning.startsWith('commercial') ? 800 : zoning.startsWith('residential') ? 250 : 100;
  const currentFloorArea = (currentFAR / 100) * landArea;

  return {
    zoning,
    currentBuildingCoverage: currentBC,
    legalMaxBuildingCoverage: legalMaxBC,
    currentFloorAreaRatio: currentFAR,
    legalMaxFloorAreaRatio: legalMaxFAR,
    currentFloorArea,
    landArea,
    isPublicAsset: asset.ownership_type === 'public',
    isPrivateNegotiationPossible: !!asset.gov_cooperation,
    isCitizenProposalPossible: !!asset.gov_cooperation,
    hasNearbyConversionPrecedent: false,
    isMilitaryOrHeritagZone: false,
    isUrbanFacilityConflict: false,
    isWaterFrontEnvironmental: false,
    isPrivateLand: asset.ownership_type === 'private',
    zoningUpgradeFloorAreaGain: 'under_20',
    useChangeExpansion: 'minor',
    populationTrend: 'stable',
    commercialDensity: 'low',
    distanceToCenter: 3,
    idleYears: asset.idle_years ?? 0,
    historicalValue: 'ordinary',
    naturalScenery: 'ordinary_urban',
    buildingCondition: 'partial_reinforcement',
    preliminaryROI: 7,
    isUrbanRegenerationArea: !!asset.gov_cooperation,
    isAbandonedSchoolBudget: asset.asset_type === '폐교',
    isBalancedDevelopmentBudget: false,
  };
}

const AnalysisPage = () => {
  const [searchParams] = useSearchParams();
  const assetId = searchParams.get('id');
  const navigate = useNavigate();
  const { user, subscriptionTier } = useAuth();
  const isPro = subscriptionTier === 'pro';

  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assetId) {
      setLoading(false);
      return;
    }
    const fetchAsset = async () => {
      const { data } = await supabase.from('assets').select('*').eq('id', assetId).maybeSingle();
      setAsset(data);
      setLoading(false);
    };
    fetchAsset();
  }, [assetId]);

  // ✅ Supabase에서 가져온 자산 데이터를 calculateScore()에 입력
  const scoringResult: ScoreResult | null = useMemo(() => {
    if (!asset) return null;
    return calculateScore(buildScoringInput(asset));
  }, [asset]);

  // 알고리즘 기본값 (loan_rates, system_config 테이블에서 로드)
  const algoConfig = useAlgorithmConfig();

  // 분석 가정값 (DB에 없는 값은 합리적 기본값으로 채움)
  const analysisAssumptions = {
    buildingCondition: 'partial_reinforcement' as const,
    useTypeMix: [{ useType: 'cultural_complex' as const, ratio: 100 }] as [import('@/algorithm/financial/irr-calculator').UseTypeMix, ...import('@/algorithm/financial/irr-calculator').UseTypeMix[]],
    landValuePerSqm: 4_500_000, // 성북구 일반주거 평균 공시지가 가정
    loanRates: algoConfig.loanRates,
    equityRatio: algoConfig.equityRatio,
    projectYears: algoConfig.projectYears,
  };

  const scenarioComparison: IRRResult | null = useMemo(() => {
    if (!asset || !scoringResult) return null;
    const input: IRRInput = {
      scoringResult,
      buildingCondition: analysisAssumptions.buildingCondition,
      useTypeMix: analysisAssumptions.useTypeMix,
      landArea: asset.land_area ?? 0,
      landValuePerSqm: analysisAssumptions.landValuePerSqm,
      legalMaxFloorAreaRatio: asset.legal_max_floor_area_ratio ?? asset.floor_area_ratio ?? 200,
      zoningUpgradeGain: (asset.zoning_upgrade_gain as any) ?? 'under_20',
      loanRates: analysisAssumptions.loanRates,
      equityRatio: analysisAssumptions.equityRatio,
      projectYears: analysisAssumptions.projectYears,
      isGovernmentSupported: !!asset.gov_cooperation,
      residualValueRatio: algoConfig.residualValueRatio,
    };
    return calculateIRRScenarios(input);
  }, [asset, scoringResult, algoConfig.loanRates.pf, algoConfig.loanRates.collateral, algoConfig.equityRatio, algoConfig.projectYears, algoConfig.residualValueRatio]);

  const [signalEvents, setSignalEvents] = useState<SignalEvent[]>([]);

  // 현재 자산에 대한 사용자 신호 이벤트 조회
  const fetchSignals = async () => {
    if (!assetId || !user) {
      setSignalEvents([]);
      return;
    }
    const { data } = await supabase
      .from('deal_signals')
      .select('*')
      .eq('asset_id', assetId);
    if (data) {
      setSignalEvents(
        data.map((row: any) =>
          createSignalEvent(row.user_id, row.asset_id, row.signal_type as SignalType, undefined),
        ).map((ev, i) => ({ ...ev, timestamp: new Date(data[i].created_at) })),
      );
    }
  };

  // 자산 열람 시 'viewed' 신호 자동 기록
  useEffect(() => {
    if (!assetId || !user) return;
    (async () => {
      await supabase.from('deal_signals').insert({
        user_id: user.id,
        asset_id: assetId,
        signal_type: 'viewed',
      });
      fetchSignals();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId, user?.id]);

  // 신호 집계 결과
  const signalSummary: AssetSignalSummary | null = useMemo(() => {
    if (!asset || !scoringResult) return null;
    return getAssetSignalStatus(asset.id, signalEvents, scoringResult.grade);
  }, [asset, scoringResult, signalEvents]);

  const handleDealInterest = async () => {
    if (!user) return;
    const { error } = await supabase.from('deal_signals').insert({
      user_id: user.id,
      asset_id: assetId!,
      signal_type: 'deal_interest',
    });
    if (error) {
      toast({ title: '오류', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '딜 관심이 등록되었습니다' });
      fetchSignals();
    }
  };

  const handleSaveAsset = async () => {
    if (!user || !assetId) return;
    const { error: saveError } = await supabase
      .from('saved_assets')
      .insert({ user_id: user.id, asset_id: assetId })
      .select()
      .maybeSingle();
    await supabase.from('deal_signals').insert({
      user_id: user.id,
      asset_id: assetId,
      signal_type: 'saved',
    });
    if (saveError && !saveError.message.includes('duplicate')) {
      toast({ title: '저장 오류', description: saveError.message, variant: 'destructive' });
    } else {
      toast({ title: '자산이 저장되었습니다' });
      fetchSignals();
    }
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">로딩 중...</div>;
  }

  if (!assetId || !asset) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">자산을 선택해주세요</p>
        <Button onClick={() => navigate('/properties')}>자산 탐색하기</Button>
      </div>
    );
  }

  const formatNumber = (n: number) => (n ? n.toLocaleString() : '--');
  const formatPercent = (n: number) => (n ? `${n.toFixed(1)}%` : '--');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            {scoringResult && <GradeBadge grade={scoringResult.grade} className="h-9 w-9 text-sm" />}
            <Badge variant="secondary">{asset.asset_type}</Badge>
            {scoringResult && (
              <Badge variant="outline">종합 {scoringResult.totalScore}점</Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold">{asset.address}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            방치 기간: {asset.idle_years ?? '-'}년 · 소유: {asset.ownership_type === 'public' ? '공유/국유' : asset.ownership_type === 'private' ? '사유' : '-'}
            {asset.latitude && asset.longitude && (
              <> · 좌표: {Number(asset.latitude).toFixed(4)}, {Number(asset.longitude).toFixed(4)}</>
            )}
          </p>
        </div>
      </div>

      {/* 분석 가정 안내 */}
      {isPro && (
        <Card className="mb-6 border-dashed bg-muted/30">
          <CardContent className="p-4 text-xs text-muted-foreground">
            <strong className="text-foreground">분석 가정:</strong>{' '}
            전환 용도 <span className="text-foreground">복합문화시설</span> · 건물 상태{' '}
            <span className="text-foreground">부분 보강</span> · 공시지가{' '}
            <span className="text-foreground">{(analysisAssumptions.landValuePerSqm).toLocaleString()}원/㎡</span> ·
            자기자본 {analysisAssumptions.equityRatio}% · 운영 {analysisAssumptions.projectYears}년 · PF{' '}
            {analysisAssumptions.loanRates.pf}% / 담보 {analysisAssumptions.loanRates.collateral}%
          </CardContent>
        </Card>
      )}

      {/* Free section — 기본 자산 정보 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: '재생 등급', value: scoringResult?.grade ?? asset.grade ?? '-' },
          { label: '용도지역', value: asset.zoning ?? '-' },
          { label: '건폐율', value: asset.building_coverage ? `${asset.building_coverage}%` : '-' },
          { label: '용적률', value: asset.floor_area_ratio ? `${asset.floor_area_ratio}%` : '-' },
          { label: '대지면적', value: asset.land_area ? `${asset.land_area.toLocaleString()}㎡` : '-' },
          { label: '정부협력', value: asset.gov_cooperation ? '가능' : '불가' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-lg font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* COSMO-P 블록별 스코어 (Free) */}
      {scoringResult && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">COSMO-P 블록별 점수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: 'A. 입지·규제 (25%)', value: scoringResult.blockA },
                { label: 'B. 수요·환경 (25%)', value: scoringResult.blockB },
                { label: 'C. 심미적 가치 (20%)', value: scoringResult.blockC },
                { label: 'D. 사업성 (30%)', value: scoringResult.blockD },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-2xl font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 세부 점수 항목 (Free) */}
      {scoringResult && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">세부 항목 점수</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>항목</TableHead>
                  <TableHead className="text-right">점수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { label: 'A1. 용도지역', value: scoringResult.detail.a1_zoning },
                  { label: 'A2. 개발 여력', value: scoringResult.detail.a2_developmentCapacity.toFixed(1) },
                  { label: 'A3. 인허가 조정', value: scoringResult.detail.a3_permitAdjustment },
                  { label: 'A4. 종상향 조정', value: scoringResult.detail.a4_zoningUpgradeAdjustment },
                  { label: 'B1. 인구·상권', value: scoringResult.detail.b1_populationCommercial },
                  { label: 'B2. 교통 접근성', value: scoringResult.detail.b2_transportation },
                  { label: 'B3. 방치 기간', value: scoringResult.detail.b3_idleYearsAdjustment },
                  { label: 'C1. 역사·건축', value: scoringResult.detail.c1_historicalArchitectural },
                  { label: 'C2. 자연경관', value: scoringResult.detail.c2_naturalScenery },
                  { label: 'D1. 건물 상태', value: scoringResult.detail.d1_buildingCondition },
                  { label: 'D2. 수익성', value: scoringResult.detail.d2_profitability },
                  { label: 'D3. 정부 지원', value: scoringResult.detail.d3_governmentSupport },
                  { label: '추가 개발 가능 연면적 (㎡)', value: scoringResult.detail.additionalFloorArea.toLocaleString() },
                  { label: '종상향 후 최대 연면적 (㎡)', value: scoringResult.detail.maxFloorAreaAfterUpgrade.toLocaleString() },
                  { label: '건폐율 사용률 (%)', value: scoringResult.detail.buildingCoverageUsageRate },
                  { label: '용적률 사용률 (%)', value: scoringResult.detail.floorAreaRatioUsageRate },
                ].map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pro Sections */}
      <div className="space-y-6">
        {/* Section 1 — 재생 시나리오 (placeholder) */}
        <ProLockOverlay locked={!isPro}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-accent" /> 재생 방향성 시나리오
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { title: '복합문화공간', description: '문화·체험형 복합공간 운영안', confidence: 'medium' as const },
                  { title: '코워킹 허브', description: '지역 창업·업무 거점화', confidence: 'medium' as const },
                  { title: '로컬 관광시설', description: '숙박·체험 결합형 운영', confidence: 'medium' as const },
                ].map((scenario) => (
                  <Card key={scenario.title} className="bg-muted/50">
                    <CardContent className="p-4">
                      <h4 className="font-medium">{scenario.title}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{scenario.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">신뢰도: 보통</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </ProLockOverlay>

        {/* Section 2 — 재무 수익성 */}
        <ProLockOverlay locked={!isPro}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-accent" /> 재무 수익성 지표
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>지표</TableHead>
                    <TableHead>값</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { label: 'IRR', value: formatPercent(scenarioComparison?.base.irr ?? 0) },
                    { label: 'DSCR', value: scenarioComparison?.base.dscr ? scenarioComparison.base.dscr.toFixed(2) : '--' },
                    { label: '투자회수기간', value: scenarioComparison?.base.paybackYears ? `${scenarioComparison.base.paybackYears}년` : '--' },
                    { label: '예상 매출', value: `${formatNumber(scenarioComparison?.base.annualRevenue ?? 0)}원` },
                    { label: '영업이익', value: `${formatNumber(scenarioComparison?.base.annualOperatingProfit ?? 0)}원` },
                  ].map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="text-muted-foreground">{row.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </ProLockOverlay>

        {/* Section 3 — 시나리오 비교표 */}
        <ProLockOverlay locked={!isPro}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-accent" /> 시나리오 비교표
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>항목</TableHead>
                    <TableHead>보수적</TableHead>
                    <TableHead>기본</TableHead>
                    <TableHead>낙관적</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      label: 'IRR',
                      c: formatPercent(scenarioComparison?.conservative.irr ?? 0),
                      b: formatPercent(scenarioComparison?.base.irr ?? 0),
                      o: formatPercent(scenarioComparison?.optimistic.irr ?? 0),
                    },
                    {
                      label: '예상 매출',
                      c: `${formatNumber(scenarioComparison?.conservative.annualRevenue ?? 0)}원`,
                      b: `${formatNumber(scenarioComparison?.base.annualRevenue ?? 0)}원`,
                      o: `${formatNumber(scenarioComparison?.optimistic.annualRevenue ?? 0)}원`,
                    },
                    {
                      label: 'ROI',
                      c: formatPercent(scenarioComparison?.conservative.roi ?? 0),
                      b: formatPercent(scenarioComparison?.base.roi ?? 0),
                      o: formatPercent(scenarioComparison?.optimistic.roi ?? 0),
                    },
                    {
                      label: '회수기간',
                      c: scenarioComparison?.conservative.paybackYears ? `${scenarioComparison.conservative.paybackYears}년` : '--',
                      b: scenarioComparison?.base.paybackYears ? `${scenarioComparison.base.paybackYears}년` : '--',
                      o: scenarioComparison?.optimistic.paybackYears ? `${scenarioComparison.optimistic.paybackYears}년` : '--',
                    },
                  ].map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell>{row.c}</TableCell>
                      <TableCell>{row.b}</TableCell>
                      <TableCell>{row.o}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </ProLockOverlay>

        {/* Section 4 — 딜 시그널 현황 */}
        <ProLockOverlay locked={!isPro}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-accent" /> 딜 시그널 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {signalSummary ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs">종합 신호 점수</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">{signalSummary.totalSignalScore}</p>
                    </div>
                    <div>
                      <p className="text-xs">관심 유저 수</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">{signalSummary.uniqueUsers}명</p>
                    </div>
                    <div>
                      <p className="text-xs">저장 / 열람 / 반복열람</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {signalSummary.savedCount} / {signalSummary.viewCount} / {signalSummary.repeatedViewCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs">딜 관심 표명</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">{signalSummary.dealInterestCount}회</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Badge
                      variant={
                        signalSummary.triggerLevel === 'action'
                          ? 'default'
                          : signalSummary.triggerLevel === 'alert'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      트리거: {
                        signalSummary.triggerLevel === 'action' ? '즉시 액션'
                        : signalSummary.triggerLevel === 'alert' ? '내부 알림'
                        : signalSummary.triggerLevel === 'watch' ? '관심 수집'
                        : '대기'
                      }
                    </Badge>
                    <Badge variant="outline">우선순위 {signalSummary.priorityScore}/100</Badge>
                    {signalSummary.clusterDetected && (
                      <Badge variant="default">클러스터 감지</Badge>
                    )}
                  </div>
                  {signalSummary.recommendedActions.length > 0 && (
                    <div>
                      <strong className="text-foreground">권장 액션:</strong>
                      <ul className="mt-1 list-disc pl-5">
                        {signalSummary.recommendedActions.map((a) => (
                          <li key={a}>
                            {a === 'send_proposal' && '딜 제안서 발송'}
                            {a === 'internal_alert' && '내부 딜팀 알림'}
                            {a === 'owner_contact' && '자산 소유자 접촉'}
                            {a === 'cluster_report' && '클러스터 리포트 생성'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p>신호 데이터를 불러오는 중...</p>
              )}
            </CardContent>
          </Card>
        </ProLockOverlay>
      </div>

      {/* Bottom buttons */}
      <div className="mt-8 flex flex-wrap gap-3">
        {user && (
          <Button variant="outline" onClick={handleSaveAsset}>자산 저장</Button>
        )}
        {isPro && user && (
          <Button onClick={handleDealInterest}>딜 관심 표명</Button>
        )}
        {!isPro && (
          <Button onClick={() => navigate('/pricing')}>Pro 구독 시작하기</Button>
        )}
        <Button variant="outline" onClick={() => navigate('/properties')}>
          목록으로 돌아가기
        </Button>
      </div>
    </div>
  );
};

export default AnalysisPage;
