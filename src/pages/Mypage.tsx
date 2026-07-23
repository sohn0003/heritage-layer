import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, FileText, User, ArrowRight, Inbox, Handshake, LogOut, Building2 } from 'lucide-react';
import Seo from '@/components/common/Seo';

interface AssetLite {
  id: string;
  address: string;
  asset_type: string;
  grade: string | null;
}

interface SavedAsset {
  id: string;
  asset_id: string;
  created_at: string;
  asset?: AssetLite;
}

interface DealSignal {
  id: string;
  asset_id: string;
  signal_type: string;
  admin_status: string;
  admin_response: string | null;
  created_at: string;
  asset?: AssetLite;
}

const statusLabel = (s: string) =>
  s === 'pending' ? '검토중' : s === 'in_progress' ? '진행중' : s === 'completed' ? '완료' : s === 'rejected' ? '반려' : s;

const Mypage = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [savedAssets, setSavedAssets] = useState<SavedAsset[]>([]);
  const [dealSignals, setDealSignals] = useState<DealSignal[]>([]);
  const [profileName, setProfileName] = useState<string>('');

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [{ data: profile }, { data: saved }, { data: signals }] = await Promise.all([
        supabase.from('profiles').select('name, email').eq('id', user.id).single(),
        supabase
          .from('saved_assets')
          .select('id, asset_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('deal_signals')
          .select('id, asset_id, signal_type, admin_status, admin_response, created_at')
          .eq('user_id', user.id)
          .eq('signal_type', 'deal_interest')
          .order('created_at', { ascending: false }),
      ]);

      if (profile) setProfileName(profile.name || profile.email || '');

      const assetIds = Array.from(
        new Set([...(saved || []).map((s) => s.asset_id), ...(signals || []).map((s) => s.asset_id)])
      );

      let assets: AssetLite[] = [];
      if (assetIds.length) {
        const { data } = await supabase
          .from('assets_public')
          .select('id, address, asset_type, grade')
          .in('id', assetIds);
        assets = data || [];
      }

      setSavedAssets((saved || []).map((s) => ({ ...s, asset: assets.find((a) => a.id === s.asset_id) })));
      setDealSignals((signals || []).map((s) => ({ ...s, asset: assets.find((a) => a.id === s.asset_id) })));
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

  return (
    <div className="min-h-screen pt-24 px-4 pb-16 bg-background">
      <Seo
        title="마이페이지 — Heritage Layer"
        description="저장한 매물과 딜 관심 신청 내역을 확인하세요."
        path="/mypage"
      />
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">My Dashboard</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">마이페이지</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {profileName ? `${profileName}님, ` : ''}저장한 매물과 관심 신청 현황을 한눈에 확인하세요.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" /> 로그아웃
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="h-4 w-4" /> 관심 자산
              </div>
              <p className="mt-2 text-3xl font-semibold">{savedAssets.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Handshake className="h-4 w-4" /> 딜 관심 신청
              </div>
              <p className="mt-2 text-3xl font-semibold">{dealSignals.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-4 w-4" /> 진행중
              </div>
              <p className="mt-2 text-3xl font-semibold">
                {dealSignals.filter((s) => s.admin_status === 'in_progress' || s.admin_status === 'pending').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" /> 계정 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">이메일</span>
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">닉네임</span>
              <span className="text-sm">{profileName || '미설정'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Admin: Deal Interest Inbox */}
        {isAdmin && (
          <Card className="border-accent/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Inbox className="h-4 w-4 text-accent" />
                관심 상담 신청 관리
                <span className="ml-2 rounded-none bg-accent/10 px-2 py-0.5 text-xs text-accent">Admin</span>
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
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-accent" /> 관심 자산
            </CardTitle>
          </CardHeader>
          <CardContent>
            {savedAssets.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <Star className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p>아직 관심 설정한 자산이 없습니다.</p>
                <Button variant="link" onClick={() => navigate('/properties')} className="mt-2">
                  자산 탐색하기 <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {savedAssets.map((item) => (
                  <div
                    key={item.id}
                    className="flex cursor-pointer items-center justify-between py-3 transition-colors hover:bg-muted/50"
                    onClick={() => navigate(`/analysis?id=${item.asset_id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium">{item.asset?.address || '주소 정보 없음'}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.asset?.asset_type || '-'} · 등급 {item.asset?.grade || '-'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deal Interest Signals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Handshake className="h-4 w-4 text-accent" /> 딜 관심 신청 내역
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dealSignals.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <Handshake className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p>아직 관심 표명한 딜이 없습니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {dealSignals.map((s) => (
                  <div
                    key={s.id}
                    className="cursor-pointer py-3 transition-colors hover:bg-muted/50"
                    onClick={() => navigate(`/analysis?id=${s.asset_id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{s.asset?.address || '주소 정보 없음'}</p>
                      <span
                        className={`text-xs px-2 py-0.5 border ${
                          s.admin_status === 'completed'
                            ? 'border-emerald-500/40 text-emerald-600'
                            : s.admin_status === 'rejected'
                            ? 'border-red-500/40 text-red-600'
                            : s.admin_status === 'in_progress'
                            ? 'border-accent/40 text-accent'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {statusLabel(s.admin_status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.asset?.asset_type || '-'} · 신청일 {new Date(s.created_at).toLocaleDateString('ko-KR')}
                    </p>
                    {s.admin_response && (
                      <p className="mt-2 border-l-2 border-accent/40 pl-2 text-xs text-muted-foreground">
                        관리자 응답: {s.admin_response}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Reports (placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" /> 저장된 레포트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-sm text-muted-foreground">
              <FileText className="mx-auto mb-2 h-8 w-8 opacity-30" />
              <p>준비 중입니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Mypage;
