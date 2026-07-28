import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Table 컴포넌트 제거 — 재무 시나리오는 리스트 형태로 렌더링합니다.
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  TrendingUp, FileText, BarChart3, Building2, School, Home, Factory, Building,
  CheckCircle2, AlertTriangle, Sparkles, ShieldAlert, Info,
} from 'lucide-react';
import Seo from '@/components/common/Seo';
import GradeMeter from '@/components/common/GradeMeter';
import RatioBar from '@/components/common/RatioBar';
import AuthModal from '@/components/common/AuthModal';
import LoadingBars from '@/components/common/LoadingBars';
import Footer from '@/components/layout/Footer';

// 서버 응답 타입 (analyze-asset edge function). 알고리즘 로직은 클라이언트 번들에 포함되지 않습니다.
type Grade = 'S' | 'A' | 'B' | 'C' | 'D';
type BlockLabel = '우수' | '양호' | '보통' | '미흡' | '취약';
interface ScenarioSanitized {
  rank: 1 | 2 | 3;
  concept: string;
  developmentDirectionLabel: string;
  useTypeSummary: string;
  useTypeMix: Array<{ useType: string; ratio: number }>;
  reasons: string[];
  risks: string[];
  recommendedEquityRatio: number;
  loanStructureLabel: string;
  loanReason: string;
  suitabilityLabel: BlockLabel;
  irrResult: {
    base: { usableFloorArea?: number; recommendedAnnualRevenue?: number; [k: string]: unknown };
    summary: { investmentFeasibility: string; [k: string]: unknown };
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
interface AnalyzeResponse {
  scoring: {
    grade: Grade;
    totalScore: number;
    blockLabels: { A: BlockLabel; B: BlockLabel; C: BlockLabel; D: BlockLabel };
  };
  recommendation: {
    assetSummary: { keyStrengths: string[]; keyRisks: string[]; [k: string]: unknown };
    scenarios: ScenarioSanitized[];
  };
  config: {
    landValuePerSqm: number;
    projectYears: number;
    residualValueRatio: number;
    loanRates: { pf: number; collateral: number };
  };
}
type OverridePayload = { rank: number; equityRatio?: number; annualRevenue?: number; operatingMargin?: number };
type SignalRow = { user_id: string; asset_id: string; signal_type: string; created_at: string };

// 원 → 억원 변환 (소수 1자리)
const toEokwon = (won: number | null | undefined): string => {
  if (won == null || !Number.isFinite(won)) return '--';
  return `${(won / 100_000_000).toFixed(1)}억`;
};
const formatPercent = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n) ? '--' : `${n.toFixed(1)}%`;
const formatNumber = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n) ? '--' : Math.round(n).toLocaleString();

/**
 * 재무 시나리오 표.
 * 데스크톱: 3열 비교표 / 모바일: 시나리오 선택 버튼 + 단일 열
 */
type ScenarioRow = { label: string; value: string; highlight?: boolean };
type ScenarioColumn = { key: string; title: string; rows: ScenarioRow[] };

