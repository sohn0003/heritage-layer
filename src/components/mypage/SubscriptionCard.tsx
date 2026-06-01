import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getPaddleEnvironment } from '@/lib/paddle';
import { useAuth } from '@/contexts/AuthContext';
import { tierLabel } from '@/lib/entitlements';
import { toast } from 'sonner';

interface SubscriptionRow {
  id: string;
  status: string;
  product_id: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  paddle_customer_id: string | null;
  provider: string;
}

interface Props {
  refreshKey?: number;
}

const STATUS_LABEL: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: '활성', variant: 'default' },
  trialing: { label: '체험중', variant: 'secondary' },
  past_due: { label: '결제 실패 - 갱신 필요', variant: 'destructive' },
  paused: { label: '일시정지', variant: 'outline' },
  canceled: { label: '해지됨', variant: 'outline' },
};

const SubscriptionCard = ({ refreshKey }: Props) => {
  const { user, subscriptionTier } = useAuth();
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const env = getPaddleEnvironment();
    const fetchSub = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('subscriptions')
        .select('id, status, product_id, price_id, current_period_end, cancel_at_period_end, paddle_customer_id, provider')
        .eq('user_id', user.id)
        .eq('environment', env)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setSub(data as SubscriptionRow | null);
      setLoading(false);
    };
    fetchSub();
  }, [user, refreshKey]);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      if (sub?.provider === 'toss') {
        if (!confirm('토스페이먼츠 구독을 해지하시겠습니까? 즉시 해지되며, 다음 결제는 진행되지 않습니다.')) {
          return;
        }
        const { data, error } = await supabase.functions.invoke('toss-cancel-subscription');
        if (error || data?.error) {
          throw new Error(data?.error ?? error?.message ?? '구독 해지에 실패했습니다.');
        }
        toast.success('구독이 해지되었습니다.');
        window.location.reload();
        return;
      }
      const { data, error } = await supabase.functions.invoke('paddle-customer-portal');
      if (error || !data?.url) {
        throw new Error(error?.message || '구독 관리 페이지를 열 수 없습니다.');
      }
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setPortalLoading(false);
    }
  };

  const isFree = subscriptionTier === 'free';
  const statusInfo = sub ? STATUS_LABEL[sub.status] ?? { label: sub.status, variant: 'outline' as const } : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5" />
          구독 관리
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">현재 플랜</span>
          <span className="text-sm font-medium">{tierLabel(subscriptionTier)}</span>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : sub ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">상태</span>
              {statusInfo && <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>}
            </div>
            {sub.current_period_end && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {sub.cancel_at_period_end || sub.status === 'canceled' ? '이용 만료일' : '다음 결제일'}
                </span>
                <span className="text-sm font-medium">
                  {new Date(sub.current_period_end).toLocaleDateString('ko-KR')}
                </span>
              </div>
            )}
            {sub.cancel_at_period_end && (
              <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                구독이 기간 종료 시 해지될 예정입니다. 만료일까지는 계속 이용할 수 있습니다.
              </p>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={openPortal}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />열기 중...</>
              ) : (
                <>구독 관리 (취소 · 결제수단 변경) <ExternalLink className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </>
        ) : isFree ? (
          <>
            <p className="text-sm text-muted-foreground">
              아직 활성 구독이 없습니다. Pro 또는 Enterprise로 업그레이드하여 모든 분석 기능을 이용해보세요.
            </p>
            <Button className="w-full" onClick={() => navigate('/pricing')}>
              요금제 보기
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            관리자 권한으로 부여된 등급입니다. 별도 결제 내역이 없습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
