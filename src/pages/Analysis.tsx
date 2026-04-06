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
import { TrendingUp, FileText, BarChart3, Building2 } from 'lucide-react';

// 알고리즘 모듈 연동
import { calculateScore, type AssetInput, type ScoringResult } from '@/algorithm/scoring/scoring';
import { calculateFinancials, compareScenarios, type FinancialInput, type ScenarioComparison } from '@/algorithm/financial/irr-calculator';
import { analyzeDealSignal, type DealSignalResult } from '@/algorithm/deal-signal/deal-signal';

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
      const { data } = await supabase.from('assets').select('*').eq('id', assetId).single();
      setAsset(data);
      setLoading(false);
    };
    fetchAsset();
  }, [assetId]);

  // 알고리즘 결과 계산 (asset 변경 시 자동 재계산)
  const scoringResult: ScoringResult | null = useMemo(() => {
    if (!asset) return null;
    const input: AssetInput = {
      address: asset.address,
      asset_type: asset.asset_type,
      zoning: asset.zoning,
      building_coverage: asset.building_coverage,
      floor_area_ratio: asset.floor_area_ratio,
      land_area: asset.land_area,
      idle_years: asset.idle_years,
      ownership_type: asset.ownership_type,
      grade: asset.grade,
      gov_cooperation: asset.gov_cooperation,
    };
    return calculateScore(input);
  }, [asset]);

  const scenarioComparison: ScenarioComparison | null = useMemo(() => {
    if (!asset) return null;
    const input: FinancialInput = {
      landArea: asset.land_area ?? 0,
      buildingCoverage: asset.building_coverage ?? 0,
      floorAreaRatio: asset.floor_area_ratio ?? 0,
      acquisitionCost: 0,  // TODO: 사용자 입력 또는 추정값
      renovationCost: 0,
      annualRevenue: 0,
      annualExpense: 0,
      holdingPeriodYears: 10,
    };
    return compareScenarios(input);
  }, [asset]);

  const dealSignal: DealSignalResult | null = useMemo(() => {
    if (!asset) return null;
    return analyzeDealSignal(asset.asset_type, asset.ownership_type, asset.gov_cooperation);
  }, [asset]);

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

  const formatNumber = (n: number) => n ? n.toLocaleString() : '--';
  const formatPercent = (n: number) => n ? `${n.toFixed(1)}%` : '--';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            {asset.grade && <GradeBadge grade={asset.grade} className="h-9 w-9 text-sm" />}
            <Badge variant="secondary">{asset.asset_type}</Badge>
            {scoringResult && (
              <Badge variant="outline">종합 {scoringResult.totalScore}점</Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold">{asset.address}</h1>
          <p className="mt-1 text-sm text-muted-foreground">방치 기간: {asset.idle_years ?? '-'}년</p>
        </div>
      </div>

      {/* Free section — 기본 자산 정보 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: '재생 등급', value: asset.grade ?? '-' },
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

      {/* Scoring 세부 점수 (Free) */}
      {scoringResult && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">스코어링 세부 점수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: '입지', value: scoringResult.breakdown.locationScore },
                { label: '상태', value: scoringResult.breakdown.conditionScore },
                { label: '규제', value: scoringResult.breakdown.regulationScore },
                { label: '정부협력', value: scoringResult.breakdown.govCoopScore },
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

      {/* Pro Sections */}
      <div className="space-y-6">
        {/* Section 1 — 재생 시나리오 (scoring 알고리즘 연동) */}
        <ProLockOverlay locked={!isPro}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-accent" /> 재생 방향성 시나리오
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {(scoringResult?.scenarios.length
                  ? scoringResult.scenarios
                  : [
                      { title: '복합문화공간', description: '시나리오 설명이 여기에 표시됩니다', estimatedIrr: null, confidence: 'medium' as const },
                      { title: '코워킹 허브', description: '시나리오 설명이 여기에 표시됩니다', estimatedIrr: null, confidence: 'medium' as const },
                      { title: '로컬 관광시설', description: '시나리오 설명이 여기에 표시됩니다', estimatedIrr: null, confidence: 'medium' as const },
                    ]
                ).map((scenario) => (
                  <Card key={scenario.title} className="bg-muted/50">
                    <CardContent className="p-4">
                      <h4 className="font-medium">{scenario.title}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{scenario.description}</p>
                      <p className="mt-2 text-sm font-semibold text-accent">
                        예상 수익률: {scenario.estimatedIrr != null ? `${scenario.estimatedIrr}%` : '--%'}
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        신뢰도: {scenario.confidence === 'high' ? '높음' : scenario.confidence === 'medium' ? '보통' : '낮음'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </ProLockOverlay>

        {/* Section 2 — 재무 수익성 (irr-calculator 연동) */}
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
                    { label: '투자회수기간', value: scenarioComparison?.base.paybackPeriod ? `${scenarioComparison.base.paybackPeriod}년` : '--' },
                    { label: '예상 매출', value: `${formatNumber(scenarioComparison?.base.estimatedRevenue ?? 0)}원` },
                    { label: '영업이익', value: `${formatNumber(scenarioComparison?.base.operatingProfit ?? 0)}원` },
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

        {/* Section 3 — 시나리오 비교표 (compareScenarios 연동) */}
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
                      c: `${formatNumber(scenarioComparison?.conservative.estimatedRevenue ?? 0)}원`,
                      b: `${formatNumber(scenarioComparison?.base.estimatedRevenue ?? 0)}원`,
                      o: `${formatNumber(scenarioComparison?.optimistic.estimatedRevenue ?? 0)}원`,
                    },
                    {
                      label: 'NPV',
                      c: `${formatNumber(scenarioComparison?.conservative.npv ?? 0)}원`,
                      b: `${formatNumber(scenarioComparison?.base.npv ?? 0)}원`,
                      o: `${formatNumber(scenarioComparison?.optimistic.npv ?? 0)}원`,
                    },
                    {
                      label: '회수기간',
                      c: scenarioComparison?.conservative.paybackPeriod ? `${scenarioComparison.conservative.paybackPeriod}년` : '--',
                      b: scenarioComparison?.base.paybackPeriod ? `${scenarioComparison.base.paybackPeriod}년` : '--',
                      o: scenarioComparison?.optimistic.paybackPeriod ? `${scenarioComparison.optimistic.paybackPeriod}년` : '--',
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

        {/* Section 4 — 정부협력 경로 (deal-signal 연동) */}
        <ProLockOverlay locked={!isPro}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-accent" /> 정부협력 경로
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {dealSignal?.govRoute ? (
                <>
                  <p><strong>수의계약 조건:</strong> {dealSignal.govRoute.directContractCondition}</p>
                  <p><strong>민간제안 절차:</strong> {dealSignal.govRoute.privateProposaProcess}</p>
                  <p><strong>예상 소요 기간:</strong> {dealSignal.govRoute.estimatedTimeline}</p>
                  {dealSignal.govRoute.applicablePrograms.length > 0 && (
                    <div>
                      <strong>적용 가능 프로그램:</strong>
                      <ul className="mt-1 list-disc pl-5">
                        {dealSignal.govRoute.applicablePrograms.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p><strong>수의계약 조건:</strong> 알고리즘 구현 후 표시됩니다</p>
                  <p><strong>민간제안 절차:</strong> 알고리즘 구현 후 표시됩니다</p>
                </>
              )}
              {dealSignal && (
                <Badge variant={dealSignal.dealReadiness === 'ready' ? 'default' : 'outline'} className="mt-2">
                  딜 준비 상태: {dealSignal.dealReadiness === 'ready' ? '준비 완료' : dealSignal.dealReadiness === 'conditional' ? '조건부' : '미준비'}
                </Badge>
              )}
            </CardContent>
          </Card>
        </ProLockOverlay>
      </div>

      {/* Bottom buttons */}
      <div className="mt-8 flex flex-wrap gap-3">
        {isPro && user && (
          <Button onClick={handleDealInterest}>딜 관심 표명</Button>
        )}
        {!isPro && (
          <Button onClick={() => navigate('/about')}>Pro 구독 시작하기</Button>
        )}
        <Button variant="outline" onClick={() => navigate('/properties')}>
          목록으로 돌아가기
        </Button>
      </div>
    </div>
  );
};

export default AnalysisPage;
