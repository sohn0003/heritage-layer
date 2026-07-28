import { cn } from '@/lib/utils';

interface RatioBarProps {
  label: string;          // "건폐율"
  current: number | null; // 현재 값 (%)
  legalMax: number | null;// 법정 한도 (%)
  unit?: string;
  className?: string;
  tone?: 'default' | 'dark';
}

// 현재 값 vs 법정 한도 시각화 막대
// 사용률(%)에 따라 색상이 변합니다.
const RatioBar = ({ label, current, legalMax, unit = '%', className, tone = 'default' }: RatioBarProps) => {
  const hasData = current != null && legalMax != null && legalMax > 0;
  let usage = 0;
  if (current != null && legalMax != null && legalMax > 0) {
    usage = Math.min((current / legalMax) * 100, 100);
  }

  const barColor = tone === 'dark'
    ? 'bg-primary-foreground/80'
    : usage < 50 ? 'bg-secondary-foreground/35'
      : usage < 80 ? 'bg-primary/65'
      : 'bg-primary';
  const mutedText = tone === 'dark' ? 'text-primary-foreground/55' : 'text-muted-foreground';
  const strongText = tone === 'dark' ? 'text-primary-foreground' : 'text-foreground';
  const trackColor = tone === 'dark' ? 'bg-primary-foreground/10' : 'bg-muted';

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between">
        <span className={cn('text-xs font-medium', mutedText)}>{label}</span>
        {hasData ? (
          <span className="text-xs tabular-nums">
            <span className={cn('font-semibold', strongText)}>{current}{unit}</span>
            <span className={cn('mx-1', mutedText)}>/</span>
            <span className={mutedText}>법정 {legalMax}{unit}</span>
          </span>
        ) : (
          <span className={cn('text-xs', mutedText)}>정보 없음</span>
        )}
      </div>
      <div className={cn('relative h-2.5 overflow-hidden rounded-none', trackColor)}>
        <div
          className={cn('absolute inset-y-0 left-0 rounded-none transition-[width] duration-700 ease-out', barColor)}
          style={{ width: `${usage}%` }}
        />
      </div>
      {hasData && (
        <div className={cn('text-right text-[10px]', mutedText)}>사용률 {usage.toFixed(0)}%</div>
      )}
    </div>
  );
};

export default RatioBar;
