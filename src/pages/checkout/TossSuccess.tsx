import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Seo from '@/components/common/Seo';

type Status = 'processing' | 'success' | 'failed';

const TossSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshTier } = useAuth();
  const [status, setStatus] = useState<Status>('processing');
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const authKey = params.get('authKey');
    const customerKey = params.get('customerKey');
    const priceId = params.get('priceId');

    if (!authKey || !customerKey || !priceId) {
      setError('필수 파라미터가 누락되었습니다.');
      setStatus('failed');
      return;
    }

    (async () => {
      const { data, error: invokeErr } = await supabase.functions.invoke('toss-issue-billing-key', {
        body: { authKey, customerKey, priceId },
      });
      if (invokeErr || data?.error) {
        setError(data?.error ?? invokeErr?.message ?? '결제 처리에 실패했습니다.');
        setStatus('failed');
        return;
      }
      await refreshTier();
      setStatus('success');
    })();
  }, [params, refreshTier]);

  return (
    <div className="min-h-screen px-4 pb-20 pt-24">
      <Seo title="결제 완료 — Heritage Layer" path="/checkout/toss/success" />
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>
              {status === 'processing' && '결제 처리 중'}
              {status === 'success' && '구독이 시작되었습니다'}
              {status === 'failed' && '결제 실패'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {status === 'processing' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                토스 빌링키 발급 및 첫 결제 승인 중...
              </div>
            )}
            {status === 'success' && (
              <>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  결제가 정상적으로 완료되었습니다.
                </div>
                <Button className="w-full" onClick={() => navigate('/mypage')}>마이페이지로 이동</Button>
              </>
            )}
            {status === 'failed' && (
              <>
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  {error ?? '결제에 실패했습니다.'}
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate('/pricing')}>
                  요금제로 돌아가기
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TossSuccess;
