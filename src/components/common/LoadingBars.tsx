/**
 * 로고 형태의 스틱 바가 순차적으로 채워지는 로딩 모션.
 */
const BARS = [0, 1, 2, 3, 4];

const LoadingBars = ({ className = '' }: { className?: string }) => (
  <div className={`flex min-h-[50vh] items-center justify-center ${className}`} role="status" aria-label="로딩 중">
    <div className="flex items-end gap-1.5">
      {BARS.map((i) => (
        <span
          key={i}
          className="relative w-1.5 overflow-hidden bg-foreground/10"
          style={{ height: `${16 + i * 8}px` }}
        >
          <span
            className="absolute inset-x-0 bottom-0 bg-foreground/70"
            style={{
              height: '100%',
              transformOrigin: 'bottom',
              animation: `hl-bar-fill 1.1s ease-in-out ${i * 110}ms infinite`,
            }}
          />
        </span>
      ))}
    </div>
    <style>{`@keyframes hl-bar-fill {
      0% { transform: scaleY(0); }
      45% { transform: scaleY(1); }
      100% { transform: scaleY(0); }
    }`}</style>
  </div>
);

export default LoadingBars;
