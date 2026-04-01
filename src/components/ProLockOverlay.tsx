import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ProLockOverlayProps {
  children: React.ReactNode;
  locked: boolean;
}

const ProLockOverlay = ({ children, locked }: ProLockOverlayProps) => {
  const navigate = useNavigate();

  if (!locked) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-background/60 backdrop-blur-[2px]">
        <Lock className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="mb-3 text-sm font-medium text-muted-foreground">Pro 구독 시 열람 가능</p>
        <Button size="sm" onClick={() => navigate('/about')}>
          Pro 구독 시작하기
        </Button>
      </div>
    </div>
  );
};

export default ProLockOverlay;
