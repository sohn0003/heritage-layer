import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Database, Lightbulb, Rocket, Check, X, AlertTriangle,
  TrendingDown, School, Home as HomeIcon, Building2, Users, Sparkles,
  ArrowRight,
} from 'lucide-react';
import aboutHeroBg from '@/assets/about-hero-bg.png';
import Seo from '@/components/common/Seo';

// ── Hooks ───────────────────────────────────────
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

const CountUp = ({ end, duration = 1800, suffix = '', decimals = 0 }: { end: number; duration?: number; suffix?: string; decimals?: number }) => {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setVal(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);
  return <span ref={ref}>{decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString()}{suffix}</span>;
};

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

const Blob = ({ className, color }: { className?: string; color: string }) => (
  <div aria-hidden className={`pointer-events-none absolute rounded-full blur-3xl ${className ?? ''}`}
    style={{ background: color, opacity: 0.4 }} />
);

const InsightBar = ({ label, value, max, color, suffix = '' }: { label: string; value: number; max: number; color: string; suffix?: string }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div ref={ref}>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-lg font-bold tabular-nums" style={{ color }}>
          <CountUp end={value} suffix={suffix} />
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted/60">
        <div
          className="h-full rounded-full transition-[width] duration-[1800ms] ease-out"
          style={{ width: inView ? `${pct}%` : '0%', background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
        />
      </div>
    </div>
  );
};

// ── 단계별 그래픽 ─────────────────────────────────
const Step1Graphic = () => {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  return (
    <div ref={ref} className="relative h-full w-full">
      {/* 데이터 컬럼들이 위로 자라는 막대 그래프 */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
        {[40, 70, 110, 145].map((x, i) => {
          const heights = [80, 130, 100, 155];
          return (
            <g key={i}>
              <rect
                x={x - 12} y={170} width="24" rx="4"
                fill={i % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))'}
                style={{
                  transformOrigin: `${x}px 170px`,
                  transform: inView ? `scaleY(${heights[i] / 100})` : 'scaleY(0)',
                  transition: `transform 1000ms cubic-bezier(.34,1.56,.64,1) ${i * 150}ms`,
                  opacity: 0.85,
                }}
              />
            </g>
          );
        })}
      </svg>
      <Database
        className="absolute right-3 top-3 h-8 w-8 transition-all duration-700"
        style={{
          color: 'hsl(var(--primary))',
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(-10px)',
          transitionDelay: '700ms',
        }}
      />
    </div>
  );
};

const Step2Graphic = () => {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  return (
    <div ref={ref} className="relative h-full w-full">
      {/* 전구 + 발산 빛줄기 */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const x2 = 100 + Math.cos((deg * Math.PI) / 180) * 80;
          const y2 = 100 + Math.sin((deg * Math.PI) / 180) * 80;
          return (
            <line
              key={i}
              x1="100" y1="100" x2={x2} y2={y2}
              stroke="hsl(var(--accent))" strokeWidth="2" strokeLinecap="round"
              strokeDasharray="80"
              strokeDashoffset={inView ? 0 : 80}
              style={{ transition: `stroke-dashoffset 800ms ease-out ${300 + i * 80}ms`, opacity: 0.6 }}
            />
          );
        })}
      </svg>
      <div
        className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-700"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))',
          boxShadow: '0 20px 50px -10px hsl(var(--accent) / 0.6)',
          opacity: inView ? 1 : 0,
          transform: inView ? 'translate(-50%,-50%) scale(1)' : 'translate(-50%,-50%) scale(0.3)',
        }}
      >
        <Lightbulb className="h-10 w-10 text-white" />
      </div>
    </div>
  );
};

