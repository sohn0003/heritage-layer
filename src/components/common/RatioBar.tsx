import { cn } from '@/lib/utils';

interface RatioBarProps {
  label: string;          // "건폐율"
  current: number | null; // 현재 값 (%)
  legalMax: number | null;// 법정 한도 (%)
  unit?: string;
  className?: string;
}

// 현재 값 vs 법정 한도 시각화 막대
// 사용률(%)에 따라 색상이 변합니다.
const RatioBar = ({ label, current, legalMax, unit = '%', className }: RatioBarProps) => {
  const hasData = current != null && legalMax != null && legalMax > 0;
  const usage = hasData ? Math.min((current! / legalMax!) * 100, 100) : 0;

  const barColor =
    usage < 50 ? 'bg-emerald-500'
    : usage < 80 ? 'bg-amber-500'
    : 'bg-rose-500';

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {hasData ? (
          <span className="text-xs tabular-nums">
            <span className="font-semibold text-foreground">{current}{unit}</span>
            <span className="mx-1 text-muted-foreground">/</span>
            <span className="text-muted-foreground">법정 {legalMax}{unit}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">정보 없음</span>
        )}
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out', barColor)}
          style={{ width: `${usage}%` }}
        />
      </div>
      {hasData && (
        <div className="text-right text-[10px] text-muted-foreground">사용률 {usage.toFixed(0)}%</div>
      )}
    </div>
  );
};

export default RatioBar;
