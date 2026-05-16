import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, FileText, User, Crown, ArrowRight, Inbox } from 'lucide-react';
import SubscriptionCard from '@/components/mypage/SubscriptionCard';
import { tierLabel } from '@/lib/entitlements';
import { toast } from 'sonner';

interface SavedAsset {
  id: string;
  asset_id: string;
  created_at: string;
  asset?: {
    address: string;
    asset_type: string;
    grade: string | null;
  };
}

const Mypage = () => {
  const { user, subscriptionTier, hasProAccess, isAdmin, loading, refreshTier } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [savedAssets, setSavedAssets] = useState<SavedAsset[]>([]);
  const [profileName, setProfileName] = useState<string>('');
  const [subRefreshKey, setSubRefreshKey] = useState(0);

  // 결제 완료 후 리다이렉트 처리 — Realtime이 누락될 경우를 대비한 보장 refetch
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      toast.success('구독이 활성화되었습니다.', { description: '결제 정보가 곧 반영됩니다.' });
      const tryRefresh = async (delay: number) => {
        setTimeout(async () => {
          await refreshTier();
          setSubRefreshKey(k => k + 1);
        }, delay);
      };
      tryRefresh(1500);
      tryRefresh(5000);
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshTier]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', user.id)
        .single();
      if (profile) {
        setProfileName(profile.name || profile.email || '');
      }

      // Fetch saved assets with asset details
      const { data: saved } = await supabase
        .from('saved_assets')
        .select('id, asset_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (saved) {
        // Fetch asset details for each saved asset
        const assetIds = saved.map(s => s.asset_id);
        const { data: assets } = await supabase
          .from('assets')
          .select('id, address, asset_type, grade')
          .in('id', assetIds);

        const enriched = saved.map(s => ({
          ...s,
          asset: assets?.find(a => a.id === s.asset_id) || undefined,
        }));
        setSavedAssets(enriched);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 pt-16">
        <p className="text-muted-foreground">로그인이 필요합니다.</p>
        <Button onClick={() => navigate('/')}>홈으로 돌아가기</Button>
      </div>
    );
  }

  const isPro = hasProAccess;
  const planLabel = tierLabel(subscriptionTier);

  const savedReports: { id: string; title: string; date: string }[] = [];

  return (
    <div className="min-h-screen pt-20 px-4 pb-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">마이페이지</h1>
          <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm">
            <Crown className={`h-4 w-4 ${isPro ? 'text-accent' : 'text-muted-foreground'}`} />
            <span className={isPro ? 'text-accent font-medium' : 'text-muted-foreground'}>
              {planLabel}
            </span>
          </div>
        </div>

        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              계정 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">이메일</span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">닉네임</span>
              <span className="text-sm font-medium">{profileName || '미설정'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">구독 등급</span>
              <span className={`text-sm font-medium ${isPro ? 'text-accent' : ''}`}>
                {planLabel}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Management */}
        <SubscriptionCard refreshKey={subRefreshKey} />

        {/* Admin: Deal Interest Inbox */}
        {isAdmin && (
          <Card className="border-accent/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Inbox className="h-5 w-5 text-accent" />
                관심 상담 신청 관리
                <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">Admin</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  사용자가 신청한 관심 상담 내역을 확인하고 처리하세요.
                </p>
                <Button onClick={() => navigate('/admin/signals')} size="sm">
                  바로가기 <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-accent" />
              관심 자산 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            {savedAssets.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Star className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p>아직 관심 설정한 자산이 없습니다.</p>
                <Button variant="link" onClick={() => navigate('/properties')} className="mt-2">
                  자산 탐색하기 <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {savedAssets.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/analysis?id=${item.asset_id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium">{item.asset?.address || '주소 정보 없음'}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.asset?.asset_type} · 등급 {item.asset?.grade || '-'}
                      </p>
                    </div>
                    <Star className="h-4 w-4 text-accent fill-accent" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              저장된 레포트
            </CardTitle>
          </CardHeader>
          <CardContent>
            {savedReports.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <FileText className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p>비어있음</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      if (!isPro) navigate('/pricing');
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium">{report.title}</p>
                      <p className="text-xs text-muted-foreground">{report.date}</p>
                    </div>
                    {!isPro && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Pro 전용
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Mypage;
