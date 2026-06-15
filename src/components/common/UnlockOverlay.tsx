import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UnlockReportModal from '@/components/payments/UnlockReportModal';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Props {
  children: React.ReactNode;
  locked: boolean;
  assetId: string | null | undefined;
  assetLabel?: string;
}

/**
 * Pro 잠금 + 건별 결제 선택을 제공하는 오버레이.
 * locked=false면 자식 그대로 렌더.
 */
const UnlockOverlay = ({ children, locked, assetId, assetLabel }: Props) => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!locked) return <>{children}</>;

  const handleClick = () => {
    if (!user) {
      toast({ title: '로그인이 필요합니다.', description: '먼저 로그인해 주세요.' });
      navigate('/mypage');
      return;
    }
    if (!assetId) {
      toast({ title: '자산 정보가 없습니다.', variant: 'destructive' });
      return;
    }
    setOpen(true);
  };

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-background/60 backdrop-blur-[2px]">
        <Lock className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          상세 보고서 잠금 — 건당 15,000원 또는 Pro 구독
        </p>
        <Button size="sm" onClick={handleClick}>열람 옵션 보기</Button>
      </div>
      {assetId && (
        <UnlockReportModal
          open={open}
          onOpenChange={setOpen}
          assetId={assetId}
          assetLabel={assetLabel}
        />
      )}
    </div>
  );
};

export default UnlockOverlay;
