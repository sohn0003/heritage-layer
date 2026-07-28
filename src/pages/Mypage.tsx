import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Star, FileText, User, ArrowRight, Handshake, LogOut, Building2, Inbox } from 'lucide-react';
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

const Section = ({ icon: Icon, title, children, action }: { icon: any; title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <section className="border-t border-neutral-200 pt-8">
    <div className="mb-5 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-medium text-neutral-900">
        <Icon className="h-4 w-4 text-neutral-400" /> {title}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

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
        supabase.from('saved_assets').select('id, asset_id, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('deal_signals').select('id, asset_id, signal_type, admin_status, admin_response, created_at').eq('user_id', user.id).eq('signal_type', 'deal_interest').order('created_at', { ascending: false }),
      ]);
      if (profile) setProfileName(profile.name || profile.email || '');
      const assetIds = Array.from(new Set([...(saved || []).map((s) => s.asset_id), ...(signals || []).map((s) => s.asset_id)]));
      let assets: AssetLite[] = [];
      if (assetIds.length) {
        const { data } = await supabase.from('assets_public').select('id, address, asset_type, grade').in('id', assetIds);
        assets = data || [];
      }
      setSavedAssets((saved || []).map((s) => ({ ...s, asset: assets.find((a) => a.id === s.asset_id) })));
      setDealSignals((signals || []).map((s) => ({ ...s, asset: assets.find((a) => a.id === s.asset_id) })));
    };
    fetchData();
  }, [user]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center pt-16"><p className="text-muted-foreground">로딩 중...</p></div>;
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
    <div className="min-h-screen bg-white text-neutral-900 pt-24 pb-20">
      <Seo title="마이페이지 — Heritage Layer" description="저장한 매물과 딜 관심 신청 내역을 확인하세요." path="/mypage" />
      <div className="mx-auto max-w-5xl px-6 sm:px-8 space-y-10">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">My Dashboard</p>
            <h1 className="mt-2 text-2xl font-light tracking-tight">마이페이지</h1>
            <p className="mt-2 text-sm leading-[1.9] text-neutral-500">
              {profileName ? `${profileName}님, ` : ''}저장한 매물과 관심 신청 현황을 한눈에 확인하세요.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-neutral-500 hover:text-neutral-900">
            <LogOut className="h-4 w-4" /> 로그아웃
          </Button>
        </div>

        {/* 2단 레이아웃 */}
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
          {/* Account */}
          <Section icon={User} title="계정 정보">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <dt className="text-neutral-500">이메일</dt>
                <dd>{user.email}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <dt className="text-neutral-500">닉네임</dt>
                <dd>{profileName || '미설정'}</dd>
              </div>
            </dl>
          </Section>

          {/* Admin */}
          {isAdmin && (
            <Section icon={Inbox} title="관심 상담 신청 관리" action={
              <Button size="sm" variant="ghost" onClick={() => navigate('/admin/signals')} className="gap-1">
                바로가기 <ArrowRight className="h-4 w-4" />
              </Button>
            }>
              <p className="text-sm leading-[1.9] text-neutral-500">사용자가 신청한 관심 상담 내역을 확인하고 처리하세요.</p>
            </Section>
          )}

          {/* Saved */}
          <Section icon={Star} title="관심 자산">
            {savedAssets.length === 0 ? (
              <div className="py-8 text-sm text-neutral-500">
                <p>아직 관심 설정한 자산이 없습니다.</p>
                <Button variant="link" onClick={() => navigate('/properties')} className="mt-1 px-0">
                  자산 탐색하기 <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {savedAssets.map((item) => (
                  <li key={item.id}
                    className="flex cursor-pointer items-center justify-between py-3.5 transition-colors hover:text-primary"
                    onClick={() => navigate(`/analysis?id=${item.asset_id}`)}>
                    <div>
                      <p className="text-sm leading-snug">{item.asset?.address || '주소 정보 없음'}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {item.asset?.asset_type || '-'} · 등급 {item.asset?.grade || '-'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-400" />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Deal signals */}
          <Section icon={Handshake} title="딜 관심 신청 내역">
            {dealSignals.length === 0 ? (
              <div className="py-8 text-sm text-neutral-500">
                <p>아직 관심 표명한 딜이 없습니다.</p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {dealSignals.map((s) => (
                  <li key={s.id}
                    className="cursor-pointer py-3.5 transition-colors hover:text-primary"
                    onClick={() => navigate(`/analysis?id=${s.asset_id}`)}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm leading-snug">{s.asset?.address || '주소 정보 없음'}</p>
                      <span className={`shrink-0 text-[11px] px-2 py-0.5 border ${
                        s.admin_status === 'completed' ? 'border-emerald-500/40 text-emerald-600'
                        : s.admin_status === 'rejected' ? 'border-red-500/40 text-red-600'
                        : s.admin_status === 'in_progress' ? 'border-primary/40 text-primary'
                        : 'border-neutral-200 text-neutral-500'
                      }`}>{statusLabel(s.admin_status)}</span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {s.asset?.asset_type || '-'} · 신청일 {new Date(s.created_at).toLocaleDateString('ko-KR')}
                    </p>
                    {s.admin_response && (
                      <p className="mt-2 border-l-2 border-primary/40 pl-3 text-xs leading-[1.9] text-neutral-500">
                        관리자 응답: {s.admin_response}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Reports placeholder */}
          <Section icon={FileText} title="저장된 레포트">
            <p className="py-6 text-sm text-neutral-500">준비 중입니다.</p>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default Mypage;