const Step3Graphic = () => {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  return (
    <div ref={ref} className="relative h-full w-full">
      {/* 로켓이 우상향으로 발사 + 궤적 */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
        <path
          d="M 30 170 Q 100 130 170 40"
          fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5"
          strokeDasharray="200" strokeDashoffset={inView ? 0 : 200}
          style={{ transition: 'stroke-dashoffset 1500ms ease-out 200ms' }}
        />
        {[40, 80, 120].map((t, i) => {
          const cx = 30 + t;
          const cy = 170 - (t * 0.9);
          return (
            <circle
              key={i} cx={cx} cy={cy} r="4" fill="hsl(var(--accent))"
              style={{ opacity: inView ? 1 : 0, transition: `opacity 400ms ${800 + i * 150}ms` }}
            />
          );
        })}
      </svg>
      <div
        className="absolute right-4 top-4 flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-700"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
          boxShadow: '0 20px 40px -10px hsl(var(--primary) / 0.5)',
          opacity: inView ? 1 : 0,
          transform: inView ? 'translate(0,0) rotate(0deg)' : 'translate(-30px,30px) rotate(-30deg)',
          transitionDelay: '1500ms',
        }}
      >
        <Rocket className="h-8 w-8 text-white" />
      </div>
    </div>
  );
};

const StepBlock = ({ num, title, desc, icon: Icon, side, accent, children }: {
  num: string; title: string; desc: string; icon: any; side: 'left' | 'right'; accent: string; children: React.ReactNode;
}) => {
  const { ref, inView } = useInView<HTMLDivElement>(0.25);
  const isLeft = side === 'left';
  return (
    <div ref={ref} className="relative grid items-center gap-10 py-12 md:grid-cols-2 md:gap-16 md:py-20">
      <div
        className={`${isLeft ? 'md:order-1' : 'md:order-2'} transition-all duration-1000`}
        style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateX(0)' : `translateX(${isLeft ? -40 : 40}px)` }}
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold tracking-widest"
            style={{ background: `${accent}22`, color: accent }}>{num}</span>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Step {num}</span>
        </div>
        <h3 className="text-3xl font-bold leading-tight md:text-4xl">{title}</h3>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">{desc}</p>
      </div>
      <div
        className={`${isLeft ? 'md:order-2' : 'md:order-1'} relative mx-auto aspect-square w-full max-w-[420px] transition-all duration-1000`}
        style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)', transitionDelay: '150ms' }}
      >
        <div className="absolute inset-0 rounded-3xl"
          style={{ ...glassCardStyle, background: `linear-gradient(135deg, ${accent}10, rgba(255,255,255,0.6))` }} />
        <div className="relative h-full w-full p-8">{children}</div>
        <Icon className="absolute -bottom-4 -right-4 h-16 w-16 opacity-15" style={{ color: accent }} />
      </div>
    </div>
  );
};

