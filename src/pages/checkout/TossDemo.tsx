import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, CreditCard, Info } from 'lucide-react';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';

// Toss 공식 문서용 공개 테스트 클라이언트 키 (심사·데모용)
// https://docs.tosspayments.com/reference/using-api/api-keys
const TOSS_TEST_CLIENT_KEY = 'test_ck_docs_Ovk5rk1EwkEbP0W43n07xlzm';
const DEMO_AMOUNT = 1000; // 1,000원 테스트 결제

const TossDemo = () => {
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const status = params.get('status'); // 'success' | 'fail' | null
  const orderId = useMemo(() => `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, []);

  const startPayment = async (method: 'CARD' | 'TRANSFER') => {
    setLoading(true);
    try {
      const toss = await loadTossPayments(TOSS_TEST_CLIENT_KEY);
      // 비회원 결제: customerKey 대신 ANONYMOUS 사용
      const payment = toss.payment({ customerKey: 'ANONYMOUS' });
      const origin = window.location.origin;
      const successUrl = `${origin}/checkout/toss/demo?status=success`;
      const failUrl = `${origin}/checkout/toss/demo?status=fail`;

      if (method === 'CARD') {
        await payment.requestPayment({
          method: 'CARD',
          amount: { currency: 'KRW', value: DEMO_AMOUNT },
          orderId,
          orderName: 'Heritage Layer 결제창 테스트 (1,000원)',
          successUrl,
          failUrl,
          card: {
            useEscrow: false,
            flowMode: 'DEFAULT',
            useCardPoint: false,
            useAppCardOnly: false,
          },
        });
      } else if (method === 'TRANSFER') {
        await payment.requestPayment({
          method: 'TRANSFER',
          amount: { currency: 'KRW', value: DEMO_AMOUNT },
          orderId,
          orderName: 'Heritage Layer 결제창 테스트 (1,000원)',
          successUrl,
          failUrl,
        });
      }

    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : '결제창을 열 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 결과 안내
  useEffect(() => {
    if (status === 'success') {
      toast.success('테스트 결제 인증이 완료되었습니다. (실제 청구는 발생하지 않습니다)');
    } else if (status === 'fail') {
      const msg = params.get('message') ?? '결제가 취소되었거나 실패했습니다.';
      toast.error(msg);
    }
  }, [status, params]);

  return (
    <div className="min-h-screen px-4 pb-20 pt-24">
      <Seo
        title="결제창 테스트 — Heritage Layer"
        description="Heritage Layer 결제 시스템(토스페이먼츠) 연동 확인용 테스트 페이지입니다."
        path="/checkout/toss/demo"
      />
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              결제창 테스트 (토스페이먼츠)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div className="rounded-md border border-accent/30 bg-accent/5 p-3 text-xs leading-relaxed">
              <div className="mb-1 flex items-center gap-1 font-semibold text-foreground">
                <Info className="h-3.5 w-3.5" /> 안내
              </div>
              <p className="text-muted-foreground">
                이 페이지는 토스페이먼츠 결제창 연동을 확인하기 위한 <b>테스트 페이지</b>입니다.
                테스트 클라이언트 키를 사용하므로 <b>실제 카드 청구는 발생하지 않습니다.</b>
              </p>
              <p className="mt-2 text-muted-foreground">
                실제 구독 결제는 <a href="/pricing" className="underline">요금제 페이지</a>에서 진행해 주세요.
              </p>
            </div>

            <div className="rounded-md border bg-muted/30 p-3 text-xs">
              <p className="text-muted-foreground">테스트 주문</p>
              <p className="mt-1 font-medium text-foreground">
                Heritage Layer 결제창 테스트 · 1,000원
              </p>
            </div>

            {status === 'success' && (
              <div className="flex items-start gap-2 rounded-md border border-green-500/30 bg-green-500/5 p-3 text-xs">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <div>
                  <p className="font-semibold text-foreground">결제창 인증 성공</p>
                  <p className="mt-1 text-muted-foreground">
                    토스 테스트 환경에서 결제 인증이 정상 완료되었습니다. (실제 청구 없음)
                  </p>
                </div>
              </div>
            )}

            {status === 'fail' && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <p className="font-semibold text-foreground">결제가 완료되지 않았습니다</p>
                  <p className="mt-1 text-muted-foreground">
                    {params.get('message') ?? '결제가 취소되었거나 실패했습니다. 다시 시도해 주세요.'}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => startPayment('CARD')}
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                신용카드로 테스트 결제
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => startPayment('TRANSFER')}
                disabled={loading}
              >
                계좌이체로 테스트 결제
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => startPayment('EASY_PAY')}
                disabled={loading}
              >
                간편결제로 테스트 결제
              </Button>
            </div>

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              본 페이지는 토스페이먼츠 전자결제 심사 확인 및 결제창 정상 동작 점검을 위한 데모입니다.
              상점: (주)더레이어코퍼레이션 · 사업자등록번호 354-87-02814 · 통신판매업 신고 2024-서울강남-01639
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TossDemo;
