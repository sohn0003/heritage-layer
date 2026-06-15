import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Crown, Check } from 'lucide-react';

export const UNLOCK_REPORT_PRICE = 15000;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  assetLabel?: string;
}

const UnlockReportModal = ({ open, onOpenChange, assetId, assetLabel }: Props) => {
  const navigate = useNavigate();

  const handleSingle = () => {
    onOpenChange(false);
    navigate(`/checkout/toss/unlock?assetId=${encodeURIComponent(assetId)}`);
  };

  const handlePro = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>상세 보고서 열람</DialogTitle>
          <DialogDescription>
            {assetLabel ? `「${assetLabel}」 ` : ''}자산의 상세 분석을 열람하려면 아래 옵션 중 하나를 선택해 주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* 단건 결제 */}
          <button
            type="button"
            onClick={handleSingle}
            className="group flex flex-col rounded-lg border border-border bg-card p-5 text-left transition-all hover:border-accent hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <FileText className="h-6 w-6 text-foreground" />
              <Badge variant="secondary" className="text-xs">1회</Badge>
            </div>
            <p className="text-sm font-semibold">이 보고서만 보기</p>
            <p className="mt-1 text-2xl font-bold">
              ₩{UNLOCK_REPORT_PRICE.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">해당 자산 1건 영구 열람</p>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3" /> 세부 점수 항목</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3" /> IRR/수익성 시나리오</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3" /> 추천 활용 방안</li>
            </ul>
          </button>

          {/* Pro 구독 */}
          <button
            type="button"
            onClick={handlePro}
            className="group flex flex-col rounded-lg border-2 border-accent bg-card p-5 text-left transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <Crown className="h-6 w-6 text-accent" />
              <Badge className="bg-accent text-accent-foreground text-xs">추천</Badge>
            </div>
            <p className="text-sm font-semibold">Pro 구독하기</p>
            <p className="mt-1 text-2xl font-bold">
              ₩39,000<span className="text-sm font-normal text-muted-foreground">/월</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">모든 보고서 무제한 열람</p>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3" /> 전 자산 상세 분석</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3" /> 관심자산 무제한 저장</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3" /> 신규 매물 알림</li>
            </ul>
          </button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          결제는 안전한 외부 결제 페이지(토스페이먼츠)에서 처리됩니다.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default UnlockReportModal;
