import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Seo from '@/components/common/Seo';

type Status = 'processing' | 'success' | 'failed';

const TossUnlockSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('processing');
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  const assetId = params.get('assetId');
  const paymentKey = params.get('paymentKey');
  const orderId = params.get('orderId');
  const amount = params.get('amount');

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (!assetId || !paymentKey || !orderId || !amount) {
      setError('필수 파라미터가 누락되었습니다.');
      setStatus('failed');
      return;
    }

    (async () => {
      const { data, error: invokeErr } = await supabase.functions.invoke('toss-confirm-unlock', {
        body: { assetId, paymentKey, orderId, amount: Number(amount) },
      });
      if (invokeErr || data?.error) {
        setError(data?.error ?? invokeErr?.message ?? '결제 처리에 실패했습니다.');
        setStatus('failed');
        return;
      }
      setStatus('success');
    })();
  }, [assetId, paymentKey, orderId, amount]);

  return (
    <div className="min-h-screen px-4 pb-20 pt-24">
      <Seo title="보고서 결제 완료 — Heritage Layer" description="상세 보고서 결제가 완료되었습니다." path="/checkout/toss/unlock/success" />
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>
              {status === 'processing' && '결제 처리 중'}
              {status === 'success' && '결제가 완료되었습니다'}
              {status === 'failed' && '결제 실패'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {status === 'processing' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                토스 결제 승인 및 잠금 해제 중...
              </div>
            )}
            {status === 'success' && (
              <>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  해당 자산의 상세 보고서가 열렸습니다.
                </div>
                <Button className="w-full" onClick={() => navigate(`/analysis?id=${assetId}`)}>
                  상세 분석으로 이동
                </Button>
              </>
            )}
            {status === 'failed' && (
              <>
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  {error ?? '결제에 실패했습니다.'}
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate(-1)}>
                  돌아가기
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TossUnlockSuccess;
