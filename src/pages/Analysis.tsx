import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAlgorithmConfig } from '@/hooks/useAlgorithmConfig';
import { getScoreReasons, type ScoreReasonKey } from '@/lib/scoreReasons';
import {
  TrendingUp, FileText, BarChart3, Building2, School, Home, Factory, Building,
  CheckCircle2, AlertTriangle, Sparkles, ShieldAlert, Info,
} from 'lucide-react';
import Seo from '@/components/common/Seo';
import GradeMeter from '@/components/common/GradeMeter';
import RatioBar from '@/components/common/RatioBar';
import AuthModal from '@/components/common/AuthModal';

// 알고리즘 모듈 연동
import { type ScoreResult } from '@/algorithm/scoring/scoring';
import {
  analyzeAsset,
  type AnalyzeAssetResult,
} from '@/algorithm/financial/irr-calculator';
import {
  getAssetSignalStatus,
  createSignalEvent,
  type AssetSignalSummary,
  type SignalEvent,
  type SignalType,
} from '@/algorithm/deal-signal/deal-signal';
import { buildScoringInput } from '@/lib/assetScoring';

// 원 → 억원 변환 (소수 1자리)
const toEokwon = (won: number | null | undefined): string => {
  if (won == null || !Number.isFinite(won)) return '--';
  return `${(won / 100_000_000).toFixed(1)}억`;
};
const formatPercent = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n) ? '--' : `${n.toFixed(1)}%`;
const formatNumber = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n) ? '--' : Math.round(n).toLocaleString();

