import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { useAuth } from '@/contexts/AuthContext';
import { TOSS_CLIENT_KEY } from '@/lib/toss';
import { UNLOCK_REPORT_PRICE } from '@/components/payments/UnlockReportModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';

const TossUnlockCheckout = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const startedRef = useRef(false);

  const assetId = params.get('assetId') ?? '';
  const orderId = useMemo(
    () => `hlu_${(user?.id ?? 'anon').slice(0, 8)}_${Date.now()}`,
    [user?.id]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.info('로그인이 필요합니다.');
      navigate('/mypage');
      return;
    }
    if (!assetId) {
      toast.error('잘못된 접근입니다.');
      navigate(-1);
      return;
    }
    if (!TOSS_CLIENT_KEY) {
      toast.error('토스 클라이언트 키가 설정되어 있지 않습니다.');
      navigate(-1);
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    const origin = window.location.origin;
    (async () => {
      try {
        const toss = await loadTossPayments(TOSS_CLIENT_KEY);
        const payment = toss.payment({ customerKey: user.id });
        await payment.requestPayment({
          method: 'CARD',
          amount: { currency: 'KRW', value: UNLOCK_REPORT_PRICE },
          orderId,
          orderName: 'Heritage Layer 상세 보고서 1건',
          customerEmail: user.email,
          successUrl: `${origin}/checkout/toss/unlock/success?assetId=${encodeURIComponent(assetId)}`,
          failUrl: `${origin}/checkout/toss/fail`,
        });
      } catch (e: any) {
        console.error('[Toss] requestPayment failed:', e);
        if (e?.code === 'USER_CANCEL') {
          toast.info('결제가 취소되었습니다.');
        } else {
          toast.error(`토스 결제 오류: ${e?.message ?? e?.code ?? '알 수 없는 오류'}`);
        }
        navigate(-1);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user, assetId, navigate, orderId]);

  return (
    <div className="min-h-screen px-4 pb-20 pt-24">
      <Seo title="보고서 결제 — Heritage Layer" description="상세 보고서 단건 결제를 진행합니다." path="/checkout/toss/unlock" />
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>상세 보고서 결제</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Heritage Layer 상세 보고서 1건 · {UNLOCK_REPORT_PRICE.toLocaleString()}원
            </p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              토스 결제창으로 이동 중...
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate(-1)}>
              취소
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TossUnlockCheckout;
