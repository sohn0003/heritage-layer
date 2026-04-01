import { cn } from '@/lib/utils';

const gradeColors: Record<string, string> = {
  S: 'bg-amber-400 text-amber-950',
  A: 'bg-slate-400 text-slate-950',
  B: 'bg-orange-400 text-orange-950',
  C: 'bg-gray-400 text-gray-950',
  D: 'bg-red-400 text-red-950',
};

const GradeBadge = ({ grade, className }: { grade: string; className?: string }) => {
  return (
    <span className={cn('inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', gradeColors[grade] || 'bg-muted text-muted-foreground', className)}>
      {grade}
    </span>
  );
};

export default GradeBadge;
