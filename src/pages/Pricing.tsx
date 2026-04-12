import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

const features = [
  { label: '전국 유휴자산 지도 열람', free: true, pro: true },
  { label: '기본 자산 정보 확인', free: true, pro: true },
  { label: '관심 자산 저장', free: true, pro: true },
  { label: 'AI 재생 가능성 점수', free: true, pro: true },
  { label: '상세 재생 시나리오 분석', free: false, pro: true },
  { label: '재무 수익성 시뮬레이션', free: false, pro: true },
  { label: '시나리오별 비교 리포트', free: false, pro: true },
  { label: '정부 협력 경로 분석', free: false, pro: true },
  { label: '분석 레포트 저장·다운로드', free: false, pro: true },
  { label: '딜 시그널 발송', free: false, pro: true },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { user, subscriptionTier } = useAuth();
  const isPro = subscriptionTier === 'pro';

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold mb-3">요금제 안내</h1>
          <p className="text-muted-foreground">
            Heritage Layer의 데이터 기반 부동산 재생 분석을 경험하세요.
          </p>
        </div>

        {/* Plans */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Free</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">₩0</span>
                <span className="text-sm text-muted-foreground ml-1">/ 월</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                유휴자산 탐색과 기본 분석을 무료로 시작하세요.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm">
                    {f.free ? (
                      <Check className="h-4 w-4 text-accent shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={f.free ? '' : 'text-muted-foreground/50'}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="mt-6 w-full"
                onClick={() => !user && navigate('/about')}
                disabled={!!user}
              >
                {user ? '현재 이용 중' : '무료로 시작하기'}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-accent/50">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-semibold text-accent-foreground">
              추천
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Pro</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">₩49,000</span>
                <span className="text-sm text-muted-foreground ml-1">/ 월</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                심층 분석과 딜 연결까지, 모든 기능을 활용하세요.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent shrink-0" />
                    <span>{f.label}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                onClick={() => {
                  // Future: integrate payment
                  if (!user) navigate('/about');
                }}
                disabled={isPro}
              >
                {isPro ? '현재 이용 중' : 'Pro 구독 시작하기'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ-like note */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>구독은 언제든 해지할 수 있으며, 해지 후에도 결제 기간까지 이용 가능합니다.</p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
