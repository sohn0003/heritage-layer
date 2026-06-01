import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planLabel: string;
  onSelectPaddle: () => void;
}

const PaymentMethodModal = ({ open, onOpenChange, planLabel, onSelectPaddle }: Props) => {
  const handlePaddle = () => {
    onOpenChange(false);
    onSelectPaddle();
  };

  const handleToss = () => {
    toast.info('토스페이먼츠 결제는 곧 지원될 예정입니다.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>결제수단 선택</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{planLabel}</span> 결제를 진행할 방법을 선택해 주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          {/* Paddle */}
          <button
            type="button"
            onClick={handlePaddle}
            className="group flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-accent hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-md font-bold text-base"
                style={{ backgroundColor: '#FDDD35', color: '#0A0E27' }}
              >
                P
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Paddle</span>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Check className="h-3 w-3" /> 사용 가능
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">해외 카드 · 글로벌 결제</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-accent">선택 →</span>
          </button>

          {/* Toss Payments */}
          <button
            type="button"
            onClick={handleToss}
            className="flex w-full items-center justify-between rounded-lg border border-dashed border-border bg-muted/30 p-4 text-left opacity-70"
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-md font-bold text-base text-white"
                style={{ backgroundColor: '#0064FF' }}
              >
                toss
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">토스페이먼츠</span>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Clock className="h-3 w-3" /> 준비 중
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">국내 카드 · 계좌이체 · 간편결제</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">곧 출시</span>
          </button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          결제는 안전한 외부 결제 페이지에서 처리됩니다.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodModal;
