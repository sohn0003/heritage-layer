import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import Seo from '@/components/common/Seo';

const TossFail = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const message = params.get('message') ?? '결제가 취소되었거나 실패했습니다.';
  const code = params.get('code');

  return (
    <div className="min-h-screen px-4 pb-20 pt-24">
      <Seo title="결제 실패 — Heritage Layer" path="/checkout/toss/fail" />
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" /> 결제 실패
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">{message}</p>
            {code && <p className="text-xs text-muted-foreground">코드: {code}</p>}
            <Button className="w-full" onClick={() => navigate('/pricing')}>
              요금제로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TossFail;
