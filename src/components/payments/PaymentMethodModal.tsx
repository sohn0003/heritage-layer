import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import paddleLogo from '@/assets/paddle-logo.png.asset.json';
import tossLogo from '@/assets/toss-payments-logo.png.asset.json';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planLabel: string;
  onSelectPaddle: () => void;
  onSelectToss?: () => void;
}

const PaymentMethodModal = ({ open, onOpenChange, planLabel, onSelectPaddle, onSelectToss }: Props) => {
  const handlePaddle = () => {
    onOpenChange(false);
    onSelectPaddle();
  };

  const handleToss = () => {
    onOpenChange(false);
    onSelectToss?.();
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

        <div className="mt-2 grid grid-cols-2 gap-3">
          {/* Paddle */}
          <button
            type="button"
            onClick={handlePaddle}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-6 transition-all hover:border-accent hover:shadow-md"
          >
            <div className="flex items-center gap-2">
              <img src={paddleLogo.url} alt="Paddle" className="h-10 w-10 rounded-md" />
              <span className="text-lg font-semibold">Paddle</span>
            </div>
            <span className="text-xs text-muted-foreground">해외 카드 · 글로벌 결제</span>
          </button>

          {/* Toss Payments */}
          <button
            type="button"
            onClick={handleToss}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-6 transition-all hover:border-accent hover:shadow-md"
          >
            <img src={tossLogo.url} alt="Toss Payments" className="h-10 object-contain" />
            <span className="text-xs text-muted-foreground">국내 카드 · 계좌이체 · 간편결제</span>
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
