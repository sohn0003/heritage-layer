import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import heroBg from '@/assets/hero-bg.jpg';
import { Button } from '@/components/ui/button';
import NaverMap from '@/components/map/NaverMap';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Search, Brain, Handshake, School, Home as HomeIcon, Building2, TrendingDown, Mail, Phone, MapPin } from 'lucide-react';

// ── 스크롤 진입 시 애니메이션을 트리거하는 훅 ──────────
const useInView = <T extends HTMLElement>(threshold = 0.25) => {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

// ── 숫자 카운트업 ──────────
const CountUp = ({ end, duration = 1800, suffix = '' }: { end: number; duration?: number; suffix?: string }) => {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(end * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
};

// ── 가로 진행 바 (스크롤 시 채워짐) ──────────
const InsightBar = ({
  label, value, max, color, suffix = '',
}: { label: string; value: number; max: number; color: string; suffix?: string }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div ref={ref}>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>
          <CountUp end={value} suffix={suffix} />
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-[1800ms] ease-out"
          style={{ width: inView ? `${pct}%` : '0%', background: color }}
        />
      </div>
    </div>
  );
};

// ── 단계별 모션 그래픽 ──────────
const StepGraphic = ({ num }: { num: '01' | '02' | '03' }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const base = 'absolute transition-all duration-700 ease-out';
  return (
    <div ref={ref} className="relative mx-auto mb-5 h-32 w-32">
      {num === '01' && (
        <>
          {/* 지도 + 핀 떨어지는 애니메이션 */}
          <div
            className={`${base} inset-0 rounded-2xl border-2 border-dashed`}
            style={{
              borderColor: 'hsl(var(--primary) / 0.3)',
              transform: inView ? 'scale(1)' : 'scale(0.8)',
              opacity: inView ? 1 : 0,
            }}
          />
          {[
            { l: '20%', t: '30%', d: 0 },
            { l: '60%', t: '20%', d: 150 },
            { l: '40%', t: '60%', d: 300 },
          ].map((p, i) => (
            <MapPin
              key={i}
              className={`${base} h-5 w-5`}
              style={{
                left: p.l, top: p.t, color: 'hsl(var(--accent))',
                transform: inView ? 'translateY(0)' : 'translateY(-20px)',
                opacity: inView ? 1 : 0,
                transitionDelay: `${p.d}ms`,
              }}
            />
          ))}
          <Search
            className={`${base} h-7 w-7`}
            style={{
              right: '15%', bottom: '15%', color: 'hsl(var(--primary))',
              transform: inView ? 'rotate(0deg) scale(1)' : 'rotate(-30deg) scale(0)',
              opacity: inView ? 1 : 0, transitionDelay: '500ms',
            }}
          />
        </>
      )}
      {num === '02' && (
        <>
          {/* AI: 데이터 노드들이 모여 뇌로 ─ */}
          <div
            className={`${base} left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full`}
            style={{
              background: 'hsl(var(--primary) / 0.1)',
              transform: inView
                ? 'translate(-50%,-50%) scale(1)'
                : 'translate(-50%,-50%) scale(0.4)',
              opacity: inView ? 1 : 0,
              transitionDelay: '300ms',
            }}
          >
            <Brain className="h-8 w-8" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          {[0, 60, 120, 180, 240, 300].map((deg, i) => {
            const r = 52;
            const x = 50 + (Math.cos((deg * Math.PI) / 180) * r) / 1.28;
            const y = 50 + (Math.sin((deg * Math.PI) / 180) * r) / 1.28;
            return (
              <span
                key={i}
                className={`${base} h-2 w-2 rounded-full`}
                style={{
                  left: `${x}%`, top: `${y}%`, background: 'hsl(var(--accent))',
                  transform: inView
                    ? 'translate(-50%,-50%) scale(1)'
                    : 'translate(-50%,-50%) scale(0)',
                  opacity: inView ? 1 : 0,
                  transitionDelay: `${i * 80}ms`,
                }}
              />
            );
          })}
        </>
      )}
      {num === '03' && (
        <>
          {/* 두 손이 만나는 핸드셰이크 */}
          <div
            className={`${base} left-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl`}
            style={{
              background: 'hsl(var(--primary) / 0.12)',
              transform: inView ? 'translate(0,-50%)' : 'translate(-30px,-50%)',
              opacity: inView ? 1 : 0,
            }}
          >
            <Building2 className="h-6 w-6" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <div
            className={`${base} right-0 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl`}
            style={{
              background: 'hsl(var(--accent) / 0.18)',
              transform: inView ? 'translate(0,-50%)' : 'translate(30px,-50%)',
              opacity: inView ? 1 : 0,
              transitionDelay: '150ms',
            }}
          >
            <HomeIcon className="h-6 w-6" style={{ color: 'hsl(var(--accent))' }} />
          </div>
          <Handshake
            className={`${base} left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2`}
            style={{
              color: 'hsl(var(--primary))',
              opacity: inView ? 1 : 0,
              transform: inView
                ? 'translate(-50%,-50%) scale(1)'
                : 'translate(-50%,-50%) scale(0)',
              transitionDelay: '500ms',
            }}
          />
        </>
      )}
    </div>
  );
};

const steps = [
  { num: '01' as const, title: '전국 유휴자산 탐색', desc: '폐교, 빈집, 유휴 공공시설을 데이터 기반으로 탐색합니다.' },
  { num: '02' as const, title: 'AI 재생 가능성 분석', desc: '입지, 법규, 시장 데이터를 결합해 재생 가능성을 평가합니다.' },
  { num: '03' as const, title: '직접 딜 연결', desc: '지자체·시행사와 직접 연결하여 사업을 실행합니다.' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [markers, setMarkers] = useState<{ lat: number; lng: number; title?: string }[]>([]);

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
    <div className="min-h-screen">
      {/* Hero */}
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
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 lg:px-20 z-10">
          <span className="mb-4 text-xs font-semibold tracking-[0.3em] uppercase" style={{ color: 'hsl(220 20% 55%)' }}>
            Heritage Layer
          </span>
          <h1 className="py-[10px] font-medium my-0 border-none text-3xl" style={{ color: 'hsl(0 0% 95%)' }}>
            국내 최초 No.1<br />
            유휴부지를 활용한<br />
            부동산 재생 솔루션
          </h1>
        </div>
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => navigate('/properties')}
            className="group flex items-center gap-2 px-10 py-4 rounded-full border transition-all duration-300 hover:scale-105"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              color: 'hsl(0 0% 90%)',
            }}
          >
            <span className="text-sm font-medium tracking-wide">접속하기</span>
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'hsl(var(--accent))' }} />
          </button>
        </div>
        <div
          className="absolute bottom-8 right-8 z-30 text-xs tracking-widest"
          style={{ color: 'rgba(255,255,255,0.3)', writingMode: 'vertical-rl' }}
        >
          SCROLL
        </div>
      </section>

      {/* Service Steps with motion graphics */}
      <section className="bg-muted/50 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Heritage Layer는 이렇게 작동합니다</h2>
          <div className="grid gap-10 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <StepGraphic num={s.num} />
                <span className="text-xs font-bold tracking-widest text-accent">{s.num}</span>
                <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insight: 폐교/빈집 현황 */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <span className="text-xs font-semibold tracking-[0.3em] uppercase text-accent">Insight</span>
            <h2 className="mt-2 text-3xl font-bold">전국 유휴 부동산 현황</h2>
            <p className="mt-3 text-muted-foreground">
              방치된 자원이 매년 늘어나고 있습니다. Heritage Layer는 이 자산을 새로운 기회로 바꿉니다.
            </p>
          </div>

          {/* Big stats */}
          <div className="mb-12 grid gap-6 sm:grid-cols-3">
            {[
              { icon: School, label: '전국 폐교', value: 3955, suffix: '개', color: 'hsl(var(--primary))' },
              { icon: HomeIcon, label: '전국 빈집', value: 1450000, suffix: '호', color: 'hsl(var(--accent))' },
              { icon: TrendingDown, label: '연간 인구감소 지자체', value: 89, suffix: '곳', color: 'hsl(0 70% 55%)' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border bg-card p-6 text-center">
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: `${s.color.replace(')', ' / 0.12)')}` }}
                >
                  <s.icon className="h-6 w-6" style={{ color: s.color }} />
                </div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: s.color }}>
                  <CountUp end={s.value} suffix={s.suffix} />
                </p>
              </div>
            ))}
          </div>

          {/* Bars */}
          <div className="rounded-2xl border bg-card p-8">
            <h3 className="mb-6 text-lg font-semibold">권역별 폐교 분포</h3>
            <div className="space-y-5">
              <InsightBar label="전남" value={839} max={1000} color="hsl(var(--primary))" suffix="개" />
              <InsightBar label="경북" value={745} max={1000} color="hsl(var(--primary))" suffix="개" />
              <InsightBar label="경남" value={584} max={1000} color="hsl(var(--accent))" suffix="개" />
              <InsightBar label="강원" value={476} max={1000} color="hsl(var(--accent))" suffix="개" />
              <InsightBar label="전북" value={329} max={1000} color="hsl(220 25% 55%)" suffix="개" />
            </div>
            <p className="mt-5 text-xs text-muted-foreground">출처: 교육부 · 국토교통부 통계 (참고치)</p>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mb-4 text-3xl font-bold">전국 유휴자산 지도</h2>
          <p className="mb-8 text-muted-foreground">데이터 기반으로 전국의 재생 가능 자산을 한눈에 확인하세요</p>
          <button
            onClick={() => navigate('/properties')}
            className="group relative mx-auto mb-8 block aspect-[16/9] w-full max-w-3xl overflow-hidden rounded-xl border bg-muted shadow-sm transition-all hover:shadow-lg"
            aria-label="지도 탐색하기"
          >
            <div className="pointer-events-none h-full w-full">
              <NaverMap markers={markers} className="h-full w-full" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-background/0 transition-colors group-hover:bg-background/10" />
            <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-background/90 px-4 py-2 text-xs font-medium shadow">
              클릭하여 탐색하기 →
            </span>
          </button>
          <Button size="lg" onClick={() => navigate('/properties')}>
            지금 탐색하기 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card px-4 py-12">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
          <div>
            <h3 className="mb-3 text-base font-bold">더레이어코퍼레이션</h3>
            <p className="text-xs text-muted-foreground">
              유휴 부동산을 새로운 기회로 잇는<br />
              Heritage Layer
            </p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground">Contact</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> 010-0000-0000</p>
            <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> contact@heritagelayer.com</p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground">Service</p>
            <button onClick={() => navigate('/properties')} className="block hover:text-foreground">자산 탐색</button>
            <button onClick={() => navigate('/about')} className="block hover:text-foreground">회사 소개</button>
            <button onClick={() => navigate('/pricing')} className="block hover:text-foreground">요금 안내</button>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-5xl border-t pt-6 text-center text-xs text-muted-foreground">
          © 2025 더레이어코퍼레이션 (The Layer Corporation). All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