const AnalysisPage = () => {
  const [searchParams] = useSearchParams();
  const assetId = searchParams.get('id');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  // 상세 분석 열람은 로그인 회원 전용 (무료)

  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  // 탭(시나리오)별 오버라이드 — undefined면 추천값/기본값 사용
  const [equityByRank, setEquityByRank] = useState<Record<number, number | undefined>>({});
  const [presaleByRank, setPresaleByRank] = useState<Record<number, number>>({});       // 0~100 (%)
  const [revenueByRank, setRevenueByRank] = useState<Record<number, number | undefined>>({}); // 원
  const [marginByRank, setMarginByRank] = useState<Record<number, number | undefined>>({});   // 10~70 (%)
  const [presalePriceByRank, setPresalePriceByRank] = useState<Record<number, number | undefined>>({}); // 평당 분양가격(천만원 단위)
  const [usedFloorAreaByRank, setUsedFloorAreaByRank] = useState<Record<number, number | undefined>>({}); // 사용 연면적(㎡) — 미입력 시 최대 허용 연면적
  const [activeTab, setActiveTab] = useState<'1' | '2' | '3'>('1');

  const algoConfig = useAlgorithmConfig();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    if (!assetId) { setLoading(false); return; }
    const fetchAsset = async () => {
      const { data } = await supabase.from('assets_public').select('*').eq('id', assetId).maybeSingle();
      setAsset(data);
      setLoading(false);
    };
    fetchAsset();
  }, [assetId, user, authLoading]);

  // 자산 변경 시 오버라이드 초기화
  useEffect(() => {
    setEquityByRank({});
    setPresaleByRank({});
    setRevenueByRank({});
    setMarginByRank({});
    setPresalePriceByRank({});
    setUsedFloorAreaByRank({});
  }, [assetId]);

  // 매도자 희망가 → 토지 취득단가 우선 적용 (없으면 공시지가 폴백)
  const askingLandPrice = (asset as unknown as { asking_land_price?: number | null })?.asking_land_price ?? null;
  const askingBuildingPrice = (asset as unknown as { asking_building_price?: number | null })?.asking_building_price ?? null;
  const effectiveLandValuePerSqm = useMemo(() => {
    if (!asset) return 4_500_000;
    if (askingLandPrice && asset.land_area && asset.land_area > 0) {
      return askingLandPrice / asset.land_area;
    }
    return asset.land_value_per_sqm ?? 4_500_000;
  }, [asset, askingLandPrice]);

  // 기본 분석(오버라이드 없음) — 스코어링/추천 시나리오/추천 자기자본비율의 기준값
  const analysis: AnalyzeAssetResult | null = useMemo(() => {
    if (!asset) return null;
    const { preliminaryROI, ...assetInputBase } = buildScoringInput(asset);
    void preliminaryROI;
    try {
      return analyzeAsset({
        assetInput: assetInputBase,
        landValuePerSqm: effectiveLandValuePerSqm,
        loanRates: algoConfig.loanRates,
        projectYears: algoConfig.projectYears,
        residualValueRatio: algoConfig.residualValueRatio,
      });
    } catch (e) {
      console.error('analyzeAsset 실패', e);
      return null;
    }
  }, [
    asset,
    effectiveLandValuePerSqm,
    algoConfig.loanRates.pf,
    algoConfig.loanRates.collateral,
    algoConfig.projectYears,
    algoConfig.residualValueRatio,
  ]);

  const scoringResult: ScoreResult | null = analysis?.scoring ?? null;
  const baseScenarios = analysis?.recommendation.scenarios;

  const scoreReasons = useMemo(() => {
    if (!asset || !scoringResult) return null;
    try {
      const input = buildScoringInput(asset);
      return getScoreReasons(input, scoringResult.detail);
    } catch (e) {
      console.error('getScoreReasons 실패', e);
      return null;
    }
  }, [asset, scoringResult]);

  // 시나리오별 슬라이더 값을 적용한 표시용 시나리오 — 오버라이드된 IRR/DSCR/자기자본 등 반영
  const displayScenarios = useMemo(() => {
    if (!asset || !baseScenarios) return baseScenarios;
    const { preliminaryROI, ...assetInputBase } = buildScoringInput(asset);
    void preliminaryROI;
    return baseScenarios.map((base) => {
      const eqOverride = equityByRank[base.rank];
      const revOverride = revenueByRank[base.rank];
      const marOverride = marginByRank[base.rank];
      const eqChanged = eqOverride !== undefined && eqOverride !== base.recommendedEquityRatio;
      const revChanged = revOverride !== undefined && revOverride > 0;
      const marChanged = marOverride !== undefined;
      if (!eqChanged && !revChanged && !marChanged) return base;
      try {
        const r = analyzeAsset({
          assetInput: assetInputBase,
          landValuePerSqm: effectiveLandValuePerSqm,
          loanRates: algoConfig.loanRates,
          projectYears: algoConfig.projectYears,
          residualValueRatio: algoConfig.residualValueRatio,
          overrideEquityRatio: eqChanged ? eqOverride : undefined,
          overrideAnnualRevenue: revChanged ? revOverride : undefined,
          overrideOperatingMargin: marChanged ? (marOverride as number) / 100 : undefined,
        });
        return r.recommendation.scenarios.find((x) => x.rank === base.rank) ?? base;
      } catch (e) {
        console.error('analyzeAsset 오버라이드 실패', e);
        return base;
      }
    });
  }, [
    asset,
    baseScenarios,
    equityByRank,
    revenueByRank,
    marginByRank,
    algoConfig.loanRates.pf,
    algoConfig.loanRates.collateral,
    algoConfig.projectYears,
    algoConfig.residualValueRatio,
  ]);

  const scenarios = displayScenarios;
  const activeScenario = scenarios?.find((s) => String(s.rank) === activeTab) ?? scenarios?.[0];


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
      toast({
        title: '관심 상담이 신청되었습니다',
        description: '담당자가 순차적으로 안내 연락을 드리겠습니다.',
      });
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

  if (authLoading || loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">로딩 중...</div>;
  }
  if (!user) {
    return (
      <>
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
          <ShieldAlert className="h-10 w-10 text-accent" />
          <h1 className="text-xl font-semibold">회원 전용 콘텐츠</h1>
          <p className="text-sm text-muted-foreground">
            상세 분석은 회원가입 후 무료로 이용하실 수 있습니다. 로그인 또는 회원가입 후 다시 시도해주세요.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => setAuthOpen(true)}>로그인 / 회원가입</Button>
            <Button variant="outline" onClick={() => navigate('/properties')}>자산 목록</Button>
          </div>
        </div>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      </>
    );
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

  const ASSET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    '폐교': School, '빈집': Home, '유휴공공시설': Building2, '폐산업시설': Factory, '기타': Building,
  };
  const AssetIcon = ASSET_ICONS[asset.asset_type] ?? Building;

  return (
    <div className="pt-16">
      <Seo
        title="자산 분석 — Heritage Layer"
        description="입지·법규·수익성 시나리오를 데이터 기반으로 분석하는 Heritage Layer 분석 도구."
        path="/analysis"
      />
      {/* 자산 핵심 정보 헤더 (스크롤 시 함께 이동) */}
      <div className="border-b bg-background">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-foreground">
                  <AssetIcon className="h-5 w-5" />
                </span>
                <Badge variant="secondary">{asset.asset_type}</Badge>
                {asset.gov_cooperation && (
                  <Badge variant="outline" className="border-[hsl(var(--accent))] text-[hsl(var(--accent))]">정부협력</Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold leading-tight">{asset.address}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span>방치 기간: {asset.idle_years ?? '-'}년</span>
                <span>·</span>
                <span>소유: {asset.ownership_type === 'public' ? '공유/국유' : asset.ownership_type === 'private' ? '사유' : (asset.ownership_type ?? '-')}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  활용 상태:
                  {(() => {
                    const s = asset.utilization_status ?? 'unutilized';
                    const map: Record<string, { label: string; cls: string }> = {
                      unutilized: { label: '미활용', cls: 'border-muted-foreground/30 text-muted-foreground' },
                      in_discussion: { label: '협의 중', cls: 'border-[hsl(var(--accent))] text-[hsl(var(--accent))]' },
                      utilized: { label: '활용 중', cls: 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]' },
                    };
                    const v = map[s] ?? map.unutilized;
                    return <Badge variant="outline" className={v.cls}>{v.label}</Badge>;
                  })()}
                </span>
              </div>
            </div>
            {/* 우측 상단 등급 계기판 */}
            {scoringResult && (
              <GradeMeter grade={scoringResult.grade} totalScore={scoringResult.totalScore} size={170} />
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
      {/* 분석 가정 안내 */}
      {true && (
        <Card className="mb-6 border-dashed bg-muted/30">
          <CardContent className="p-4 text-xs text-muted-foreground">
            <strong className="text-foreground">분석 가정:</strong>{' '}
            공시지가{' '}
            <span className="text-foreground">
              {(asset.land_value_per_sqm ?? 4_500_000).toLocaleString()}원/㎡
            </span>{' '}
            · 운영 {algoConfig.projectYears}년 · 잔존가치{' '}
            {(algoConfig.residualValueRatio * 100).toFixed(0)}% · PF{' '}
            {algoConfig.loanRates.pf}% / 담보 {algoConfig.loanRates.collateral}%
          </CardContent>
        </Card>
      )}

      {/* 건폐율 / 용적률 — 법정 한도 대비 시각화 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">건폐율 / 용적률</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <RatioBar
            label="건폐율"
            current={asset.current_building_coverage ?? asset.building_coverage}
            legalMax={asset.legal_max_building_coverage}
          />
          <RatioBar
            label="용적률"
            current={asset.current_floor_area_ratio ?? asset.floor_area_ratio}
            legalMax={asset.legal_max_floor_area_ratio}
          />
        </CardContent>
      </Card>

      {/* Free section — 기본 자산 정보 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: '용도지역', value: asset.zoning ?? '-' },
          { label: '대지면적', value: asset.land_area ? `${asset.land_area.toLocaleString()}㎡` : '-' },
          { label: '연면적', value: asset.current_floor_area ? `${asset.current_floor_area.toLocaleString()}㎡` : '-' },
          { label: '공시지가', value: asset.land_value_per_sqm ? `${asset.land_value_per_sqm.toLocaleString()}원/㎡` : '-' },
          { label: '인구 추이', value: asset.population_trend ?? '-' },
          { label: '건물 상태', value: asset.building_condition ?? '-' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-lg font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 예상 자산 매도가 (Free) */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">예상 자산 매도가</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">토지 매도가 (매도자 희망)</p>
              <p className="mt-1 text-xl font-semibold">
                {((askingLandPrice ?? 0) / 1_0000_0000).toLocaleString(undefined, { maximumFractionDigits: 2 })}억원
              </p>
            </div>
            <div className="rounded-md border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">건물 매도가 (매도자 희망)</p>
              <p className="mt-1 text-xl font-semibold">
                {((askingBuildingPrice ?? 0) / 1_0000_0000).toLocaleString(undefined, { maximumFractionDigits: 2 })}억원
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            * 가격이 없는 경우 매도자 미제시, 공시지가 기준 적용
          </p>
        </CardContent>
      </Card>

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

      {/* 자산 강점·리스크 요약 (Free) */}
      {analysis && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">자산 강점 · 리스크 요약</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[hsl(var(--primary))]">
                <Sparkles className="h-4 w-4" /> 핵심 강점
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.recommendation.assetSummary.keyStrengths.length === 0 ? (
                  <span className="text-xs text-muted-foreground">두드러진 강점 없음</span>
                ) : (
                  analysis.recommendation.assetSummary.keyStrengths.map((s, i) => (
                    <Badge key={i} variant="outline" className="border-[hsl(var(--primary))] bg-[hsl(var(--primary)_/_0.08)] text-[hsl(var(--primary))] dark:bg-[hsl(var(--primary)_/_0.15)] dark:border-[hsl(var(--primary))]">
                      {s}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[hsl(var(--accent))]">
                <ShieldAlert className="h-4 w-4" /> 주요 리스크
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.recommendation.assetSummary.keyRisks.length === 0 ? (
                  <span className="text-xs text-muted-foreground">특이 리스크 없음</span>
                ) : (
                  analysis.recommendation.assetSummary.keyRisks.map((s, i) => (
                    <Badge key={i} variant="outline" className="border-[hsl(var(--accent))] bg-[hsl(var(--accent)_/_0.08)] text-[hsl(var(--accent))] dark:bg-[hsl(var(--accent)_/_0.15)] dark:border-[hsl(var(--accent))]">
                      {s}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 세부 점수 항목 */}
      {scoringResult && (
        <div className="mb-8">
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">세부 항목 점수</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-muted-foreground">각 항목의 i 아이콘을 클릭하면 산출 기준과 의미가 표시됩니다.</p>
                <div className="w-full divide-y divide-border">
                  {[
                    {
                      label: 'A1. 용도지역',
                      key: 'a1_zoning',
                      value: scoringResult.detail.a1_zoning,
                      short: '용도지역의 활용 폭 평가',
                      desc: '대지의 용도지역(주거·상업·공업·녹지 등)을 평가합니다. 상업지·준주거지처럼 활용 폭이 넓을수록 높은 점수가 부여되며, 보전녹지·자연환경보전지역은 개발 제약으로 점수가 낮아집니다.\n\n이 점수는 향후 가능한 사업 유형(숙박·오피스·복합시설 등)의 범위를 결정하는 1차 필터입니다.',
                    },
                    {
                      label: 'A2. 개발 여력',
                      key: 'a2_developmentCapacity',
                      value: scoringResult.detail.a2_developmentCapacity.toFixed(1),
                      short: '추가 건축 가능 연면적',
                      desc: '현재 건폐율·용적률과 법정 최대치 사이의 차이를 계산해, 추가로 지을 수 있는 연면적이 얼마나 남아 있는지 평가합니다. 여력이 클수록 증축·재건축으로 사업성을 끌어올릴 여지가 큽니다.\n\n저활용 자산일수록 이 점수가 높게 산출되어 재생 잠재력이 크다는 신호가 됩니다.',
                    },
                    {
                      label: 'A3. 인허가 조정',
                      key: 'a3_permitAdjustment',
                      value: scoringResult.detail.a3_permitAdjustment,
                      short: '규제·제도 가감점',
                      desc: '환경청 인가, 군사·문화재 구역, 도시계획시설 저촉 등 인허가 리스크 요인을 가감점으로 반영합니다. 규제 충돌이 많을수록 음(-) 조정이 들어갑니다.\n\n반대로 도시재생 활성화 지역·균형발전 예산 대상 등 우호적 제도권에 속한 자산은 양(+) 조정으로 가점이 부여됩니다.',
                    },
                    {
                      label: 'A4. 종상향 조정',
                      key: 'a4_zoningUpgradeAdjustment',
                      value: scoringResult.detail.a4_zoningUpgradeAdjustment,
                      short: '용도지역 상향 시 가점',
                      desc: '용도지역을 한 단계 상향(종상향)했을 때 추가로 확보 가능한 용적률을 가점으로 반영합니다. 50% 이상 추가 가능한 자산은 큰 폭의 가점, 종상향이 불가한 자산은 가점이 없습니다.\n\n실현되면 사업 규모를 비약적으로 키울 수 있는 잠재 옵션입니다.',
                    },
                    {
                      label: 'B1. 인구·상권',
                      key: 'b1_populationCommercial',
                      value: scoringResult.detail.b1_populationCommercial,
                      short: '수요 기반 평가',
                      desc: '주변 인구 추이(증가/유지/감소/소멸위험)와 상권 밀도를 결합해 수요 기반을 평가합니다. 인구가 늘고 상권이 두꺼울수록 임대·운영 안정성이 높습니다.\n\n소멸위험 지역이라도 관광·웰니스 등 외부 유입형 컨셉으로 보완 가능한지를 함께 고려합니다.',
                    },
                    {
                      label: 'B2. 교통 접근성',
                      key: 'b2_transportation',
                      value: scoringResult.detail.b2_transportation,
                      short: '도심까지의 거리 기반',
                      desc: '도심까지의 거리(km)를 기준으로 접근성을 평가합니다. 도심 인접 자산은 일반 임대·복합시설에 유리하고, 원거리 자산은 체류형·관광형 컨셉에 유리합니다.\n\n거리만이 아니라, 거리 대비 어떤 사업 컨셉이 적합한지를 시나리오 추천에 반영합니다.',
                    },
                    {
                      label: 'B3. 방치 기간',
                      key: 'b3_idleYearsAdjustment',
                      value: scoringResult.detail.b3_idleYearsAdjustment,
                      short: '방치 연수 가감점',
                      desc: '얼마나 오랫동안 방치되었는지를 가감점으로 반영합니다. 방치 기간이 길수록 건물 노후·민원 누적 등 음(-) 조정이 적용됩니다.\n\n동시에 정책적 처분 우선순위가 높아져 사업 추진 속도 측면에서는 양(+)으로 작용할 수 있습니다.',
                    },
                    {
                      label: 'C1. 역사·건축',
                      key: 'c1_historicalArchitectural',
                      value: scoringResult.detail.c1_historicalArchitectural,
                      short: '문화재·상징성·예술성',
                      desc: '등록문화재·근대건축 유산, 지역 상징성, 건축예술적 특성 등을 평가합니다. 역사·건축적 가치가 높을수록 브랜딩과 스토리텔링에 유리하고 프리미엄 가격대를 형성할 수 있습니다.\n\n다만 보전 의무로 인해 개발 자유도가 낮아질 수 있어, 시나리오 추천에서 리모델링 비중이 높아지는 경향이 있습니다.',
                    },
                    {
                      label: 'C2. 자연경관',
                      key: 'c2_naturalScenery',
                      value: scoringResult.detail.c2_naturalScenery,
                      short: '산·바다·강 조망 가치',
                      desc: '산·바다·강·호수 조망 가능 여부와 인접 자연경관 수준을 평가합니다. 경관 자산은 숙박·웰니스·리조트 컨셉에서 핵심 가치로 작동합니다.\n\n경관 저해 요소(인접 시설·시야 가림)가 있는 경우 음(-) 조정이 적용됩니다.',
                    },
                    {
                      label: 'D1. 건물 상태',
                      key: 'd1_buildingCondition',
                      value: scoringResult.detail.d1_buildingCondition,
                      short: '리모델링·철거 여부',
                      desc: '리모델링 가능·일부 보강·대수선 필요·전면 철거 등 4단계로 건물 컨디션을 평가합니다. 상태가 좋을수록 초기 투입비가 줄어 IRR이 개선됩니다.\n\n전면 철거가 필요한 자산은 신축 사업으로 전환되어 자본 규모와 일정이 달라집니다.',
                    },
                    {
                      label: 'D2. 수익성',
                      key: 'd2_profitability',
                      value: scoringResult.detail.d2_profitability,
                      short: '예비 ROI 1차 평가',
                      desc: '예비 ROI(공시지가·연면적·예상 단가 기반의 1차 추정 수익률)를 점수화한 항목입니다. 본격적인 IRR 분석에 앞서 자산이 사업성 검토 대상인지 빠르게 판별합니다.\n\n실제 IRR은 시나리오·금융구조에 따라 달라지므로 이 점수는 1차 스크리닝 용도로만 사용됩니다.',
                    },
                    {
                      label: 'D3. 정부 지원',
                      key: 'd3_governmentSupport',
                      value: scoringResult.detail.d3_governmentSupport,
                      short: '보조금·예산 지원 여부',
                      desc: '도시재생·폐교활용·균형발전 등 정부·지자체 보조금/예산 지원 대상 여부를 평가합니다. 지원 대상이면 자기자본 부담이 줄어들어 사업 실행 가능성이 크게 올라갑니다.\n\n동시에 공공성 요건이 부과될 수 있어, 시나리오 추천에서 운영 컨셉의 일정 비중이 공공·문화 용도로 배분됩니다.',
                    },
                    {
                      label: '추가 개발 가능 연면적 (㎡)',
                      key: 'additionalFloorArea',
                      value: scoringResult.detail.additionalFloorArea.toLocaleString(),
                      short: '법정 최대까지 남은 면적',
                      desc: '현재 연면적과 법정 최대 연면적의 차이로, 합법적으로 추가 건축 가능한 면적입니다. 이 값이 클수록 증축형 시나리오의 매출 잠재력이 커집니다.',
                    },
                    {
                      label: '종상향 후 최대 연면적 (㎡)',
                      key: 'maxFloorAreaAfterUpgrade',
                      value: scoringResult.detail.maxFloorAreaAfterUpgrade.toLocaleString(),
                      short: '종상향 시 잠재 상한',
                      desc: '용도지역 종상향이 실현되었을 때 확보 가능한 최대 연면적입니다. 실현 가능성과 별개로 잠재 사업 규모를 가늠하는 상한선 지표입니다.',
                    },
                    {
                      label: '건폐율 사용률 (%)',
                      key: 'buildingCoverageUsageRate',
                      value: scoringResult.detail.buildingCoverageUsageRate,
                      short: '현재 ÷ 법정 최대 건폐율',
                      desc: '현재 건폐율 ÷ 법정 최대 건폐율. 100%에 가까울수록 평면적으로는 더 지을 여지가 없고, 낮을수록 동(棟) 추가나 외부공간 활용 여력이 있다는 뜻입니다.',
                    },
                    {
                      label: '용적률 사용률 (%)',
                      key: 'floorAreaRatioUsageRate',
                      value: scoringResult.detail.floorAreaRatioUsageRate,
                      short: '현재 ÷ 법정 최대 용적률',
                      desc: '현재 용적률 ÷ 법정 최대 용적률. 사용률이 낮을수록 같은 대지에 더 많은 연면적을 올릴 수 있어 증축·재건축형 시나리오의 IRR이 유리해집니다.',
                    },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3 py-3">
                      <div className="flex items-baseline gap-2 min-w-0 shrink-0">
                        <span className="text-sm font-medium text-foreground whitespace-nowrap">{row.label}</span>
                        <span className="text-sm tabular-nums text-muted-foreground">{row.value}</span>
                      </div>
                      <span className="text-xs text-muted-foreground truncate hidden sm:inline flex-1 min-w-0">
                        {(row.key && scoreReasons?.[row.key as ScoreReasonKey]) || row.short}
                      </span>
                      <div className="flex items-center shrink-0 ml-auto sm:ml-0">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              aria-label={`${row.label} 설명 보기`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="max-w-sm whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                            {row.desc}
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        </div>
      )}

      {/* 상세 분석 섹션 */}
      <div className="space-y-6">
        {/* 시나리오 추천 — 1/2/3순위 탭 */}
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-accent" /> 개발 시나리오 추천
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!scenarios ? (
                <p className="text-sm text-muted-foreground">분석 결과를 불러오는 중...</p>
              ) : (
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as '1' | '2' | '3')}>
                  <TabsList className="grid w-full grid-cols-3">
                    {scenarios.map((s) => (
                      <TabsTrigger key={s.rank} value={String(s.rank)}>
                        {s.rank}순위
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {scenarios.map((scenario) => {
                    const feasibility = scenario.irrResult.summary.investmentFeasibility;
                    const feasibilityClass =
                      feasibility === '높음' ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : feasibility === '중간' ? 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
                    const recommendedEquity =
                      baseScenarios?.find((b) => b.rank === scenario.rank)?.recommendedEquityRatio
                      ?? scenario.recommendedEquityRatio;
                    const sliderEquity = equityByRank[scenario.rank] ?? recommendedEquity;

                    return (
                      <TabsContent key={scenario.rank} value={String(scenario.rank)} className="mt-6 space-y-6">
                        {/* 시나리오 헤더 */}
                        <div>
                          <h3 className="text-xl font-bold leading-tight">
                            {scenario.rank}순위 · {scenario.concept.replace(/^\d+순위:\s*/, '')}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="secondary">{scenario.developmentDirectionLabel}</Badge>
                            <Badge variant="outline">{scenario.useTypeSummary}</Badge>
                          </div>
                        </div>

                        {/* 적합도 */}
                        <div>
                          <div className="mb-1.5 flex items-baseline justify-between">
                            <Label className="text-xs font-medium text-muted-foreground">시나리오 적합도</Label>
                            <span className="text-sm font-semibold">{scenario.suitabilityScore}점</span>
                          </div>
                          <Progress value={scenario.suitabilityScore} className="h-2" />
                        </div>

                        {/* 추천 이유 / 리스크 */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600">
                              <CheckCircle2 className="h-4 w-4" /> 추천 이유
                            </div>
                            <ul className="space-y-1.5 text-sm text-muted-foreground">
                              {scenario.reasons.map((r, i) => (
                                <li key={i} className="flex gap-2">
                                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-600">
                              <AlertTriangle className="h-4 w-4" /> 주요 리스크
                            </div>
                            <ul className="space-y-1.5 text-sm text-muted-foreground">
                              {scenario.risks.map((r, i) => (
                                <li key={i} className="flex gap-2">
                                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* 금융 구조 추천 */}
                        <Card className="bg-muted/40">
                          <CardContent className="space-y-2 p-4 text-sm">
                            <div className="font-semibold text-foreground">금융 구조 추천</div>
                            <div className="grid gap-2 sm:grid-cols-3">
                              <div>
                                <p className="text-xs text-muted-foreground">추천 자기자본 비율</p>
                                <p className="text-lg font-bold">{scenario.recommendedEquityRatio}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">대출 방식</p>
                                <p className="text-lg font-bold">{scenario.loanStructureLabel}</p>
                              </div>
                              <div className="sm:col-span-3">
                                <p className="text-xs text-muted-foreground">선정 이유</p>
                                <p className="text-sm">{scenario.loanReason}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* 사용 연면적 입력 (탭별 개별) */}
                        {(() => {
                          const maxAllowed = Math.round(scenario.irrResult.base.usableFloorArea ?? 0);
                          const usedVal = usedFloorAreaByRank[scenario.rank] ?? maxAllowed;
                          return (
                            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                              <div className="mb-2 flex items-baseline justify-between gap-2">
                                <Label className="text-sm font-semibold">사용 연면적 (㎡)</Label>
                                <span className="text-xs text-muted-foreground">
                                  최대 허용: <span className="font-semibold text-foreground tabular-nums">{maxAllowed.toLocaleString()}</span> ㎡
                                </span>
                              </div>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                max={maxAllowed}
                                step={10}
                                value={usedVal}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === '') {
                                    setUsedFloorAreaByRank((prev) => {
                                      const next = { ...prev }; delete next[scenario.rank]; return next;
                                    });
                                    return;
                                  }
                                  const v = Number(raw);
                                  if (!Number.isFinite(v) || v < 0) return;
                                  const clamped = Math.min(maxAllowed, Math.max(0, Math.round(v)));
                                  setUsedFloorAreaByRank((prev) => ({ ...prev, [scenario.rank]: clamped }));
                                }}
                                className="h-9 text-sm"
                              />
                              <p className="mt-1.5 text-xs text-muted-foreground">
                                실제 사용할 연면적을 입력하면 하단 재무 시나리오 비교표가 비례하여 갱신됩니다.
                              </p>
                              {usedFloorAreaByRank[scenario.rank] !== undefined &&
                                usedFloorAreaByRank[scenario.rank] !== maxAllowed && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setUsedFloorAreaByRank((prev) => {
                                        const next = { ...prev }; delete next[scenario.rank]; return next;
                                      })
                                    }
                                    className="mt-2 text-xs text-primary underline-offset-2 hover:underline"
                                  >
                                    최대값({maxAllowed.toLocaleString()}㎡)으로 되돌리기
                                  </button>
                                )}
                            </div>
                          );
                        })()}

                        {/* 자기자본 비율 슬라이더 (탭별 개별) */}

                        <div>
                          <div className="mb-2 flex items-baseline justify-between gap-2">
                            <Label className="text-sm font-semibold">내 자기자본 비율</Label>
                            <div className="flex items-baseline gap-3">
                              <span className="text-xs text-muted-foreground">추천: {recommendedEquity}%</span>
                              <span className="text-sm font-bold text-primary tabular-nums">{sliderEquity}%</span>
                            </div>
                          </div>
                          <Slider
                            value={[sliderEquity]}
                            min={10}
                            max={70}
                            step={5}
                            onValueChange={(v) =>
                              setEquityByRank((prev) => ({ ...prev, [scenario.rank]: v[0] }))
                            }
                          />
                          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                            <span>10%</span>
                            <span>40%</span>
                            <span>70%</span>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            자기자본 비율을 조절하면 수익률이 실시간으로 변경됩니다.
                          </p>
                          {equityByRank[scenario.rank] !== undefined &&
                            equityByRank[scenario.rank] !== recommendedEquity && (
                              <button
                                type="button"
                                onClick={() =>
                                  setEquityByRank((prev) => {
                                    const next = { ...prev };
                                    delete next[scenario.rank];
                                    return next;
                                  })
                                }
                                className="mt-2 text-xs text-primary underline-offset-2 hover:underline"
                              >
                                추천값({recommendedEquity}%)으로 되돌리기
                              </button>
                            )}
                        </div>

                        {/* 분양 비율 / 연간 매출 / 영업이익률 — 사용자 입력 */}
                        {(() => {
                          const PRESALE_ELIGIBLE = ['residential', 'mixed_use_residential', 'knowledge_industry', 'office', 'accommodation'];
                          const eligibleRatioSum = scenario.useTypeMix
                            .filter((m: any) => PRESALE_ELIGIBLE.includes(m.useType))
                            .reduce((sum: number, m: any) => sum + (m.ratio ?? 0), 0);
                          const hasPresale = eligibleRatioSum > 0;
                          const presaleVal = presaleByRank[scenario.rank] ?? 0;
                          const maxUsableArea = scenario.irrResult.base.usableFloorArea ?? 0;
                          const usableArea = usedFloorAreaByRank[scenario.rank] ?? maxUsableArea;
                          const maxPresaleArea = Math.round(usableArea * (eligibleRatioSum / 100));
                          const currentPresaleArea = Math.round(maxPresaleArea * (presaleVal / 100));
                          const recommendedRevenue = scenario.irrResult.base.recommendedAnnualRevenue ?? 0;
                          const revenueVal = revenueByRank[scenario.rank];
                          const revenueDisplay = revenueVal !== undefined
                            ? (revenueVal / 100_000_000).toString()
                            : (recommendedRevenue / 100_000_000).toFixed(1);
                          const marginVal = marginByRank[scenario.rank] ?? 40;
                          return (
                            <div className="space-y-5 rounded-lg border border-border/60 bg-muted/30 p-4">
                              {hasPresale && (
                                <div>
                                  <div className="mb-2 flex items-baseline justify-between gap-2">
                                    <Label className="text-sm font-semibold">분양 비율</Label>
                                    <span className="text-sm font-bold text-primary tabular-nums">{presaleVal}%</span>
                                  </div>
                                  <Slider
                                    value={[presaleVal]}
                                    min={0}
                                    max={100}
                                    step={10}
                                    onValueChange={(v) =>
                                      setPresaleByRank((prev) => ({ ...prev, [scenario.rank]: v[0] }))
                                    }
                                  />
                                  <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                                    <span>0%</span><span>50%</span><span>100%</span>
                                  </div>
                                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-border/50 bg-background/60 p-3 text-xs">
                                    <div>
                                      <p className="text-muted-foreground">최대 분양가능 면적</p>
                                      <p className="mt-0.5 text-sm font-semibold tabular-nums">
                                        {maxPresaleArea.toLocaleString()} ㎡
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">현재 분양면적</p>
                                      <p className="mt-0.5 text-sm font-semibold tabular-nums text-primary">
                                        {currentPresaleArea.toLocaleString()} ㎡
                                      </p>
                                    </div>
                                  </div>
                                  {(() => {
                                    const currentPyeong = currentPresaleArea / 3.305785;
                                    const pricePerPyeong = presalePriceByRank[scenario.rank] ?? 0; // 천만원
                                    const presaleRevenue = currentPyeong * pricePerPyeong; // 천만원 단위
                                    return (
                                      <div className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-border/50 bg-background/60 p-3 text-xs">
                                        <div>
                                          <Label className="text-muted-foreground">평당 분양가격 (천만원)</Label>
                                          <Input
                                            type="number"
                                            inputMode="decimal"
                                            step="0.1"
                                            min={0}
                                            value={presalePriceByRank[scenario.rank] ?? ''}
                                            onChange={(e) => {
                                              const raw = e.target.value;
                                              setPresalePriceByRank((prev) => {
                                                const next = { ...prev };
                                                if (raw === '') delete next[scenario.rank];
                                                else next[scenario.rank] = Math.max(0, Number(raw));
                                                return next;
                                              });
                                            }}
                                            placeholder="예: 5 (=5천만원/평)"
                                            className="mt-1 h-8 text-sm"
                                          />
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">분양매출</p>
                                          <p className="mt-2 text-sm font-semibold tabular-nums text-primary">
                                            {(presaleRevenue / 10).toLocaleString(undefined, { maximumFractionDigits: 1 })} 억원
                                          </p>
                                          <p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
                                            ≈ {currentPyeong.toLocaleString(undefined, { maximumFractionDigits: 1 })} 평
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    분양 가능 용도(주거·주상복합·지식산업센터·오피스·숙박)에 적용됩니다.
                                  </p>
                                </div>
                              )}

                              <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                  <div className="mb-2 flex items-baseline justify-between gap-2">
                                    <Label className="text-sm font-semibold">연간 매출 (억원)</Label>
                                    <span className="text-xs text-muted-foreground">
                                      권장: {(recommendedRevenue / 100_000_000).toFixed(1)}억
                                    </span>
                                  </div>
                                  <Input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.1"
                                    min={0}
                                    value={revenueDisplay}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      if (raw === '') {
                                        setRevenueByRank((prev) => {
                                          const next = { ...prev }; delete next[scenario.rank]; return next;
                                        });
                                        return;
                                      }
                                      const eok = Number(raw);
                                      if (!Number.isFinite(eok) || eok < 0) return;
                                      setRevenueByRank((prev) => ({
                                        ...prev,
                                        [scenario.rank]: Math.round(eok * 100_000_000),
                                      }));
                                    }}
                                  />
                                  {revenueVal !== undefined && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setRevenueByRank((prev) => {
                                          const next = { ...prev }; delete next[scenario.rank]; return next;
                                        })
                                      }
                                      className="mt-1.5 text-xs text-primary underline-offset-2 hover:underline"
                                    >
                                      권장값으로 되돌리기
                                    </button>
                                  )}
                                </div>

                                <div>
                                  <div className="mb-2 flex items-baseline justify-between gap-2">
                                    <Label className="text-sm font-semibold">영업이익률</Label>
                                    <div className="flex items-baseline gap-3">
                                      <span className="text-xs text-muted-foreground">기본 40%</span>
                                      <span className="text-sm font-bold text-primary tabular-nums">{marginVal}%</span>
                                    </div>
                                  </div>
                                  <Slider
                                    value={[marginVal]}
                                    min={10}
                                    max={70}
                                    step={1}
                                    onValueChange={(v) =>
                                      setMarginByRank((prev) => ({ ...prev, [scenario.rank]: v[0] }))
                                    }
                                  />
                                  <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                                    <span>10%</span><span>40%</span><span>70%</span>
                                  </div>
                                  {marginByRank[scenario.rank] !== undefined && marginByRank[scenario.rank] !== 40 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setMarginByRank((prev) => {
                                          const next = { ...prev }; delete next[scenario.rank]; return next;
                                        })
                                      }
                                      className="mt-2 text-xs text-primary underline-offset-2 hover:underline"
                                    >
                                      기본값(40%)으로 되돌리기
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 재무 지표: 보수적 / 기본 / 낙관적 3컬럼 */}
                        <div>
                          <div className="mb-3 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-accent" />
                            <h4 className="text-sm font-semibold">재무 시나리오 비교</h4>
                            <Badge variant="outline" className={`ml-auto ${feasibilityClass}`}>
                              투자 타당성: {feasibility}
                            </Badge>
                          </div>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>지표</TableHead>
                                  <TableHead className="text-right">보수적</TableHead>
                                  <TableHead className="text-right">기본</TableHead>
                                  <TableHead className="text-right">낙관적</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(() => {
                                  const PRESALE_ELIGIBLE = ['residential', 'mixed_use_residential', 'knowledge_industry', 'office', 'accommodation'];
                                  const eligibleRatioSum = scenario.useTypeMix
                                    .filter((m: any) => PRESALE_ELIGIBLE.includes(m.useType))
                                    .reduce((sum: number, m: any) => sum + (m.ratio ?? 0), 0);
                                  const presaleVal = presaleByRank[scenario.rank] ?? 0;
                                  const maxUsableArea = scenario.irrResult.base.usableFloorArea ?? 0;
                                  const usedInput = usedFloorAreaByRank[scenario.rank] ?? maxUsableArea;

                                  // 사용 연면적에 비례해 각 시나리오 컬럼(보수/기본/낙관) 값을 스케일링
                                  // — 토지비는 면적과 무관(고정), 건축비·매출·이익·자기자본·대출 등은 면적에 비례
                                  const scaleLevel = (lv: any) => {
                                    const lvMax = lv.usableFloorArea ?? 0;
                                    const usedArea = lvMax > 0 ? Math.min(usedInput, lvMax) : 0;
                                    const k = lvMax > 0 ? usedArea / lvMax : 0;
                                    const land = lv.landAcquisitionCost ?? 0;
                                    const totalInv = land + ((lv.totalInvestment ?? 0) - land) * k;
                                    return {
                                      usableFloorArea: usedArea,
                                      totalInvestment: totalInv,
                                      equityAmount: (lv.equityAmount ?? 0) * k,
                                      loanAmount: (lv.loanAmount ?? 0) * k,
                                      annualRevenue: (lv.annualRevenue ?? 0) * k,
                                      annualOperatingProfit: (lv.annualOperatingProfit ?? 0) * k,
                                      irr: lv.irr,            // 모든 CF가 동일 k로 스케일 → IRR 불변
                                      dscr: lv.dscr,          // OP·부채 둘 다 k로 스케일 → 비율 불변
                                      paybackYears: lv.paybackYears,
                                      totalInvestmentPaybackYears: lv.totalInvestmentPaybackYears,
                                    };
                                  };
                                  const cs = scaleLevel(scenario.irrResult.conservative);
                                  const bs = scaleLevel(scenario.irrResult.base);
                                  const os = scaleLevel(scenario.irrResult.optimistic);

                                  // 분양매출 (면적 스케일 반영: presale 면적도 사용 연면적 기반)
                                  const usableAreaForPresale = usedInput;
                                  const maxPresaleArea = usableAreaForPresale * (eligibleRatioSum / 100);
                                  const currentPresaleArea = maxPresaleArea * (presaleVal / 100);
                                  const currentPyeong = currentPresaleArea / 3.305785;
                                  const pricePerPyeong = presalePriceByRank[scenario.rank] ?? 0; // 천만원
                                  const presaleRevenueWon = currentPyeong * pricePerPyeong * 10_000_000;
                                  const recoverPayback = (totalInvestment: number, annualOp: number) => {
                                    if (!Number.isFinite(totalInvestment) || !Number.isFinite(annualOp)) return 0;
                                    const remaining = Math.max(0, totalInvestment - presaleRevenueWon);
                                    if (remaining === 0) return 0;
                                    if (annualOp <= 0) return 0;
                                    return Math.round((remaining / annualOp) * 10) / 10;
                                  };
                                  const rows = [
                                  { label: '사용 연면적 (㎡)', fmt: (v: number) => formatNumber(v),
                                    c: cs.usableFloorArea, b: bs.usableFloorArea, o: os.usableFloorArea },
                                  { label: '총 투자비', fmt: (v: number) => toEokwon(v),
                                    c: cs.totalInvestment, b: bs.totalInvestment, o: os.totalInvestment },
                                  { label: '자기자본', fmt: (v: number) => toEokwon(v),
                                    c: cs.equityAmount, b: bs.equityAmount, o: os.equityAmount },
                                  { label: '대출금액', fmt: (v: number) => toEokwon(v),
                                    c: cs.loanAmount, b: bs.loanAmount, o: os.loanAmount },
                                  { label: '연간 매출', fmt: (v: number) => toEokwon(v),
                                    c: cs.annualRevenue, b: bs.annualRevenue, o: os.annualRevenue },
                                  { label: '연간 영업이익', fmt: (v: number) => toEokwon(v),
                                    c: cs.annualOperatingProfit, b: bs.annualOperatingProfit, o: os.annualOperatingProfit },
                                  { label: '분양매출', fmt: (_v: number) => toEokwon(presaleRevenueWon),
                                    c: presaleRevenueWon, b: presaleRevenueWon, o: presaleRevenueWon },
                                  { label: 'IRR', fmt: (v: number) => formatPercent(v),
                                    c: cs.irr, b: bs.irr, o: os.irr, highlight: true },
                                  { label: 'DSCR', fmt: (v: number) => (Number.isFinite(v) ? v.toFixed(2) : '--'),
                                    c: cs.dscr, b: bs.dscr, o: os.dscr },
                                  { label: '총 투자비 회수기간 (분양 + 영업이익)', fmt: (v: number) => (Number.isFinite(v) && v > 0 ? `${v}년` : '--'),
                                    c: recoverPayback(cs.totalInvestment, cs.annualOperatingProfit),
                                    b: recoverPayback(bs.totalInvestment, bs.annualOperatingProfit),
                                    o: recoverPayback(os.totalInvestment, os.annualOperatingProfit) },
                                  { label: '운영투자비 회수기간 (무차입 기준)', fmt: (v: number) => (Number.isFinite(v) && v > 0 ? `${v}년` : '--'),
                                    c: cs.totalInvestmentPaybackYears, b: bs.totalInvestmentPaybackYears, o: os.totalInvestmentPaybackYears },
                                  { label: '자기자본 회수기간 (대출상환 후 실제값)', fmt: (v: number) => (Number.isFinite(v) && v > 0 ? `${v}년` : '--'),
                                    c: cs.paybackYears, b: bs.paybackYears, o: os.paybackYears },
                                  ];
                                  return rows.map((row) => (
                                  <TableRow key={row.label}>
                                    <TableCell className="font-medium">{row.label}</TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">{row.fmt(row.c)}</TableCell>
                                    <TableCell className={`text-right tabular-nums ${row.highlight ? 'font-bold text-primary' : ''}`}>{row.fmt(row.b)}</TableCell>
                                    <TableCell className="text-right tabular-nums text-muted-foreground">{row.fmt(row.o)}</TableCell>
                                  </TableRow>
                                  ));
                                })()}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </>

        <>
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
                      <p className="flex items-center gap-1 text-xs">
                        종합 신호 점수
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>저장·열람·반복열람·상담 신청 등 사용자 관심 행동을 자산 등급에 따라 가중하여 합산한 점수입니다.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </p>
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
                      <p className="text-xs">관심 상담 신청</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">{signalSummary.dealInterestCount}회</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {signalSummary.clusterDetected && (
                      <Badge variant="default">클러스터 감지</Badge>
                    )}
                  </div>
                </>
              ) : (
                <p>신호 데이터를 불러오는 중...</p>
              )}
            </CardContent>
          </Card>
        </>
      </div>

      {/* Bottom buttons */}
      <div className="mt-8 flex flex-wrap gap-3">
        {user && (
          <Button variant="outline" onClick={handleSaveAsset}>자산 저장</Button>
        )}
        {user && (
          <Button onClick={handleDealInterest}>관심 상담 신청</Button>
        )}
        <Button variant="outline" onClick={() => navigate('/properties')}>
          목록으로 돌아가기
        </Button>
      </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
