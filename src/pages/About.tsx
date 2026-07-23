import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Database, Lightbulb, AlertTriangle,
  TrendingDown, Building2, Sparkles,
  ArrowRight, Search, FileText, BarChart3, GitCompare, Landmark, HandCoins, Bookmark,
} from 'lucide-react';
import aboutHeroBg from '@/assets/about-hero-bg.png';
import Seo from '@/components/common/Seo';
import { HomeSections } from './Home';

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

// 다크 배경 위에 올리는 글라스 카드 — 폰트가 묻히지 않게 라이트 톤 텍스트 유지
const glassDarkCardStyle: React.CSSProperties = {
  background: 'hsl(0 0% 100% / 0.06)',
  border: '1px solid hsl(0 0% 100% / 0.12)',
  color: 'hsl(0 0% 96%)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  ['--foreground' as any]: '0 0% 96%',
  ['--muted-foreground' as any]: '0 0% 75%',
  ['--card-foreground' as any]: '0 0% 96%',
  ['--muted' as any]: '0 0% 100% / 0.08',
  ['--border' as any]: '0 0% 100% / 0.12',
  boxShadow:
    '0 1px 2px rgba(0,0,0,0.2), 0 12px 32px -8px rgba(0,0,0,0.4), 0 32px 64px -20px rgba(0,0,0,0.5)',
};


const Blob = ({ className, color }: { className?: string; color: string }) => (
  <div aria-hidden className={`pointer-events-none absolute rounded-full blur-3xl ${className ?? ''}`}
    style={{ background: color, opacity: 0.4 }} />
);

