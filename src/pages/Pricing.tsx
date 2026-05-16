import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

type TierKey = 'free' | 'pro' | 'enterprise';
type EnterpriseBilling = 'monthly' | 'yearly';

interface FeatureRow {
  label: string;
  free: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

const features: FeatureRow[] = [
  { label: '전국 유휴자산 지도 열람', free: true, pro: true, enterprise: true },
  { label: '기본 자산 정보 (주소·면적·용도지역·방치기간)', free: true, pro: true, enterprise: true },
  { label: '재생 가능성 등급 (S~D)', free: true, pro: true, enterprise: true },
  { label: '정부협력 가능 여부 표시', free: 'O/X', pro: '상세 경로', enterprise: '상세 경로' },
  { label: '관심 자산 저장', free: '최대 5개', pro: '무제한', enterprise: '무제한' },
  { label: '스코어링 전체 근거 (블록별 점수·이유)', free: false, pro: true, enterprise: true },
  { label: '1·2·3순위 개발 시나리오 자동 추천', free: false, pro: true, enterprise: true },
  { label: 'IRR·DSCR·투자회수기간 시뮬레이션', free: false, pro: true, enterprise: true },
  { label: '시나리오 비교 리포트 (3컬럼)', free: false, pro: true, enterprise: true },
  { label: '분석 레포트 PDF 다운로드', free: false, pro: '1페이지', enterprise: '풀 리포트' },
  { label: '딜 관심 표명 (담당자 알림)', free: false, pro: true, enterprise: true },
  { label: '벌크 자산 분석 (지역·등급·용도 일괄 + 엑셀)', free: false, pro: false, enterprise: '최대 100건/회' },
  { label: '분기 시장 인텔리전스 리포트', free: false, pro: false, enterprise: '분기별' },
  { label: '자산 검증 리포트 (현장 실사·서면 보고서)', free: false, pro: false, enterprise: '연 2건 포함' },
  { label: '프로젝트 초기 자문 (60분)', free: false, pro: false, enterprise: '프로젝트당 1회' },
];

const renderCell = (v: boolean | string) => {
  if (v === true) return <Check className="h-4 w-4 text-accent shrink-0" />;
  if (v === false) return <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />;
  return <span className="text-xs font-medium text-foreground">{v}</span>;
};

const Pricing = () => {
  const navigate = useNavigate();
  const { user, subscriptionTier } = useAuth();
  const { openCheckout, loading } = usePaddleCheckout();
  const [entBilling, setEntBilling] = useState<EnterpriseBilling>('monthly');
  const currentTier: TierKey = subscriptionTier;

  const startCheckout = async (priceId: string) => {
    if (!user) {
      navigate('/about');
      return;
    }
    try {
      await openCheckout({
        priceId,
        customerEmail: user.email,
        customData: { userId: user.id },
        successUrl: `${window.location.origin}/mypage?checkout=success`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '결제 창을 열 수 없습니다.';
      toast.error(msg);
    }
  };

  const tiers: Array<{
    key: TierKey;
    name: string;
    price: string;
    priceNote: string;
    tagline: string;
    target: string;
    badge?: string;
    cta: { label: string; onClick: () => void; disabled?: boolean; variant?: 'default' | 'outline' };
    highlight?: boolean;
  }> = [
    {
      key: 'free',
      name: 'Free',
      price: '₩0',
      priceNote: '/ 월',
      tagline: '유휴자산 탐색과 기본 정보 확인',
      target: '진입 채널 · 모든 사용자',
      cta: {
        label: currentTier !== 'free' ? '상위 플랜 이용 중' : user ? '현재 이용 중' : '무료로 시작하기',
        onClick: () => !user && navigate('/about'),
        disabled: !!user,
        variant: 'outline',
      },
    },
    {
      key: 'pro',
      name: 'Pro',
      price: '₩39,000',
      priceNote: '/ 월',
      tagline: '심층 분석과 재무 시뮬레이션',
      target: '개인 투자자 · 소형 운영자 · 디벨로퍼 예비 창업자',
      badge: '추천',
      highlight: true,
      cta: {
        label: currentTier === 'pro' || currentTier === 'enterprise'
          ? '이용 중'
          : loading ? '결제창 여는 중...' : 'Pro 구독 시작하기',
        onClick: () => startCheckout('pro_monthly'),
        disabled: currentTier === 'pro' || currentTier === 'enterprise' || loading,
      },
    },
    {
      key: 'enterprise',
      name: 'Enterprise',
      price: entBilling === 'yearly' ? '₩3,000,000' : '₩300,000',
      priceNote: entBilling === 'yearly' ? '/ 년 (약 17% 절약)' : '/ 월',
      tagline: '정보 + 실행 지원 · 현장 검증 포함',
      target: '중소 시행사 · 패밀리 오피스 · 자산운용사 · 기관 투자자',
      badge: '기업·기관',
      cta: {
        label: currentTier === 'enterprise'
          ? '이용 중'
          : loading ? '결제창 여는 중...' : `Enterprise ${entBilling === 'yearly' ? '연간' : '월간'} 시작하기`,
        onClick: () => startCheckout(entBilling === 'yearly' ? 'enterprise_yearly' : 'enterprise_monthly'),
        disabled: currentTier === 'enterprise' || loading,
      },
    },
  ];

  return (
    <div className="min-h-screen px-4 pb-20 pt-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-14 text-center">
          <h1 className="font-serif text-4xl font-semibold tracking-tight">요금제 안내</h1>
          <p className="mt-3 text-muted-foreground">
            Heritage Layer의 데이터 기반 부동산 재생 분석을 단계별로 경험하세요.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.key}
              className={`relative flex flex-col ${
                tier.highlight ? 'border-accent shadow-lg md:scale-[1.02]' : ''
              }`}
            >
              {tier.badge && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold ${
                    tier.highlight
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {tier.badge}
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="ml-1 text-sm text-muted-foreground">{tier.priceNote}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{tier.tagline}</p>
                <p className="mt-1 text-xs text-muted-foreground/80">{tier.target}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                {tier.key === 'enterprise' && (
                  <div className="mb-4 inline-flex w-fit items-center gap-1 rounded-full bg-muted p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setEntBilling('monthly')}
                      className={`rounded-full px-3 py-1 transition-colors ${entBilling === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                    >
                      월간
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntBilling('yearly')}
                      className={`rounded-full px-3 py-1 transition-colors ${entBilling === 'yearly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                    >
                      연간
                    </button>
                  </div>
                )}
                <ul className="space-y-2.5 text-sm">
                  {features.map((f) => {
                    const v = f[tier.key];
                    const enabled = v !== false;
                    return (
                      <li
                        key={f.label}
                        className={`flex items-start gap-2 ${enabled ? '' : 'text-muted-foreground/50'}`}
                      >
                        <span className="mt-0.5">{renderCell(v)}</span>
                        <span className="leading-snug">{f.label}</span>
                      </li>
                    );
                  })}
                </ul>
                <Button
                  variant={tier.cta.variant ?? 'default'}
                  className="mt-6 w-full"
                  onClick={tier.cta.onClick}
                  disabled={tier.cta.disabled}
                >
                  {tier.cta.label}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bridge Solution banner */}
        <div className="mt-14">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Bridge Solution
                </p>
                <h3 className="mt-1 font-serif text-xl font-semibold">
                  정보를 넘어, 실행까지 — 프로젝트 단위 실행 지원
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  사업성 검토부터 인허가·금융 조달, 전체 PM까지. 3단계 레벨로 필요한 만큼 선택하세요.
                </p>
              </div>
              <Button onClick={() => navigate('/bridge')} className="shrink-0">
                Bridge Solution 보기 <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footnote */}
        <div className="mt-10 space-y-1 text-center text-sm text-muted-foreground">
          <p>구독은 언제든 해지할 수 있으며, 해지 후에도 결제 기간까지 이용 가능합니다.</p>
          <p>Enterprise는 계약 기반으로 운영되며, 문의 후 별도 안내드립니다.</p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
