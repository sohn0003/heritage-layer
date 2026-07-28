import { useEffect, useState } from 'react';

/**
 * 첫 접속 시 재생되는 인트로 모션.
 * 로고 형태의 막대 바들이 아래에서 위로 솟아오른 뒤 페이지로 전환됩니다.
 */
const BARS = [0, 1, 2, 3, 4];

const IntroOverlay = () => {
  const [phase, setPhase] = useState<'in' | 'out' | 'done'>(() =>
    sessionStorage.getItem('hl-intro-played') ? 'done' : 'in'
  );

  useEffect(() => {
    if (phase === 'done') return;
    sessionStorage.setItem('hl-intro-played', '1');
    const t1 = window.setTimeout(() => setPhase('out'), 900);
    const t2 = window.setTimeout(() => setPhase('done'), 1400);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center pb-[45vh] transition-opacity duration-500"
      style={{
        background: 'hsl(226 35% 10%)',
        opacity: phase === 'out' ? 0 : 1,
        pointerEvents: phase === 'out' ? 'none' : 'auto',
      }}
      aria-hidden
    >
      <div className="flex items-end gap-2">
        {BARS.map((i) => (
          <span
            key={i}
            className="w-2 origin-bottom"
            style={{
              background: 'hsl(0 0% 96%)',
              height: `${28 + i * 14}px`,
              transform: 'scaleY(0)',
              animation: `hl-bar-rise 420ms cubic-bezier(0.22,1,0.36,1) ${i * 70}ms forwards`,
            }}
          />
        ))}
      </div>
      <style>{`@keyframes hl-bar-rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }`}</style>
    </div>
  );
};

export default IntroOverlay;