// ── 비교표 데이터 ───────────────────────────────
const comparison = [
  { feature: '자산 탐색', free: true, pro: true },
  { feature: '기본 정보 열람', free: true, pro: true },
  { feature: '재생 등급 확인', free: true, pro: true },
  { feature: '재생 시나리오', free: false, pro: true },
  { feature: '재무 수익성 지표', free: false, pro: true },
  { feature: '시나리오 비교표', free: false, pro: true },
  { feature: '정부협력 경로', free: false, pro: true },
  { feature: '딜 관심 표명', free: false, pro: true },
  { feature: '무제한 자산 저장', free: false, pro: true },
];

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background" style={{ zoom: 0.8 } as React.CSSProperties}>
      <Seo
        title="회사 소개 — Heritage Layer"
        description="(주)더레이어코퍼레이션이 운영하는 Heritage Layer의 비전, 팀, 그리고 유휴 부동산 재생 접근법을 소개합니다."
        path="/about"
      />
      {/* ── HERO ── */}
      <section
        className="relative flex items-center justify-center px-4 text-center"
        style={{
          backgroundImage: `url(${aboutHeroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '70vh',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.55)' }} />
        <div className="relative z-10 mx-auto max-w-3xl">
          <Badge variant="secondary" className="mb-4">THE LAYER</Badge>
          <h1 className="mb-6 text-3xl font-bold sm:text-5xl" style={{ color: 'hsl(0 0% 95%)' }}>
            방치된 공간이 지역의 미래입니다
          </h1>
          <p className="leading-relaxed" style={{ color: 'hsl(0 0% 85%)' }}>
            Heritage Layer는 데이터로 유휴 부동산의 가능성을 발견하고,
            지자체와 시행사를 연결해 실제 재생 사업으로 이어줍니다.
          </p>
        </div>
      </section>

      {/* ── PROBLEM: 왜 우리 비즈니스가 필요한가 ── */}
      <section
        className="relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background px-4 py-14 sm:py-20 md:py-28"
      >
        <Blob className="left-[-10%] top-10 h-96 w-96" color="hsl(0 70% 80%)" />
        <Blob className="right-[-10%] bottom-10 h-96 w-96" color="hsl(40 90% 80%)" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3 border-accent/40 text-accent">
              <AlertTriangle className="mr-1 h-3 w-3" /> Problem
            </Badge>
            <h2 className="text-4xl font-bold md:text-5xl">방치된 자산이 매년 늘어나고 있습니다</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              지역은 텅 비어가는데, 활용할 방법은 없습니다. 데이터가 흩어져 있고, 절차는 복잡하며, 누구도 책임지지 않습니다.
            </p>
          </div>

          {/* 큰 통계 카드 */}
          <div className="mb-12 grid gap-5 sm:grid-cols-3">
            {[
              { icon: School, label: '전국 폐교', value: 3955, suffix: '개', color: 'hsl(0 70% 55%)' },
              { icon: HomeIcon, label: '전국 빈집', value: 1450000, suffix: '호', color: 'hsl(25 90% 55%)' },
              { icon: TrendingDown, label: '소멸위험 지자체', value: 89, suffix: '곳', color: 'hsl(var(--primary))' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-5 sm:p-6 sm:rounded-3xl text-center transition-transform hover:-translate-y-1"
                style={glassCardStyle}>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: `${s.color.replace(')', ' / 0.15)')}` }}>
                  <s.icon className="h-7 w-7" style={{ color: s.color }} />
                </div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-2 text-4xl font-bold tabular-nums" style={{ color: s.color }}>
                  <CountUp end={s.value} suffix={s.suffix} />
                </p>
              </div>
            ))}
          </div>

          {/* 권역 막대 */}
          <div className="rounded-2xl p-5 sm:p-7 sm:rounded-3xl" style={glassCardStyle}>
            <h3 className="mb-5 text-lg font-semibold">권역별 폐교 분포 (Top 5)</h3>
            <div className="space-y-5">
              <InsightBar label="전남" value={839} max={1000} color="hsl(0 70% 55%)" suffix="개" />
              <InsightBar label="경북" value={745} max={1000} color="hsl(0 70% 55%)" suffix="개" />
              <InsightBar label="경남" value={584} max={1000} color="hsl(25 90% 55%)" suffix="개" />
              <InsightBar label="강원" value={476} max={1000} color="hsl(25 90% 55%)" suffix="개" />
              <InsightBar label="전북" value={329} max={1000} color="hsl(var(--primary))" suffix="개" />
            </div>
          </div>

          {/* 왜 재생되지 못할까요? — 큰 그래픽, 4단 스택 */}
          <div className="mt-16">
            <div className="mb-10 text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Root Cause</span>
              <h3 className="mt-3 text-3xl font-bold md:text-4xl">왜 재생되지 못할까요?</h3>
              <p className="mt-3 text-muted-foreground">방치는 우연이 아닙니다. 구조적 원인이 4가지 축에서 작동하고 있습니다.</p>
            </div>

            <div className="space-y-6">
              {[
                { icon: Database, t: '데이터의 분절', d: '교육부·국토부·지자체로 흩어진 자산 정보를 통합 조회할 수 없습니다. 어디에 무엇이 있는지조차 한눈에 파악되지 않습니다.', color: 'hsl(0 70% 55%)' },
                { icon: Users, t: '주체의 부재', d: '관리 주체가 명확치 않아 책임 있는 재생 사업이 진행되지 못합니다. 누구도 결정권자가 아닌 상태로 수년이 흘러갑니다.', color: 'hsl(25 90% 55%)' },
                { icon: Building2, t: '복잡한 인허가', d: '용도변경, 종상향, 환경영향평가 등 절차가 미로처럼 얽혀 있습니다. 작은 사업자에게는 진입 장벽 그 자체입니다.', color: 'hsl(var(--accent))' },
                { icon: TrendingDown, t: '낮은 수익성 인식', d: '사업성 검토조차 하지 않은 채 폐기 결정이 내려집니다. 데이터 기반 분석 없이는 기회조차 발견되지 않습니다.', color: 'hsl(var(--primary))' },
              ].map((p, i) => (
                <div
                  key={p.t}
                  className={`flex flex-col items-center gap-6 rounded-2xl p-5 sm:p-6 sm:rounded-3xl md:p-8 md:flex-row ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                  style={glassCardStyle}
                >
                  <div
                    className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl md:h-28 md:w-28"
                    style={{ background: `${p.color.replace(')', ' / 0.15)')}` }}
                  >
                    <p.icon className="h-12 w-12 md:h-14 md:w-14" style={{ color: p.color }} />
                  </div>
                  <div className={`flex-1 text-center ${i % 2 === 1 ? 'md:text-right' : 'md:text-left'}`}>
                    <div className="mb-2 flex items-center justify-center gap-3 md:justify-start" style={{ flexDirection: i % 2 === 1 ? 'row-reverse' : 'row' }}>
                      <span className="text-xs font-bold tabular-nums tracking-widest" style={{ color: p.color }}>
                        0{i + 1}
                      </span>
                      <h4 className="text-2xl font-bold md:text-3xl">{p.t}</h4>
                    </div>
                    <p className="text-base leading-relaxed text-muted-foreground md:text-lg">{p.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mx-auto mt-12 max-w-2xl text-center text-base font-medium md:text-lg">
            <span className="text-accent">&ldquo;방치&rdquo;가 아니라 &ldquo;기회&rdquo;</span>로 전환할 시간입니다.
          </p>
        </div>
      </section>

      {/* ── MISSION: 우리는 누구인가 ── */}
      <section
        className="relative overflow-hidden px-4 py-20 text-[hsl(0_0%_96%)] md:py-28"
        style={{
          background:
            'radial-gradient(1000px 500px at 80% 0%, hsl(35 60% 22%) 0%, transparent 60%),' +
            'radial-gradient(900px 500px at 15% 90%, hsl(220 50% 18%) 0%, transparent 55%),' +
            'linear-gradient(180deg, hsl(220 25% 6%) 0%, hsl(220 38% 10%) 20%, hsl(220 38% 10%) 80%, hsl(220 25% 6%) 100%)',
        }}
      >
        <Blob className="right-[-10%] top-10 h-96 w-96" color="hsl(40 90% 60%)" />
        <Blob className="left-[-10%] bottom-10 h-96 w-96" color="hsl(220 70% 50%)" />
        <div className="relative mx-auto max-w-3xl text-center">
          <Sparkles className="mx-auto mb-4 h-10 w-10" style={{ color: 'hsl(var(--accent))' }} />
          <h2 className="text-3xl font-bold sm:text-5xl">
            우리는 유휴자산을<br />가장 잘 아는 재생 사업자입니다
          </h2>
          <p className="mt-6 text-base leading-relaxed opacity-90 md:text-lg">
            Heritage Layer는 전국의 유휴 부동산을 데이터 기반으로 분석하고,
            최적의 재생 방향을 도출하여 실제 딜로 연결하는 플랫폼입니다.
            폐교, 빈집, 유휴 공공시설을 새로운 가치의 공간으로 전환합니다.
          </p>
          <Button size="lg" className="mt-8 bg-accent text-white hover:bg-accent/90"
            onClick={() => navigate('/properties')}>
            지금 자산 탐색하기 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ── HOW WE WORK (구 "재생 방법론") — 세로 스택 + 모션 ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background px-4 py-14 sm:py-20 md:py-28">
        <Blob className="left-[-10%] top-1/3 h-96 w-96" color="hsl(220 50% 80%)" />
        <Blob className="right-[-10%] top-2/3 h-96 w-96" color="hsl(40 80% 80%)" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">How We Work</span>
            <h2 className="mt-3 text-4xl font-bold md:text-5xl">우리가 일하는 방식</h2>
            <p className="mt-4 text-muted-foreground">데이터 → 아이디어 → 실행, 3단계로 자산을 재생합니다</p>
          </div>

          <StepBlock
            num="01" title="데이터로 가능성을 본다"
            desc="전국 유휴자산 데이터를 수집하고 정제합니다. 위치, 법규, 인구, 시장 정보를 한곳에 모아 비교 가능한 형태로 만듭니다."
            icon={Database} side="left" accent="hsl(var(--primary))"
          >
            <Step1Graphic />
          </StepBlock>

          <StepBlock
            num="02" title="가장 잘 맞는 재생 방향을 찾는다"
            desc="입지·법규·시장 데이터를 알고리즘이 결합하여 1·2·3순위 재생 시나리오를 자동 추천합니다. 사람이 며칠 걸릴 검토를 즉시 끝냅니다."
            icon={Lightbulb} side="right" accent="hsl(var(--accent))"
          >
            <Step2Graphic />
          </StepBlock>

          <StepBlock
            num="03" title="실제 사업으로 연결한다"
            desc="프로젝트 매니징을 담당하고 개발에 필요한 리소스를 제공합니다."
            icon={Rocket} side="left" accent="hsl(var(--primary))"
          >
            <Step3Graphic />
          </StepBlock>
        </div>
      </section>

      {/* ── PLATFORM / PRICING ── */}
      <section className="relative overflow-hidden px-4 py-14 sm:py-20 md:py-28">
        <Blob className="left-1/2 top-10 h-96 w-96 -translate-x-1/2" color="hsl(40 90% 80%)" />
        <div className="relative mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Platform</span>
            <h2 className="mt-3 text-4xl font-bold md:text-5xl">플랫폼 소개</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Heritage Layer의 스코어링 시스템은 입지, 법규, 시장 데이터를 결합하여
              각 자산의 재생 가능성을 <span className="font-semibold text-foreground">S~D 등급</span>으로 평가합니다.
            </p>
          </div>

          <Card style={glassCardStyle} className="border-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-accent/30">
                    <TableHead className="w-1/2 py-5 text-base font-bold">기능</TableHead>
                    <TableHead className="py-5 text-center text-base font-bold">무료</TableHead>
                    <TableHead className="py-5 text-center text-base font-bold" style={{ color: 'hsl(var(--accent))' }}>Pro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparison.map((row) => (
                    <TableRow key={row.feature} className="hover:bg-accent/5">
                      <TableCell className="py-4 text-base font-medium">{row.feature}</TableCell>
                      <TableCell className="py-4 text-center">
                        {row.free ? (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/15">
                            <Check className="h-5 w-5" style={{ color: 'hsl(var(--accent))' }} strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted/40">
                            <X className="h-5 w-5 text-muted-foreground/50" strokeWidth={2.5} />
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        {row.pro ? (
                          <span
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                            style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(35 90% 60%))' }}
                          >
                            <Check className="h-5 w-5 text-white" strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted/40">
                            <X className="h-5 w-5 text-muted-foreground/50" strokeWidth={2.5} />
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/pricing')}>요금 안내 보기</Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/contact')}>
              문의하기 <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© 2025 더레이어코퍼레이션 (The Layer Corporation). All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AboutPage;
