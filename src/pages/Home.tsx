import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import heroBg from '@/assets/hero-bg.jpg';
import { Button } from '@/components/ui/button';
import NaverMap from '@/components/map/NaverMap';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowRight, Search, Brain, Handshake, School, Home as HomeIcon,
  Building2, TrendingDown, Mail, MapPin, Sparkles, BarChart3,
  Database, Layers, ChevronDown,
} from 'lucide-react';
import Seo from '@/components/common/Seo';

// ─── Hooks ────────────────────────────────────────
const useInView = <T extends Element>(threshold = 0.2) => {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

// 페이지 스크롤 진행도 (0–1)
const useScrollProgress = () => {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? h.scrollTop / max : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return p;
};

const CountUp = ({ end, duration = 2000, suffix = '', decimals = 0 }: { end: number; duration?: number; suffix?: string; decimals?: number }) => {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(end * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);
  return <span ref={ref}>{decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString()}{suffix}</span>;
};

// ─── Card primitives ──────────────────────────────
// 솔리드 화이트 카드 + 입체 그림자 (가독성 우선).
// CSS 변수로 카드 내부의 text-foreground / text-muted-foreground 도 어두운 톤으로 재정의.
const glassCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(27, 46, 74, 0.08)',
  color: 'hsl(220 30% 12%)',
  ['--foreground' as any]: '220 30% 12%',
  ['--muted-foreground' as any]: '220 15% 40%',
  ['--card-foreground' as any]: '220 30% 12%',
  ['--muted' as any]: '220 15% 90%',
  boxShadow:
    '0 1px 2px rgba(27, 46, 74, 0.06), 0 8px 24px -6px rgba(27, 46, 74, 0.12), 0 24px 48px -16px rgba(27, 46, 74, 0.18)',
};
const glassDarkStyle: React.CSSProperties = {
  background: 'hsl(220 35% 14%)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  color: 'hsl(0 0% 96%)',
  boxShadow: '0 12px 40px -10px rgba(0,0,0,0.45)',
};

// 부드러운 색상 블롭 (배경 장식)
const Blob = ({ className, color }: { className?: string; color: string }) => (
  <div
    aria-hidden
    className={`pointer-events-none absolute rounded-full blur-3xl ${className ?? ''}`}
    style={{ background: color, opacity: 0.45 }}
  />
);

