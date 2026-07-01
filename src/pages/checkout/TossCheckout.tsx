import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { useAuth } from '@/contexts/AuthContext';
import { getTossPlan, TOSS_CLIENT_KEY } from '@/lib/toss';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';

const TossCheckout = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const startedRef = useRef(false);

  const priceId = params.get('priceId') ?? '';
  const mode = params.get('mode') ?? '';
  const isUpdate = mode === 'update';
  const plan = useMemo(() => getTossPlan(priceId), [priceId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.info('로그인이 필요합니다.');
      navigate('/pricing');
      return;
    }
    if (!plan) {
      toast.error('잘못된 결제 정보입니다.');
      navigate('/pricing');
      return;
    }
    if (!TOSS_CLIENT_KEY) {
      toast.error('토스 클라이언트 키가 설정되어 있지 않습니다.');
      navigate('/pricing');
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    const customerKey = user.id; // 토스는 영문/숫자/하이픈 등 허용 (UUID OK)
    const origin = window.location.origin;

    (async () => {
      try {
        const toss = await loadTossPayments(TOSS_CLIENT_KEY);
        const payment = toss.payment({ customerKey });
        const successParams = new URLSearchParams({ priceId });
        if (isUpdate) successParams.set('mode', 'update');
        await payment.requestBillingAuth({
          method: 'CARD',
          successUrl: `${origin}/checkout/toss/success?${successParams.toString()}`,
          failUrl: `${origin}/checkout/toss/fail`,
          customerEmail: user.email,
        });
      } catch (e: any) {
        console.error('[Toss] requestBillingAuth failed:', e);
        // 사용자가 결제창을 직접 닫은 경우는 조용히 처리
        if (e?.code === 'USER_CANCEL') {
          toast.info('결제가 취소되었습니다.');
        } else {
          const detail = e?.message || e?.code || '알 수 없는 오류';
          toast.error(`토스 결제 오류: ${detail}`);
        }
        navigate('/pricing');
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user, plan, priceId, navigate]);

  return (
    <div className="min-h-screen px-4 pb-20 pt-24">
      <Seo title={isUpdate ? '결제 카드 변경 — Heritage Layer' : '토스페이먼츠 결제 — Heritage Layer'} description="토스페이먼츠 카드 등록을 진행합니다." path="/checkout/toss" />
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{isUpdate ? '결제 카드 변경' : '토스페이먼츠 카드 등록'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              {isUpdate
                ? `${plan?.orderName} · 새 결제수단으로 교체합니다. (즉시 청구 없음)`
                : `${plan?.orderName} · 월 결제 ${plan ? plan.amount.toLocaleString() : 0}원`}
            </p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              토스 결제창으로 이동 중...
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate('/pricing')}>
              취소하고 요금제로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TossCheckout;