// ── 플랫폼 기능 카드 데이터 ───────────────────────────────
const features = [
  { icon: Search, title: '자산 탐색', desc: '전국 유휴 부동산 데이터를 지도와 리스트로 탐색합니다.' },
  { icon: FileText, title: '기본 정보 열람', desc: '위치, 면적, 용도, 소유 구분 등 핵심 정보를 한눈에 확인합니다.' },
  { icon: Sparkles, title: '재생 등급 확인', desc: 'S~D 등급으로 자산의 재생 가능성을 빠르게 파악합니다.' },
  { icon: Lightbulb, title: '재생 시나리오', desc: 'AI가 추천하는 1·2·3순위 재생 방향을 제시합니다.' },
  { icon: BarChart3, title: '재무 수익성 지표', desc: 'IRR, NPV, 공사비 등 주요 재무 지표를 계산합니다.' },
  { icon: GitCompare, title: '시나리오 비교표', desc: '여러 시나리오의 수익성과 위험도를 비교 분석합니다.' },
  { icon: Landmark, title: '정부협력 경로', desc: '폐교·빈집 등 자산별 지원 정책과 협력 기관을 안내합니다.' },
  { icon: HandCoins, title: '딜 관심 표명', desc: '관심 자산에 대해 시행사·관리 주체와 연결을 요청할 수 있습니다.' },
  { icon: Bookmark, title: '무제한 자산 저장', desc: '마음에 드는 자산을 저장하고 비교 목록을 관리합니다.' },
];

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" style={{ zoom: 0.8 } as React.CSSProperties}>
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
            Heritage Layer는 데이터로 유휴 부동산의 가능성을 발견하고<br />
            지자체와 시행사를 연결해 실제 재생 사업으로 이어줍니다.
          </p>
        </div>
      </section>

      {/* ── PROBLEM: 왜 우리 비즈니스가 필요한가 ── */}
      <section
        className="relative overflow-hidden px-4 py-14 sm:py-20 md:py-28"
      >
        <Blob className="left-[-10%] top-10 h-96 w-96" color="hsl(15 40% 78%)" />
        <Blob className="right-[-10%] bottom-10 h-96 w-96" color="hsl(25 45% 78%)" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3 border-accent/40 text-accent">
              <AlertTriangle className="mr-1 h-3 w-3" /> Problem
            </Badge>
            <h2 className="text-4xl font-bold md:text-5xl">방치된 자산이 매년 늘어나고 있습니다</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              지역은 텅 비어가는데, 활용할 방법은 없습니다.<br />
              데이터가 흩어져 있고, 절차는 복잡합니다.
            </p>
          </div>

          {/* 통계 카드 & 권역 막대는 아래 다크 INSIGHT 블록으로 이동 */}


          {/* 왜 재생되지 못할까요? — 큰 그래픽, 4단 스택 */}
          <div className="mt-16">
            <div className="mb-10 text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Root Cause</span>
              <h3 className="mt-3 text-3xl font-bold md:text-4xl">왜 재생되지 못할까요?</h3>
              <p className="mt-3 text-muted-foreground">방치는 우연이 아닙니다. 구조적 원인이 4가지 축에서 작동하고 있습니다.</p>
            </div>

            <div className="space-y-6">
              {[
                { icon: Database, t: '정보 사일로화', d: '유휴자산 정보가 교육부·국토부·행안부·지자체별로 흩어져 있습니다. 통합 파악이 구조적으로 불가능합니다.', color: 'hsl(var(--primary))' },
                { icon: TrendingDown, t: '사업성 판단 어려움', d: '용도지역·건폐율·수요환경을 종합 분석할 도구가 없습니다. 개인·소규모 주체의 진입 장벽이 구조적으로 높습니다.', color: 'hsl(var(--primary))' },
                { icon: Building2, t: '인허가 불확실성', d: '수의계약·민간제안·종상향 가능성 등 공공자산 활용 경로가 복잡합니다. 지자체마다 조건이 다르고 정보가 없습니다.', color: 'hsl(var(--primary))' },
                { icon: TrendingDown, t: '재무 모델 부재', d: '전환 용도별 IRR·DSCR·투자회수기간 등 재무 검증 수단이 없습니다. 투자 결정이 직관에 의존할 수밖에 없습니다.', color: 'hsl(var(--primary))' },
              ].map((p, i) => (
                <div
                  key={p.t}
                  className="flex flex-col items-start gap-6 rounded-2xl p-5 sm:p-6 sm:rounded-3xl md:p-8 md:flex-row"
                  style={{
                    background: 'hsl(0 0% 100% / 0.06)',
                    border: '1px solid hsl(0 0% 100% / 0.14)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    color: 'hsl(0 0% 96%)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2), 0 12px 32px -8px rgba(0,0,0,0.35)',
                    ['--foreground' as any]: '0 0% 96%',
                    ['--muted-foreground' as any]: '0 0% 72%',
                    ['--card-foreground' as any]: '0 0% 96%',
                    ['--muted' as any]: '0 0% 100% / 0.08',
                  }}
                >
                  <div
                    className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl md:h-28 md:w-28"
                    style={{ background: `${p.color.replace(')', ' / 0.15)')}`, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                  >
                    <p.icon className="h-12 w-12 md:h-14 md:w-14" style={{ color: p.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="mb-2 flex items-center justify-start gap-3">
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

      {/* ── HOW WE WORK: Heritage Layer가 제공하는 것 ── */}
      <section
        className="relative overflow-hidden px-4 py-14 sm:py-20 md:py-28"
        style={{ background: 'hsl(226 35% 12%)' }}
      >
        {/* 상단 연결 그라데이션: 상위 섹션의 어두운 배경에서 현재 배경으로 자연스럽게 전환 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{ background: 'linear-gradient(180deg, hsl(226 35% 8%) 0%, transparent 100%)' }}
        />
        <Blob className="left-[-10%] top-1/3 h-96 w-96" color="hsl(25 55% 55% / 0.18)" />
        <Blob className="right-[-10%] top-2/3 h-96 w-96" color="hsl(210 45% 55% / 0.18)" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-12 text-center md:mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">What We Provide</span>
            <h2 className="mt-3 text-4xl font-bold text-white md:text-5xl">Heritage Layer가 제공하는 것</h2>
            <p className="mt-4 text-[hsl(0_0%_75%)]">유휴자산 재생을 5단계로 연결합니다</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { num: '01', title: '자산 탐색', desc: '전국 유휴자산 지도 핀 탐색. 등급 배치(S~D)로 즉시 확인.' },
              { num: '02', title: '등급 분석', desc: 'COSMO-P 알고리즘, 입지·규제·심미성·사업성 4분류 종합 평가.' },
              { num: '03', title: '시나리오', desc: '1/2/3순위 개발 방향 자동 추천. 전환 용도·공사 방식·대출 구조 제안.' },
              { num: '04', title: '재무 검증', desc: 'IRR·DSCR·투자회수기간 실시간 시뮬레이션. 자기자본 손익계산으로 즉시 재계산.' },
              { num: '05', title: '딜 연결', desc: '브릿지 솔루션으로 기회부터 PM까지 지원.' },
            ].map((s) => (
              <div
                key={s.num}
                className="relative flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 sm:min-h-[280px] md:p-8"
                style={{
                  background: 'hsl(0 0% 100% / 0.06)',
                  border: '1px solid hsl(0 0% 100% / 0.12)',
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                  color: 'hsl(0 0% 96%)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2), 0 12px 32px -8px rgba(0,0,0,0.35)',
                }}
              >
                <span className="text-xs font-bold tracking-[0.2em]" style={{ color: 'hsl(25 55% 62%)' }}>STEP {s.num}</span>
                <h3 className="mt-4 text-xl font-bold text-white sm:text-2xl">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[hsl(0_0%_75%)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DARK BLOCK: INSIGHT + MISSION + PLATFORM (연속 단일 배경) ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'hsl(226 35% 12%)' }}
      >
        {/* 전체 다크 블록을 가로지르는 연속 블롭 */}
        <Blob className="right-[-15%] top-[6%] h-[600px] w-[600px]" color="hsl(25 55% 55%)" />
        <Blob className="left-[-15%] top-[40%] h-[600px] w-[600px]" color="hsl(210 45% 55%)" />
        <Blob className="right-[-10%] bottom-[5%] h-[600px] w-[600px]" color="hsl(25 55% 55%)" />
        {/* ── MISSION ── */}
        <section className="relative overflow-hidden px-4 py-16 text-[hsl(0_0%_96%)] sm:py-20 md:py-24">
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

        {/* ── PLATFORM FEATURES (다크 블록 내부, 글라스 카드) ── */}
        <section className="relative overflow-hidden px-4 py-14 sm:py-20 md:py-28">
          <div className="relative mx-auto max-w-5xl">
            <div className="mb-12 text-center text-[hsl(0_0%_96%)]">
              <span className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: 'hsl(25 55% 62%)' }}>Platform</span>
              <h2 className="mt-3 text-4xl font-bold md:text-5xl">플랫폼 기능</h2>
              <p className="mx-auto mt-4 max-w-2xl text-[hsl(0_0%_78%)]">
                Heritage Layer는 누구나 무료로 이용할 수 있는 데이터 기반 재생 플랫폼입니다.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  style={glassDarkCardStyle}
                  className="border-0 overflow-hidden rounded-2xl transition-all duration-300 hover:bg-white/[0.08]"
                >
                  <CardContent className="flex items-start gap-4 p-6">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: 'hsl(25 55% 58% / 0.15)', boxShadow: 'inset 0 0 0 1px hsl(25 55% 58% / 0.25)' }}
                    >
                      <feature.icon className="h-6 w-6" style={{ color: 'hsl(25 55% 62%)' }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-[hsl(0_0%_75%)]">{feature.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="bg-accent text-white hover:bg-accent/90" onClick={() => navigate('/properties')}>자산 탐색하기</Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={() => navigate('/contact')}
              >
                문의하기 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>
      {/* fade: dark → light */}
      <div
        aria-hidden
        className="h-40 -mt-px"
        style={{ background: 'linear-gradient(180deg, hsl(226 35% 12%) 0%, hsl(var(--background)) 100%)' }}
      />

      <footer className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© 2025 더레이어코퍼레이션 (The Layer Corporation). All rights reserved.</p>
      </footer>

    </div>
  );
};

export default AboutPage;