// ─── 막대 그래프 (가로) ─ 라인 + 그라데이션 + 트래블 하이라이트 ─
const InsightBar = ({
  label, value, max, color, suffix = '', delay = 0,
}: { label: string; value: number; max: number; color: string; suffix?: string; delay?: number }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const pct = Math.min(100, (value / max) * 100);
  const gradId = `bar-${label}-${Math.round(value)}`;
  return (
    <div ref={ref} className="group">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium tracking-tight text-foreground/85">{label}</span>
        <span className="text-xl font-semibold tabular-nums" style={{ color, textShadow: `0 0 18px ${color}55` }}>
          <CountUp end={value} suffix={suffix} />
        </span>
      </div>
      {/* 베이스 라인 (얇은 트랙) */}
      <div className="relative h-[3px] w-full overflow-visible rounded-full" style={{ background: 'hsl(var(--foreground) / 0.08)' }}>
        {/* 그라데이션 바 */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: inView ? `${pct}%` : '0%',
            background: `linear-gradient(90deg, ${color}00 0%, ${color} 30%, ${color} 70%, hsl(var(--accent)) 100%)`,
            boxShadow: `0 0 14px ${color}80, 0 0 28px ${color}40`,
            transition: `width 1700ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
          }}
        />
        {/* 트래블링 하이라이트 (반복) */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden rounded-full"
          style={{
            width: inView ? `${pct}%` : '0%',
            transition: `width 1700ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
          }}
        >
          <div
            className="absolute inset-y-0 -left-1/3 w-1/3"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
              animation: inView ? `barShine 2.4s cubic-bezier(0.45, 0, 0.55, 1) ${delay + 700}ms infinite` : 'none',
            }}
          />
        </div>
        {/* 끝점 글로우 도트 */}
        <div
          className="pointer-events-none absolute -top-[3px] h-[9px] w-[9px] -translate-x-1/2 rounded-full"
          style={{
            left: inView ? `${pct}%` : '0%',
            background: color,
            boxShadow: `0 0 0 3px ${color}30, 0 0 14px ${color}aa`,
            transition: `left 1700ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, opacity 400ms ease-out ${delay + 1200}ms`,
            opacity: inView ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
};

// ─── 도넛 차트 (소유 구분) ──────────────────────────
const DonutChart = ({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) => {
  const { ref, inView } = useInView<SVGSVGElement>();
  const r = 62;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-7">
      <div className="relative shrink-0">
        <svg ref={ref} width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
          <defs>
            {segments.map((s, i) => (
              <linearGradient key={i} id={`donutGrad-${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="1" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.7" />
              </linearGradient>
            ))}
          </defs>
          {/* 트랙 */}
          <circle cx="90" cy="90" r={r} fill="none" stroke="hsl(var(--foreground) / 0.06)" strokeWidth="14" />
          {segments.map((s, i) => {
            const len = (s.value / total) * c;
            const dash = inView ? `${Math.max(len - 2, 0)} ${c - len + 2}` : `0 ${c}`;
            const node = (
              <circle
                key={i}
                cx="90" cy="90" r={r}
                fill="none"
                stroke={`url(#donutGrad-${i})`}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                style={{
                  transition: `stroke-dasharray 1400ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 180}ms`,
                  filter: `drop-shadow(0 4px 10px ${s.color}40)`,
                }}
              />
            );
            offset += len;
            return node;
          })}
        </svg>
        {/* 중앙 라벨 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Total</span>
          <span className="mt-0.5 text-2xl font-bold tabular-nums">{total}%</span>
        </div>
      </div>
      <div className="flex-1 space-y-3">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-3 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}80` }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-semibold tabular-nums" style={{ color: s.color }}>
              {((s.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── 라인/에어리어 차트 (추이) ─ 멀티 레이어 + 트래블링 글로우 ─
const AreaTrendChart = ({ data, color }: { data: number[]; color: string }) => {
  const { ref, inView } = useInView<SVGSVGElement>();
  const W = 480, H = 220, padX = 32, padY = 32;
  const max = Math.max(...data) * 1.15;
  const stepX = (W - padX * 2) / (data.length - 1);
  const pts = data.map((v, i) => [padX + i * stepX, H - padY - (v / max) * (H - padY * 2)] as [number, number]);

  // 부드러운 cubic bezier 곡선
  const smooth = (p: [number, number][]) => {
    if (p.length < 2) return '';
    let d = `M ${p[0][0]} ${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const [x1, y1] = p[i];
      const [x2, y2] = p[i + 1];
      const mx = (x1 + x2) / 2;
      d += ` C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    }
    return d;
  };
  const linePath = smooth(pts);
  const areaPath = `${linePath} L ${W - padX} ${H - padY} L ${padX} ${H - padY} Z`;
  const lastPt = pts[pts.length - 1];

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      <defs>
        {/* 영역 그라데이션 (위→아래 페이드) */}
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="50%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        {/* 라인 그라데이션 (왼→오른 멀티 컬러) */}
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
          <stop offset="55%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="1" />
        </linearGradient>
        {/* 글로우 라인 (두꺼운 블러 라인) */}
        <linearGradient id="lineGlowGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="50%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
        </linearGradient>
        <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 그리드 라인 */}
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={padX} x2={W - padX}
          y1={padY + (H - padY * 2) * g} y2={padY + (H - padY * 2) * g}
          stroke="hsl(var(--foreground) / 0.08)" strokeDasharray="3 6" />
      ))}

      {/* 영역 (그라데이션 페이드) */}
      <path d={areaPath} fill="url(#areaGrad)"
        style={{ opacity: inView ? 1 : 0, transition: 'opacity 1400ms ease-out 400ms' }} />

      {/* 글로우 언더라인 (블러 처리된 굵은 라인) */}
      <path d={linePath} fill="none" stroke="url(#lineGlowGrad)" strokeWidth="8"
        strokeLinecap="round" strokeLinejoin="round"
        filter="url(#lineGlow)" opacity="0.7"
        strokeDasharray={1500} strokeDashoffset={inView ? 0 : 1500}
        style={{ transition: 'stroke-dashoffset 1800ms cubic-bezier(0.22, 1, 0.36, 1)' }} />

      {/* 메인 라인 */}
      <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={1500} strokeDashoffset={inView ? 0 : 1500}
        style={{ transition: 'stroke-dashoffset 1800ms cubic-bezier(0.22, 1, 0.36, 1)' }} />

      {/* 트래블링 스파클 — 라인을 따라 빛이 흐르듯 이동 */}
      {inView && (
        <circle r="3.5" fill="white" style={{ filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})` }}>
          <animateMotion dur="3.6s" repeatCount="indefinite" path={linePath} rotate="auto" />
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="3.6s" repeatCount="indefinite" />
        </circle>
      )}

      {/* 데이터 포인트 */}
      {pts.map(([x, y], i) => {
        const isLast = i === pts.length - 1;
        return (
          <g key={i} style={{ opacity: inView ? 1 : 0, transition: `opacity 400ms ease-out ${900 + i * 90}ms` }}>
            {isLast && (
              <circle cx={x} cy={y} r={10} fill={color} opacity="0.25">
                <animate attributeName="r" values="6;16;6" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2.4s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={x} cy={y} r={isLast ? 5 : 3.2}
              fill={isLast ? color : 'hsl(220 35% 8%)'}
              stroke={color} strokeWidth={isLast ? 2 : 1.6}
              style={{ filter: isLast ? `drop-shadow(0 0 10px ${color})` : 'none' }} />
          </g>
        );
      })}

      {/* 최신값 라벨 */}
      {lastPt && (
        <g style={{ opacity: inView ? 1 : 0, transition: 'opacity 600ms ease-out 1600ms' }}>
          <rect x={lastPt[0] - 28} y={lastPt[1] - 30} width="56" height="20" rx="10"
            fill={color} style={{ filter: `drop-shadow(0 4px 12px ${color}80)` }} />
          <text x={lastPt[0]} y={lastPt[1] - 16} fontSize="11" fontWeight="700"
            textAnchor="middle" fill="white">
            {data[data.length - 1]}
          </text>
        </g>
      )}

      {/* X축 라벨 */}
      {['2019', '2020', '2021', '2022', '2023', '2024'].map((y, i) => (
        <text key={y} x={padX + i * stepX} y={H - 8} fontSize="10"
          textAnchor="middle" fill="hsl(var(--muted-foreground))"
          letterSpacing="0.05em">
          {y}
        </text>
      ))}
    </svg>
  );
};

// ─── 단계별 풀-스크린 모션 그래픽 ───────────────────
const StepBlock = ({
  num, title, desc, icon: Icon, side, children, accent,
}: {
  num: string; title: string; desc: string; icon: any;
  side: 'left' | 'right'; children: React.ReactNode; accent: string;
}) => {
  const { ref, inView } = useInView<HTMLDivElement>(0.25);
  const isLeft = side === 'left';
  return (
    <div ref={ref} className="relative grid items-center gap-10 py-16 md:grid-cols-2 md:gap-16 md:py-28">
      {/* 텍스트 */}
      <div
        className={`${isLeft ? 'md:order-1' : 'md:order-2'} transition-all duration-1000 ease-out`}
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateX(0)' : `translateX(${isLeft ? -40 : 40}px)`,
        }}
      >
        <div className="mb-4 flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold tracking-widest"
            style={{ background: `${accent}22`, color: accent }}
          >
            {num}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Step {num}</span>
        </div>
        <h3 className="text-3xl font-bold leading-tight md:text-4xl">{title}</h3>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">{desc}</p>
      </div>
      {/* 그래픽 */}
      <div
        className={`${isLeft ? 'md:order-2' : 'md:order-1'} relative aspect-square w-full max-w-[440px] mx-auto transition-all duration-1000 ease-out`}
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          transitionDelay: '150ms',
        }}
      >
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            ...glassCardStyle,
            background: `linear-gradient(135deg, ${accent}10, rgba(255,255,255,0.55))`,
          }}
        />
        <div className="relative h-full w-full p-8">{children}</div>
        <Icon
          className="absolute -bottom-4 -right-4 h-16 w-16 opacity-15"
          style={{ color: accent }}
        />
      </div>
    </div>
  );
};

// 그래픽 1: 핀이 떨어지며 지도 위에 분포
const Step1Graphic = ({ inViewBoost = true }: { inViewBoost?: boolean }) => {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const active = inView && inViewBoost;
  const pins = [
    { l: '15%', t: '25%', d: 0 }, { l: '60%', t: '15%', d: 200 },
    { l: '40%', t: '50%', d: 400 }, { l: '75%', t: '60%', d: 600 },
    { l: '25%', t: '70%', d: 800 }, { l: '55%', t: '80%', d: 1000 },
  ];
  return (
    <div ref={ref} className="relative h-full w-full">
      {/* 격자 지도 */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1="0" x2="200" y1={i * 25} y2={i * 25} stroke="hsl(var(--primary) / 0.08)" />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 25} x2={i * 25} y1="0" y2="200" stroke="hsl(var(--primary) / 0.08)" />
        ))}
      </svg>
      {pins.map((p, i) => (
        <MapPin
          key={i}
          className="absolute h-8 w-8 transition-all duration-700 ease-out"
          style={{
            left: p.l, top: p.t,
            color: 'hsl(var(--accent))',
            filter: 'drop-shadow(0 4px 8px rgba(212,149,43,0.4))',
            transform: active ? 'translateY(0) scale(1)' : 'translateY(-30px) scale(0.5)',
            opacity: active ? 1 : 0,
            transitionDelay: `${p.d}ms`,
          }}
        />
      ))}
      {/* 검색 링 */}
      <div
        className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
        style={{
          borderColor: 'hsl(var(--accent) / 0.4)',
          transform: active ? 'translate(-50%,-50%) scale(1)' : 'translate(-50%,-50%) scale(0)',
          opacity: active ? 0.6 : 0,
          transition: 'all 800ms ease-out 1200ms',
        }}
      />
    </div>
  );
};

// 그래픽 2: 데이터 노드들이 중앙 두뇌로 모임 + 점수 산출
const Step2Graphic = () => {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  return (
    <div ref={ref} className="relative h-full w-full">
      <svg viewBox="0 0 200 200" className="absolute inset-0">
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const x = 100 + Math.cos((deg * Math.PI) / 180) * 70;
          const y = 100 + Math.sin((deg * Math.PI) / 180) * 70;
          return (
            <line
              key={i}
              x1={x} y1={y} x2="100" y2="100"
              stroke="hsl(var(--primary) / 0.4)"
              strokeWidth="1"
              strokeDasharray="200"
              strokeDashoffset={inView ? 0 : 200}
              style={{ transition: `stroke-dashoffset 900ms ease-out ${300 + i * 80}ms` }}
            />
          );
        })}
      </svg>
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const x = 50 + (Math.cos((deg * Math.PI) / 180) * 35);
        const y = 50 + (Math.sin((deg * Math.PI) / 180) * 35);
        const labels = ['입지', '법규', '인구', '시장', '예산', '용도'];
        return (
          <div
            key={i}
            className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl text-[10px] font-semibold transition-all duration-700"
            style={{
              left: `${x}%`, top: `${y}%`,
              ...glassCardStyle,
              color: 'hsl(var(--primary))',
              opacity: inView ? 1 : 0,
              transform: inView ? 'translate(-50%,-50%) scale(1)' : 'translate(-50%,-50%) scale(0)',
              transitionDelay: `${i * 100}ms`,
            }}
          >
            {labels[i]}
          </div>
        );
      })}
      <div
        className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-700"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
          boxShadow: '0 20px 50px -10px hsl(var(--primary) / 0.5)',
          opacity: inView ? 1 : 0,
          transform: inView ? 'translate(-50%,-50%) scale(1)' : 'translate(-50%,-50%) scale(0.3)',
          transitionDelay: '700ms',
        }}
      >
        <Brain className="h-10 w-10 text-white" />
      </div>
      {/* 점수 배지 */}
      <div
        className="absolute right-2 top-2 rounded-full px-3 py-1 text-xs font-bold transition-all duration-700"
        style={{
          background: 'hsl(var(--accent))',
          color: 'white',
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(-20px)',
          transitionDelay: '1500ms',
        }}
      >
        Grade A
      </div>
    </div>
  );
};

// 그래픽 3: 두 주체가 가운데서 핸드셰이크
const Step3Graphic = () => {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  return (
    <div ref={ref} className="relative h-full w-full">
      <div
        className="absolute left-2 top-1/2 flex h-20 w-20 -translate-y-1/2 flex-col items-center justify-center rounded-2xl text-[10px] font-semibold transition-all duration-700"
        style={{
          ...glassCardStyle,
          color: 'hsl(var(--primary))',
          opacity: inView ? 1 : 0,
          transform: inView ? 'translate(0,-50%)' : 'translate(-40px,-50%)',
        }}
      >
        <Building2 className="mb-1 h-7 w-7" />
        지자체
      </div>
      <div
        className="absolute right-2 top-1/2 flex h-20 w-20 -translate-y-1/2 flex-col items-center justify-center rounded-2xl text-[10px] font-semibold transition-all duration-700"
        style={{
          ...glassCardStyle,
          color: 'hsl(var(--accent))',
          opacity: inView ? 1 : 0,
          transform: inView ? 'translate(0,-50%)' : 'translate(40px,-50%)',
          transitionDelay: '150ms',
        }}
      >
        <HomeIcon className="mb-1 h-7 w-7" />
        시행사
      </div>
      {/* 연결선 */}
      <svg viewBox="0 0 200 200" className="absolute inset-0">
        <line x1="50" y1="100" x2="150" y2="100" stroke="hsl(var(--accent))" strokeWidth="2"
          strokeDasharray="100" strokeDashoffset={inView ? 0 : 100}
          style={{ transition: 'stroke-dashoffset 800ms ease-out 400ms' }} />
      </svg>
      <div
        className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-700"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))',
          boxShadow: '0 20px 50px -10px hsl(var(--accent) / 0.5)',
          opacity: inView ? 1 : 0,
          transform: inView ? 'translate(-50%,-50%) scale(1) rotate(0deg)' : 'translate(-50%,-50%) scale(0) rotate(-180deg)',
          transitionDelay: '800ms',
        }}
      >
        <Handshake className="h-10 w-10 text-white" />
      </div>
      {/* 계약서 아이콘 */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold transition-all duration-700"
        style={{
          background: 'hsl(var(--primary))', color: 'white',
          opacity: inView ? 1 : 0,
          transform: inView ? 'translate(-50%,0)' : 'translate(-50%,20px)',
          transitionDelay: '1300ms',
        }}
      >
        Deal Closed ✓
      </div>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [markers, setMarkers] = useState<{ lat: number; lng: number; title?: string }[]>([]);
  const scrollP = useScrollProgress();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('assets')
        .select('latitude,longitude,address')
        .eq('is_published', true);
      if (data) {
        setMarkers(
          data
            .filter((a: any) => a.latitude && a.longitude)
            .map((a: any) => ({ lat: a.latitude, lng: a.longitude, title: a.address }))
        );
      }
    })();
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Seo
        title="Heritage Layer — 유휴부지 부동산 재생 솔루션"
        description="잠든 유휴부지에 생명력을 불어넣다. 한국 유휴 부동산을 발굴·분석·재생하는 데이터 기반 부동산 재생 플랫폼."
        path="/"
      />
      {/* 페이지 진행 바 */}
      <div
        className="fixed left-0 top-16 z-40 h-0.5 origin-left"
        style={{
          width: '100%',
          background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
          transform: `scaleX(${scrollP})`,
          transition: 'transform 100ms linear',
        }}
      />

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{
          height: '100vh',
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 z-[1]" style={{ background: 'rgba(0, 0, 0, 0.3)' }} />
        <div className="absolute inset-0 z-10 flex flex-col justify-center px-6 sm:px-12 lg:px-20">
          <span className="mb-4 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: 'hsl(220 20% 75%)' }}>
            Heritage Layer
          </span>
          <h1 className="my-0 border-none py-[10px] text-3xl font-medium md:text-5xl" style={{ color: 'hsl(0 0% 95%)' }}>
            국내 최초 No.1<br />
            유휴부지를 활용한<br />
            부동산 재생 솔루션
          </h1>
          <p className="mt-6 max-w-xl text-sm md:text-base" style={{ color: 'hsl(0 0% 80%)' }}>
            폐교부터 빈집까지 — 데이터로 가능성을 발견하고, 알고리즘으로 가치를 평가합니다.
          </p>
        </div>
        <div className="absolute bottom-16 left-1/2 z-30 -translate-x-1/2">
          <button
            onClick={() => navigate('/properties')}
            className="group flex items-center gap-2 rounded-full border px-10 py-4 transition-all duration-300 hover:scale-105"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              color: 'hsl(0 0% 95%)',
            }}
          >
            <span className="text-sm font-medium tracking-wide">접속하기</span>
            <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ background: 'hsl(var(--accent))' }} />
          </button>
        </div>
        <ChevronDown className="absolute bottom-6 left-1/2 z-30 h-5 w-5 -translate-x-1/2 animate-bounce" style={{ color: 'rgba(255,255,255,0.5)' }} />
      </section>

      {/* ── PROCESS: 세로 스택, 풀스크린 모션 ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background px-4 py-20 md:py-28">
        <Blob className="left-[-10%] top-20 h-96 w-96" color="hsl(220 50% 80%)" />
        <Blob className="right-[-10%] top-1/2 h-96 w-96" color="hsl(40 80% 80%)" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-20 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Our Service</span>
            <h2 className="mt-3 text-4xl font-bold md:text-5xl">유휴자산 등록부터 매입까지,<br/>매니징해주는 파트너</h2>
            <p className="mt-4 text-muted-foreground">
              Heritage Layer는 단순 분석 도구가 아닙니다. 자산 발굴부터 사업화까지 전 과정을 함께 책임지는 엔드투엔드 서비스를 제공합니다.
            </p>
          </div>

          <StepBlock
            num="01" title="유휴자산 통합 데이터베이스"
            desc="전국에 흩어진 폐교·빈집·유휴 공공시설을 한곳에 모아 시각화합니다. 직접 발로 뛰지 않아도, 검증된 자산 정보를 즉시 탐색할 수 있습니다."
            icon={Search} side="left" accent="hsl(var(--primary))"
          >
            <Step1Graphic />
          </StepBlock>

          <StepBlock
            num="02" title="AI 기반 재생 가능성 진단"
            desc="입지·법규·시장·예산 등 6개 차원을 결합한 알고리즘이 자산별 재생 가능성을 점수화하고 1·2·3순위 사업 시나리오와 수익성 시뮬레이션을 제공합니다."
            icon={Brain} side="right" accent="hsl(var(--accent))"
          >
            <Step2Graphic />
          </StepBlock>

          <StepBlock
            num="03" title="등록부터 매입까지 풀 매니징"
            desc="자산 등록·인허가 검토·지자체 협력 구조 설계·매입 실행까지 프로젝트 전 과정을 매니징하고, 개발에 필요한 자본·전문가·실행 리소스를 함께 제공합니다."
            icon={Handshake} side="left" accent="hsl(var(--primary))"
          >
            <Step3Graphic />
          </StepBlock>
        </div>
      </section>

      {/* ── INSIGHT: 큰 통계 + 다양한 차트 (다크 / 라인 기반) ── */}
      <section
        className="relative overflow-hidden px-4 py-16 sm:py-20 md:py-28"
        style={{
          background:
            'radial-gradient(1200px 600px at 20% 0%, hsl(220 50% 18%) 0%, transparent 60%),' +
            'radial-gradient(900px 500px at 85% 90%, hsl(35 60% 22%) 0%, transparent 55%),' +
            'linear-gradient(180deg, hsl(220 40% 8%) 0%, hsl(220 35% 10%) 100%)',
        }}
      >
        {/* 애니메이트 그리드 배경 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(0 0% 100% / 0.5) 1px, transparent 1px),' +
              'linear-gradient(90deg, hsl(0 0% 100% / 0.5) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />
        {/* 떠다니는 블롭 */}
        <Blob className="right-[-15%] top-10 h-[500px] w-[500px]" color="hsl(40 90% 55%)" />
        <Blob className="left-[-15%] bottom-10 h-[500px] w-[500px]" color="hsl(220 80% 60%)" />

        <div className="relative mx-auto max-w-6xl text-[hsl(0_0%_96%)]">
          <div className="mb-12 text-center sm:mb-14">
            <span className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: 'hsl(40 90% 70%)' }}>Insight</span>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              <span className="bg-gradient-to-r from-white via-white to-[hsl(40_90%_75%)] bg-clip-text text-transparent">
                전국 유휴 부동산 현황
              </span>
            </h2>
            <p className="mt-4 text-[hsl(0_0%_75%)]">방치된 자원이 매년 늘어나고 있습니다 — 새로운 기회로 전환할 시간입니다.</p>
          </div>

          {/* Big stat cards — 프레임 없이, 좌측 그라데이션 라인으로만 구분 */}
          <div className="mb-14 grid gap-px overflow-hidden rounded-2xl sm:grid-cols-3"
            style={{ background: 'hsl(0 0% 100% / 0.08)' }}>
            {[
              { icon: School, label: '전국 폐교', value: 3955, suffix: '개', color: 'hsl(220 90% 70%)' },
              { icon: HomeIcon, label: '전국 빈집', value: 1450000, suffix: '호', color: 'hsl(40 95% 65%)' },
              { icon: TrendingDown, label: '소멸위험 지자체', value: 89, suffix: '곳', color: 'hsl(0 80% 65%)' },
            ].map((s) => (
              <div
                key={s.label}
                className="group relative p-6 transition-colors hover:bg-white/[0.03] sm:p-8"
                style={{ background: 'hsl(220 40% 9%)' }}
              >
                {/* 상단 그라데이션 라인 */}
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }}
                />
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: `${s.color.replace(')', ' / 0.12)')}`, boxShadow: `inset 0 0 0 1px ${s.color}30` }}>
                    <s.icon className="h-5 w-5" style={{ color: s.color }} />
                  </div>
                  <p className="text-sm text-[hsl(0_0%_72%)]">{s.label}</p>
                </div>
                <p className="mt-4 text-4xl font-bold tabular-nums sm:text-5xl"
                  style={{ color: s.color, textShadow: `0 0 24px ${s.color}50` }}>
                  <CountUp end={s.value} suffix={s.suffix} />
                </p>
              </div>
            ))}
          </div>

          {/* 두 컬럼 차트 — 헤더 + 하단 그라데이션 라인만 */}
          <div className="mb-10 grid gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" style={{ color: 'hsl(220 90% 70%)' }} />
                  <h3 className="text-base font-semibold tracking-tight sm:text-lg">권역별 폐교 분포 (Top 5)</h3>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(0_0%_60%)]">Top 5</span>
              </div>
              <div className="space-y-6">
                <InsightBar label="전남" value={839} max={1000} color="hsl(220 90% 70%)" suffix="개" delay={0} />
                <InsightBar label="경북" value={745} max={1000} color="hsl(220 90% 70%)" suffix="개" delay={120} />
                <InsightBar label="경남" value={584} max={1000} color="hsl(40 95% 65%)" suffix="개" delay={240} />
                <InsightBar label="강원" value={476} max={1000} color="hsl(40 95% 65%)" suffix="개" delay={360} />
                <InsightBar label="전북" value={329} max={1000} color="hsl(220 30% 65%)" suffix="개" delay={480} />
              </div>
              <div className="mt-6 h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.15), transparent)' }} />
              <p className="mt-3 text-xs text-[hsl(0_0%_60%)]">출처: 교육부 통계 (참고치)</p>
            </div>

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5" style={{ color: 'hsl(40 95% 65%)' }} />
                  <h3 className="text-base font-semibold tracking-tight sm:text-lg">소유 구분 비율</h3>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(0_0%_60%)]">Ownership</span>
              </div>
              <DonutChart
                total={100}
                segments={[
                  { label: '국·공유', value: 62, color: 'hsl(220 90% 70%)' },
                  { label: '사유',   value: 28, color: 'hsl(40 95% 65%)' },
                  { label: '기타',   value: 10, color: 'hsl(220 30% 65%)' },
                ]}
              />
              <div className="mt-6 h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.15), transparent)' }} />
              <p className="mt-3 text-xs text-[hsl(0_0%_60%)]">국·공유 자산이 절반 이상 — 민관협력 기회가 큽니다.</p>
            </div>
          </div>

          {/* 트렌드 차트 — 프레임 제거, 그라데이션 라인 강조 */}
          <div className="relative pt-2">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" style={{ color: 'hsl(40 95% 65%)' }} />
                <h3 className="text-base font-semibold tracking-tight sm:text-lg">연도별 신규 폐교 발생 추이</h3>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(0_0%_60%)]">2019 → 2024 · 단위 개</span>
            </div>
            <AreaTrendChart data={[112, 138, 165, 190, 224, 261]} color="hsl(40 95% 65%)" />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
              {[112, 138, 165, 190, 224, 261].map((v, i) => (
                <span key={i} className="font-semibold tabular-nums text-[hsl(0_0%_88%)]">{v}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS: Heritage Layer 임팩트 ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background px-4 py-20 md:py-28">
        <Blob className="right-[10%] top-10 h-72 w-72" color="hsl(40 90% 75%)" />
        <Blob className="left-[5%] bottom-10 h-72 w-72" color="hsl(220 60% 80%)" />
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Impact</span>
            <h2 className="mt-3 text-4xl font-bold md:text-5xl">우리가 만들고 있는 변화</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { v: 247, s: '', l: '분석 완료 자산' },
              { v: 38,  s: '', l: '연결 진행 딜' },
              { v: 12,  s: '', l: '협력 지자체' },
              { v: 9.4, s: '%', l: '평균 추정 IRR', dec: 1 },
            ].map((m, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 sm:p-6 sm:rounded-3xl text-center transition-transform hover:-translate-y-1"
                style={glassCardStyle}
              >
                <p className="text-5xl font-bold tabular-nums" style={{ color: 'hsl(var(--accent))' }}>
                  <CountUp end={m.v} suffix={m.s} decimals={m.dec ?? 0} />
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{m.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAP ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background px-4 py-20 md:py-28">
        <Blob className="left-1/2 top-10 h-96 w-96 -translate-x-1/2" color="hsl(220 60% 85%)" />
        <div className="relative mx-auto max-w-5xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Explore</span>
          <h2 className="mt-3 text-4xl font-bold md:text-5xl">전국 유휴자산 지도</h2>
          <p className="mb-10 mt-4 text-muted-foreground">데이터 기반으로 전국의 재생 가능 자산을 한눈에 확인하세요</p>
          <button
            onClick={() => navigate('/properties')}
            className="group relative mx-auto mb-8 block aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-3xl transition-all hover:scale-[1.01]"
            style={glassCardStyle}
            aria-label="지도 탐색하기"
          >
            <div className="pointer-events-none h-full w-full">
              <NaverMap markers={markers} className="h-full w-full" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-background/0 transition-colors group-hover:bg-primary/5" />
            <span
              className="pointer-events-none absolute bottom-5 right-5 rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg"
              style={{
                background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
                color: 'hsl(var(--primary))',
              }}
            >
              클릭하여 탐색하기 <ArrowRight className="ml-1 inline h-4 w-4" />
            </span>
          </button>
          <Button size="lg" onClick={() => navigate('/properties')}>
            지금 탐색하기 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden px-4 py-20 md:py-24">
        <Blob className="left-[20%] top-0 h-80 w-80" color="hsl(40 80% 75%)" />
        <Blob className="right-[15%] bottom-0 h-80 w-80" color="hsl(220 60% 80%)" />
        <div className="relative mx-auto max-w-3xl rounded-2xl p-7 text-center sm:rounded-3xl sm:p-10 md:p-14" style={glassCardStyle}>
          <Sparkles className="mx-auto mb-4 h-10 w-10 text-accent" />
          <h2 className="text-3xl font-bold md:text-4xl">유휴 부동산을 새로운 기회로</h2>
          <p className="mt-4 text-muted-foreground">
            지금 가입하고 전국 자산 데이터와 AI 분석 결과를 확인해보세요.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/properties')}>자산 탐색</Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>요금 안내</Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t bg-card px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-3">
          <div>
            <h3 className="mb-3 text-base font-bold">더레이어코퍼레이션</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              유휴 부동산을 새로운 기회로 잇는<br />Heritage Layer
            </p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground">Contact</p>
            <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> contact@thelayercorp.com</p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground">Service</p>
            <button onClick={() => navigate('/properties')} className="block hover:text-foreground">자산 탐색</button>
            <button onClick={() => navigate('/about')} className="block hover:text-foreground">회사 소개</button>
            <button onClick={() => navigate('/pricing')} className="block hover:text-foreground">요금 안내</button>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-5xl border-t pt-6 flex flex-col items-center gap-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <button onClick={() => navigate('/terms')} className="hover:text-foreground">이용약관</button>
            <span className="opacity-40">·</span>
            <button onClick={() => navigate('/privacy')} className="hover:text-foreground">개인정보 처리방침</button>
            <span className="opacity-40">·</span>
            <button onClick={() => navigate('/refund')} className="hover:text-foreground">환불 정책</button>
          </div>
          <p>© 2025 (주)더레이어코퍼레이션 (The Layer Corporation Co., Ltd.). All rights reserved.</p>
          <p className="opacity-70">Our order process is conducted by our online reseller Paddle.com, which is the Merchant of Record for all our orders.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