const ScenarioTable = ({ columns, labels }: { columns: ScenarioColumn[]; labels: ScenarioRow[] }) => {
  const [active, setActive] = useState(1);
  const activeCol = columns[active] ?? columns[0];

  return (
    <div className="mt-4">
      {/* 모바일 — 시나리오 선택 */}
      <div className="md:hidden">
        <div className="grid grid-cols-3 border border-border/20">
          {columns.map((col, i) => (
            <button
              key={col.key}
              type="button"
              onClick={() => setActive(i)}
              className={`px-2 py-2.5 text-xs font-medium transition-colors ${i > 0 ? 'border-l border-border/20' : ''} ${
                i === active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {col.title}
            </button>
          ))}
        </div>
        <div className="divide-y divide-border/20 border border-t-0 border-border/20">
          {labels.map((row, rowIndex) => {
            const value = activeCol.rows[rowIndex];
            return (
              <div key={row.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="text-xs leading-snug text-muted-foreground">{row.label}</span>
                <span className={`text-sm tabular-nums ${value.highlight ? 'font-bold text-primary' : 'font-semibold'}`}>
                  {value.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 데스크톱 — 3열 비교 */}
      <div className="hidden overflow-x-auto border border-border/20 md:block">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[1.15fr_repeat(3,1fr)] border-b border-border/20 bg-muted/40 text-xs font-semibold text-muted-foreground">
            <div className="px-4 py-3">항목</div>
            {columns.map((col) => (
              <div key={col.key} className="border-l border-border/20 px-4 py-3 text-right">{col.title}</div>
            ))}
          </div>
          <div className="divide-y divide-border/20">
            {labels.map((row, rowIndex) => (
              <div key={row.label} className="grid grid-cols-[1.15fr_repeat(3,1fr)] items-center">
                <div className="px-4 py-3 text-sm leading-snug text-muted-foreground">{row.label}</div>
                {columns.map((col) => {
                  const value = col.rows[rowIndex];
                  return (
                    <div
                      key={`${col.key}-${row.label}`}
                      className={`border-l border-border/20 px-4 py-3 text-right text-sm tabular-nums ${value.highlight ? 'font-bold text-primary' : 'font-semibold'}`}
                    >
                      {value.value}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

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

  // 매도자 희망가 → 표시용
  const askingLandPrice = (asset as unknown as { asking_land_price?: number | null })?.asking_land_price ?? null;
  const askingBuildingPrice = (asset as unknown as { asking_building_price?: number | null })?.asking_building_price ?? null;

  // 서버로 보낼 오버라이드 페이로드 (queryKey에 포함)
  const overridesPayload = useMemo<OverridePayload[]>(() => {
    const ranks = new Set<number>([
      ...Object.keys(equityByRank).map(Number),
      ...Object.keys(revenueByRank).map(Number),
      ...Object.keys(marginByRank).map(Number),
    ]);
    return Array.from(ranks).map((rank) => {
      const eq = equityByRank[rank];
      const rev = revenueByRank[rank];
      const mar = marginByRank[rank];
      return {
        rank,
        equityRatio: eq,
        annualRevenue: rev !== undefined && rev > 0 ? rev : undefined,
        operatingMargin: mar !== undefined ? mar / 100 : undefined,
      };
    }).filter((o) => o.equityRatio !== undefined || o.annualRevenue !== undefined || o.operatingMargin !== undefined);
  }, [equityByRank, revenueByRank, marginByRank]);

  // 서버 API 호출 (알고리즘은 서버 전용)
  const analysisQuery = useQuery<AnalyzeResponse>({
    queryKey: ['analyze-asset', assetId, JSON.stringify(overridesPayload)],
    enabled: !!assetId && !!user,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('analyze-asset', {
        body: { asset_id: assetId, overrides: overridesPayload },
      });
      if (error) {
        const msg = (error as { message?: string }).message ?? '분석 요청 실패';
        throw new Error(msg);
      }
      return data as AnalyzeResponse;
    },
  });

  useEffect(() => {
    if (analysisQuery.error) {
      toast({
        title: '분석을 불러오지 못했습니다',
        description: (analysisQuery.error as Error).message,
        variant: 'destructive',
      });
    }
  }, [analysisQuery.error]);

  const analysis = analysisQuery.data ?? null;
  const scoringResult = analysis?.scoring ?? null;
  const baseScenarios = analysis?.recommendation.scenarios;
  const scenarios = baseScenarios;
  const activeScenario = scenarios?.find((s) => String(s.rank) === activeTab) ?? scenarios?.[0];
  const algoConfig = analysis?.config ?? {
    landValuePerSqm: 4_500_000,
    projectYears: 10,
    residualValueRatio: 0.4,
    loanRates: { pf: 5.5, collateral: 4.8 },
  };

  // 사용자 액션 신호 (deal_signals). 알고리즘 없이 단순 집계만 수행.
  const [signalRows, setSignalRows] = useState<SignalRow[]>([]);
  const fetchSignals = async () => {
    if (!assetId || !user) { setSignalRows([]); return; }
    const { data } = await supabase.from('deal_signals').select('*').eq('asset_id', assetId);
    if (data) setSignalRows(data as SignalRow[]);
  };
  // 자산 열람 시 'viewed' 신호 자동 기록
  useEffect(() => {
    if (!assetId || !user) return;
    (async () => {
      await supabase.from('deal_signals').insert({
        user_id: user.id, asset_id: assetId, signal_type: 'viewed',
      });
      fetchSignals();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId, user?.id]);

  // 신호 집계 (알고리즘 없이 단순 카운트)
  const signalSummary = useMemo(() => {
    if (!signalRows.length) return null;
    const users = new Set(signalRows.map((r) => r.user_id));
    const counts: Record<string, number> = {};
    const perUserViews: Record<string, number> = {};
    signalRows.forEach((r) => {
      counts[r.signal_type] = (counts[r.signal_type] || 0) + 1;
      if (r.signal_type === 'viewed') perUserViews[r.user_id] = (perUserViews[r.user_id] || 0) + 1;
    });
    const repeatedViewCount = Object.values(perUserViews).filter((c) => c > 1).length;
    return {
      totalSignalScore: signalRows.length,
      uniqueUsers: users.size,
      savedCount: counts.saved ?? 0,
      viewCount: counts.viewed ?? 0,
      repeatedViewCount,
      dealInterestCount: counts.deal_interest ?? 0,
      clusterDetected: users.size >= 5,
    };
  }, [signalRows]);


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
    return <LoadingBars />;
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
  const normalizeArrowText = (text: string) => text.replace(/\s+—\s+/g, ' → ');
  const assumptionItems = [
    { label: '공시지가', value: `${(asset.land_value_per_sqm ?? algoConfig.landValuePerSqm).toLocaleString()}원/㎡` },
    { label: '운영기간', value: `${algoConfig.projectYears}년` },
    { label: '잔존가치', value: `${(algoConfig.residualValueRatio * 100).toFixed(0)}%` },
    { label: '대출금리', value: `PF ${algoConfig.loanRates.pf}% / 담보 ${algoConfig.loanRates.collateral}%` },
  ];

  return (
    <div className="pt-16">
      <Seo
        title="자산 분석 — Heritage Layer"
        description="입지·법규·수익성 시나리오를 데이터 기반으로 분석하는 Heritage Layer 분석 도구."
        path="/analysis"
      />
      {/* 자산 핵심 정보 헤더 */}
      <div className="section-navy border-b border-primary-foreground/10 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-6 sm:px-8 py-12 sm:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center bg-primary-foreground/10 text-primary-foreground">
                  <AssetIcon className="h-5 w-5" />
                </span>
                <Badge variant="secondary">{asset.asset_type}</Badge>
                {asset.gov_cooperation && (
                  <Badge variant="outline" className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground">정부협력</Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-snug">{asset.address}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-primary-foreground/70 leading-relaxed">
                <span>방치 기간: {asset.idle_years ?? '-'}년</span>
                <span className="opacity-40">·</span>
                <span>소유: {asset.ownership_type === 'public' ? '공유/국유' : asset.ownership_type === 'private' ? '사유' : (asset.ownership_type ?? '-')}</span>
                <span className="opacity-40">·</span>
                <span className="inline-flex items-center gap-1">
                  활용 상태:
                  {(() => {
                    const s = asset.utilization_status ?? 'unutilized';
                    const map: Record<string, { label: string; cls: string }> = {
                      unutilized: { label: '미활용', cls: 'border-primary-foreground/25 text-primary-foreground/75' },
                      in_discussion: { label: '협의 중', cls: 'border-primary-foreground/35 text-primary-foreground' },
                      utilized: { label: '활용 중', cls: 'border-primary-foreground/35 text-primary-foreground' },
                    };
                    const v = map[s] ?? map.unutilized;
                    return <Badge variant="outline" className={v.cls}>{v.label}</Badge>;
                  })()}
                </span>
              </div>
            </div>

            {/* 액션 버튼 — 우측 상단 */}
            {user && (
              <div className="flex flex-wrap gap-2 md:shrink-0">
                <Button variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary" onClick={handleSaveAsset}>자산 저장</Button>
                <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" onClick={handleDealInterest}>관심 상담 신청</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 등급/블록/기본 정보 — 블루 밴드 */}
      <div className="section-navy bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-5 sm:px-10 py-10 sm:py-14">

      {/* 블록별 평가(좌) + 등급 계기판(우) */}
      {scoringResult && (
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_300px] md:items-start">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-wider text-primary-foreground/60">COSMO-P 블록별 평가</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              {(() => {
                const labelClass = (v: BlockLabel) =>
                  v === '우수' ? 'text-primary-foreground'
                    : v === '양호' ? 'text-primary-foreground'
                    : v === '보통' ? 'text-primary-foreground/85'
                    : v === '미흡' ? 'text-primary-foreground/70'
                    : 'text-primary-foreground/55';
                return [
                  { label: '입지·규제', value: scoringResult.blockLabels.A },
                  { label: '수요·환경', value: scoringResult.blockLabels.B },
                  { label: '심미적 가치', value: scoringResult.blockLabels.C },
                  { label: '사업성', value: scoringResult.blockLabels.D },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col border-t border-primary-foreground/10 pt-4">
                    <p className="text-base text-primary-foreground/65">{item.label}</p>
                    <p className={`mt-1 text-2xl font-bold ${labelClass(item.value)}`}>{item.value}</p>
                  </div>
                ));
              })()}
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex cursor-help flex-col items-center justify-center">
                  <GradeMeter grade={scoringResult.grade} totalScore={scoringResult.totalScore} size={210} />
                  <span className="mt-3 border border-primary-foreground/20 px-3 py-1 text-xs text-primary-foreground/70">분석 가정</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center" className="section-navy w-72 rounded-none border-primary-foreground/10 bg-primary text-primary-foreground shadow-xl">
                <div className="space-y-2 py-1 text-xs leading-relaxed">
                  {assumptionItems.map((item) => (
                    <div key={item.label} className="grid grid-cols-[72px_1fr] gap-3">
                      <span className="text-primary-foreground/55">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-5 text-base font-semibold">기본 정보</h2>
        <div className="mb-6 grid gap-5 sm:grid-cols-2">
          <RatioBar
            label="건폐율"
            current={asset.current_building_coverage ?? asset.building_coverage}
            legalMax={asset.legal_max_building_coverage}
            tone="dark"
          />
          <RatioBar
            label="용적률"
            current={asset.current_floor_area_ratio ?? asset.floor_area_ratio}
            legalMax={asset.legal_max_floor_area_ratio}
            tone="dark"
          />
        </div>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {[
            { label: '용도지역', value: asset.zoning ?? '-' },
            { label: '대지면적', value: asset.land_area ? `${asset.land_area.toLocaleString()}㎡` : '-' },
            { label: '연면적', value: asset.current_floor_area ? `${asset.current_floor_area.toLocaleString()}㎡` : '-' },
            { label: '공시지가', value: asset.land_value_per_sqm ? `${asset.land_value_per_sqm.toLocaleString()}원/㎡` : '-' },
            { label: '인구 추이', value: asset.population_trend ?? '-' },
            { label: '건물 상태', value: asset.building_condition ?? '-' },
          ].map((item) => (
            <div key={item.label} className="flex items-baseline justify-between gap-3 border-b border-primary-foreground/10 pb-2">
              <dt className="text-xs text-primary-foreground/55">{item.label}</dt>
              <dd className="text-sm font-semibold text-right">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 예상 자산 매도가 */}
      <section>
        <h2 className="mb-5 text-base font-semibold">예상 자산 매도가</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-primary-foreground/55">토지 매도가 (매도자 희망)</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {((askingLandPrice ?? 0) / 1_0000_0000).toLocaleString(undefined, { maximumFractionDigits: 2 })}억원
            </p>
          </div>
          <div>
            <p className="text-xs text-primary-foreground/55">건물 매도가 (매도자 희망)</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {((askingBuildingPrice ?? 0) / 1_0000_0000).toLocaleString(undefined, { maximumFractionDigits: 2 })}억원
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-primary-foreground/55">
          * 가격이 없는 경우 매도자 미제시, 공시지가 기준 적용
        </p>
      </section>

      {/* 전문가 의견 밴드 */}
      {analysis && (() => {
        const strengths = analysis.recommendation.assetSummary.keyStrengths;
        const risks = analysis.recommendation.assetSummary.keyRisks;
        const sentenceify = (s: string) => {
          const t = s.trim().replace(/[.。]$/, '');
          if (/(다|요|음|함|됨|임)$/.test(t)) return `${t}.`;
          return `${t}합니다.`;
        };
        return (
              <section className="mt-8 border-l border-primary-foreground/20 pl-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/55">전문가 의견</p>
                <div className="space-y-3 text-sm leading-[1.8] text-primary-foreground/85">
                  {strengths.length > 0 && (
                    <p>
                      <span className="font-semibold text-primary-foreground">강점 +</span>{' '}
                      본 자산은 {strengths.map((s) => normalizeArrowText(sentenceify(s))).join(' 또한 ')}
                    </p>
                  )}
                  {risks.length > 0 && (
                    <p>
                      <span className="font-semibold text-primary-foreground">리스크 -</span>{' '}
                      다만 {risks.map((s) => normalizeArrowText(sentenceify(s))).join(' 아울러 ')}
                    </p>
                  )}
                  {strengths.length === 0 && risks.length === 0 && (
                    <p className="text-primary-foreground/55">특이 사항이 확인되지 않습니다.</p>
                  )}
                </div>
              </section>
        );
      })()}

        </div>
      </div>

      {/* 개발 시나리오 — 흰색 밴드 */}
      <div className="section-light pb-0">
        <div className="mx-auto max-w-5xl px-5 sm:px-10 py-10">
      <div className="space-y-6">
        {/* 시나리오 추천 — 1/2/3순위 탭 */}
        <section>
          <h2 className="mb-5 flex items-center gap-2 text-2xl font-semibold">
            <TrendingUp className="h-5 w-5 text-primary" /> 개발 시나리오 추천
          </h2>
          <div>
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
                      feasibility === '높음' ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)_/_0.08)] text-[hsl(var(--primary))] dark:bg-[hsl(var(--primary)_/_0.15)] dark:border-[hsl(var(--primary))]'
                      : feasibility === '중간' ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent)_/_0.08)] text-[hsl(var(--accent))] dark:bg-[hsl(var(--accent)_/_0.15)] dark:border-[hsl(var(--accent))]'
                      : 'border-[hsl(var(--grade-d))] bg-[hsl(var(--grade-d)_/_0.08)] text-[hsl(var(--grade-d))] dark:bg-[hsl(var(--grade-d)_/_0.15)] dark:border-[hsl(var(--grade-d))]';
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
                        {/* 적합도 */}
                        <div>
                          <div className="mb-1.5 flex items-baseline justify-between">
                            <Label className="text-xs font-medium text-muted-foreground">시나리오 적합도</Label>
                            <Badge variant="outline" className="font-semibold">{scenario.suitabilityLabel}</Badge>
                          </div>
                        </div>


                        {/* 추천 이유 / 리스크 */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[hsl(var(--primary))]">
                              <CheckCircle2 className="h-4 w-4" /> 추천 이유
                            </div>
                            <ul className="space-y-1.5 text-sm text-muted-foreground">
                              {scenario.reasons.map((r, i) => (
                                <li key={i} className="flex gap-2">
                                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[hsl(var(--primary))]" />
                                  <span>{normalizeArrowText(r)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[hsl(var(--accent))]">
                              <AlertTriangle className="h-4 w-4" /> 주요 리스크
                            </div>
                            <ul className="space-y-1.5 text-sm text-muted-foreground">
                              {scenario.risks.map((r, i) => (
                                <li key={i} className="flex gap-2">
                                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[hsl(var(--accent))]" />
                                  <span>{normalizeArrowText(r)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* 금융 구조 추천 */}
                        <div className="border-t border-border/20 pt-5">
                          <p className="mb-4 text-xl font-semibold">금융 구조 추천</p>
                          <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                              <p className="text-xs text-muted-foreground">추천 자기자본 비율</p>
                              <p className="mt-1 text-lg font-bold tabular-nums">{scenario.recommendedEquityRatio}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">대출 방식</p>
                              <p className="mt-1 text-lg font-bold">{scenario.loanStructureLabel}</p>
                            </div>
                            <div className="sm:col-span-3">
                              <p className="text-xs text-muted-foreground">선정 이유</p>
                              <p className="mt-1 text-sm leading-relaxed">{normalizeArrowText(scenario.loanReason)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-6 border-t border-border/20 pt-5 sm:grid-cols-2">
                        {/* 사용 연면적 입력 (탭별 개별) */}
                        {(() => {
                          const maxAllowed = Math.round(scenario.irrResult.base.usableFloorArea ?? 0);
                          const usedVal = usedFloorAreaByRank[scenario.rank] ?? maxAllowed;
                          return (
                            <div>
                              <div className="mb-2 flex items-baseline justify-between gap-2">
                                <div className="flex items-baseline gap-2">
                                  <Label className="text-sm font-semibold">사용 연면적 (㎡)</Label>
                                  <span className="text-[11px] text-destructive">ex) {maxAllowed.toLocaleString()}</span>
                                </div>
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
                            <div className="space-y-5 border-t border-border/20 pt-5">
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
                                  {(() => {
                                    const currentPyeong = currentPresaleArea / 3.305785;
                                    const pricePerPyeong = presalePriceByRank[scenario.rank] ?? 0; // 천만원
                                    const presaleRevenue = currentPyeong * pricePerPyeong; // 천만원 단위
                                    return (
                                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-3 border border-border/25 p-3 text-xs">
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
                                        <div className="space-y-3 border border-border/25 p-3 text-xs">
                                          <div>
                                            <div className="flex items-baseline justify-between gap-2">
                                              <Label className="text-muted-foreground">평당 분양가격 (천만원)</Label>
                                              <span className="text-[11px] text-destructive">ex) 5</span>
                                            </div>
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
                                              placeholder="직접 입력"
                                              className="mt-1 h-8 text-sm placeholder:text-destructive/60"
                                            />
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground">분양매출</p>
                                            <p className="mt-0.5 text-sm font-semibold tabular-nums text-primary">
                                              {(presaleRevenue / 10).toLocaleString(undefined, { maximumFractionDigits: 1 })} 억원
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
                                              ≈ {currentPyeong.toLocaleString(undefined, { maximumFractionDigits: 1 })} 평
                                            </p>
                                          </div>
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
                                    <div className="flex items-baseline gap-2">
                                      <Label className="text-sm font-semibold">연간 매출 (억원)</Label>
                                      <span className="text-[11px] text-destructive">ex) {(recommendedRevenue / 100_000_000).toFixed(1)}</span>
                                    </div>
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

                        {/* 재무 지표: 좌측 항목명 + 3개 시나리오 숫자 그리드 */}
                        <div>
                          <div className="mb-3 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <h4 className="text-xl font-semibold">재무 시나리오</h4>
                            <Badge variant="outline" className={`ml-auto ${feasibilityClass}`}>
                              투자 타당성: {feasibility}
                            </Badge>
                          </div>
                          {(() => {
                            const PRESALE_ELIGIBLE = ['residential', 'mixed_use_residential', 'knowledge_industry', 'office', 'accommodation'];
                            const eligibleRatioSum = scenario.useTypeMix
                              .filter((m: any) => PRESALE_ELIGIBLE.includes(m.useType))
                              .reduce((sum: number, m: any) => sum + (m.ratio ?? 0), 0);
                            const presaleVal = presaleByRank[scenario.rank] ?? 0;
                            const maxUsableArea = scenario.irrResult.base.usableFloorArea ?? 0;
                            const usedInput = usedFloorAreaByRank[scenario.rank] ?? maxUsableArea;

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
                                irr: lv.irr,
                                dscr: lv.dscr,
                                paybackYears: lv.paybackYears,
                                totalInvestmentPaybackYears: lv.totalInvestmentPaybackYears,
                              };
                            };
                            const levelsData = {
                              conservative: scaleLevel(scenario.irrResult.conservative),
                              base: scaleLevel(scenario.irrResult.base),
                              optimistic: scaleLevel(scenario.irrResult.optimistic),
                            };

                            const maxPresaleArea = usedInput * (eligibleRatioSum / 100);
                            const currentPresaleArea = maxPresaleArea * (presaleVal / 100);
                            const currentPyeong = currentPresaleArea / 3.305785;
                            const pricePerPyeong = presalePriceByRank[scenario.rank] ?? 0;
                            const presaleRevenueWon = currentPyeong * pricePerPyeong * 10_000_000;
                            const recoverPayback = (totalInvestment: number, annualOp: number) => {
                              if (!Number.isFinite(totalInvestment) || !Number.isFinite(annualOp)) return 0;
                              const remaining = Math.max(0, totalInvestment - presaleRevenueWon);
                              if (remaining === 0) return 0;
                              if (annualOp <= 0) return 0;
                              return Math.round((remaining / annualOp) * 10) / 10;
                            };

                            const buildRows = (lv: typeof levelsData.base) => [
                              { label: '사용 연면적 (㎡)', value: formatNumber(lv.usableFloorArea) },
                              { label: '총 투자비', value: toEokwon(lv.totalInvestment) },
                              { label: '자기자본', value: toEokwon(lv.equityAmount) },
                              { label: '대출금액', value: toEokwon(lv.loanAmount) },
                              { label: '연간 매출', value: toEokwon(lv.annualRevenue) },
                              { label: '연간 영업이익', value: toEokwon(lv.annualOperatingProfit) },
                              { label: '분양매출', value: toEokwon(presaleRevenueWon) },
                              { label: 'IRR', value: formatPercent(lv.irr), highlight: true },
                              { label: 'DSCR', value: Number.isFinite(lv.dscr) ? lv.dscr.toFixed(2) : '--' },
                              { label: '총 투자비 회수기간 (분양+영업이익)',
                                value: (() => { const v = recoverPayback(lv.totalInvestment, lv.annualOperatingProfit); return Number.isFinite(v) && v > 0 ? `${v}년` : '--'; })() },
                              { label: '운영투자비 회수기간 (무차입)',
                                value: Number.isFinite(lv.totalInvestmentPaybackYears) && lv.totalInvestmentPaybackYears > 0 ? `${lv.totalInvestmentPaybackYears}년` : '--' },
                              { label: '자기자본 회수기간 (대출상환 후)',
                                value: Number.isFinite(lv.paybackYears) && lv.paybackYears > 0 ? `${lv.paybackYears}년` : '--' },
                            ];

                            const scenarioColumns = [
                              { key: 'conservative', title: '보수적', rows: buildRows(levelsData.conservative) },
                              { key: 'base', title: '기본', rows: buildRows(levelsData.base) },
                              { key: 'optimistic', title: '낙관적', rows: buildRows(levelsData.optimistic) },
                            ];
                            const labels = scenarioColumns[0].rows;

                            return <ScenarioTable columns={scenarioColumns} labels={labels} />;

                          })()}
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              )}
            </div>
        </section>
      </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AnalysisPage;
