import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import GradeBadge from '@/components/GradeBadge';
import ProLockOverlay from '@/components/ProLockOverlay';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TrendingUp, FileText, BarChart3, Building2 } from 'lucide-react';

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
    const fetch = async () => {
      const { data } = await supabase.from('assets').select('*').eq('id', assetId).single();
      setAsset(data);
      setLoading(false);
    };
    fetch();
  }, [assetId]);

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            {asset.grade && <GradeBadge grade={asset.grade} className="h-9 w-9 text-sm" />}
            <Badge variant="secondary">{asset.asset_type}</Badge>
          </div>
          <h1 className="text-2xl font-bold">{asset.address}</h1>
          <p className="mt-1 text-sm text-muted-foreground">방치 기간: {asset.idle_years ?? '-'}년</p>
        </div>
      </div>

      {/* Free section */}
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

      {/* Pro Sections */}
      <div className="space-y-6">
        {/* Section 1 — Scenarios */}
        <ProLockOverlay locked={!isPro}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-accent" /> 재생 방향성 시나리오
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {['복합문화공간', '코워킹 허브', '로컬 관광시설'].map((title) => (
                  <Card key={title} className="bg-muted/50">
                    <CardContent className="p-4">
                      <h4 className="font-medium">{title}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">시나리오 설명이 여기에 표시됩니다</p>
                      <p className="mt-2 text-sm font-semibold text-accent">예상 수익률: --%</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </ProLockOverlay>

        {/* Section 2 — Financial */}
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
                  {['IRR', 'DSCR', '투자회수기간', '예상 매출', '영업이익'].map((label) => (
                    <TableRow key={label}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell className="text-muted-foreground">--</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </ProLockOverlay>

        {/* Section 3 — Comparison */}
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
                  {['IRR', '예상 매출', 'NPV', '회수기간'].map((label) => (
                    <TableRow key={label}>
                      <TableCell className="font-medium">{label}</TableCell>
                      <TableCell>--</TableCell>
                      <TableCell>--</TableCell>
                      <TableCell>--</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </ProLockOverlay>

        {/* Section 4 — Gov Route */}
        <ProLockOverlay locked={!isPro}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-accent" /> 정부협력 경로
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p><strong>수의계약 조건:</strong> 조건 데이터가 여기에 표시됩니다</p>
              <p><strong>민간제안 절차:</strong> 절차 데이터가 여기에 표시됩니다</p>
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
