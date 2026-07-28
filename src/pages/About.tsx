import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Seo from '@/components/common/Seo';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import {
  Search, FileText, Award, Lightbulb, BarChart3, GitCompare,
  Landmark, HandCoins, Bookmark,
} from 'lucide-react';

// ── 톤: 다크 네이비 / 라이트 블루 2단계 대비만 사용 ──
const DARK = 'hsl(226 35% 10%)';
const DARK_TEXT = 'hsl(0 0% 95%)';
const DARK_SUB = 'hsl(0 0% 68%)';
const LIGHT = 'hsl(205 35% 96%)';
const LIGHT_TEXT = 'hsl(226 35% 12%)';
const LIGHT_SUB = 'hsl(226 12% 40%)';
const LINE_DARK = 'hsl(0 0% 100% / 0.14)';
const LINE_LIGHT = 'hsl(226 20% 82%)';

type Tone = 'dark' | 'light';

// ── 스크롤 등장 모션 ──
const Reveal = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 700ms ease-out ${delay}ms, transform 700ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

const Section = ({
  tone, eyebrow, title, lead, children,
}: {
  tone: Tone; eyebrow: string; title: React.ReactNode; lead?: React.ReactNode; children?: React.ReactNode;
}) => (
  <section
    className="px-6 py-20 text-center sm:px-10 md:px-16 md:py-28"
    style={{
      background: tone === 'dark' ? DARK : LIGHT,
      color: tone === 'dark' ? DARK_TEXT : LIGHT_TEXT,
    }}
  >
    <div className="mx-auto max-w-5xl">
      <Reveal>
        <p
          className="font-display text-[11px] font-normal uppercase tracking-[0.35em]"
          style={{ color: tone === 'dark' ? DARK_SUB : LIGHT_SUB }}
        >
          {eyebrow}
        </p>
        <h2 className="mx-auto mt-6 max-w-3xl text-2xl font-light leading-[1.45] sm:text-3xl md:text-4xl">
          {title}
        </h2>
        {lead && (
          <p
            className="mx-auto mt-6 max-w-2xl text-sm leading-[1.9] md:text-base"
            style={{ color: tone === 'dark' ? DARK_SUB : LIGHT_SUB }}
          >
            {lead}
          </p>
        )}
      </Reveal>
      {children && <div className="mt-14">{children}</div>}
    </div>
  </section>
);

// ── 정적 가로 막대 그래프 ──
const BarChart = ({ items, max, unit }: { items: { label: string; value: number }[]; max: number; unit: string }) => (
  <div className="mx-auto max-w-2xl space-y-5 text-left">
    {items.map((it, i) => (
      <Reveal key={it.label} delay={i * 80}>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-sm" style={{ color: LIGHT_SUB }}>{it.label}</span>
          <span className="font-display text-sm tabular-nums">{it.value.toLocaleString()}{unit}</span>
        </div>
        <div className="h-[6px] w-full" style={{ background: 'hsl(226 20% 88%)' }}>
          <div className="h-full" style={{ width: `${(it.value / max) * 100}%`, background: 'hsl(210 45% 55%)' }} />
        </div>
      </Reveal>
    ))}
  </div>
);

// ── 정적 도넛 차트 ──
const Donut = ({ segments }: { segments: { label: string; value: number; shade: string }[] }) => {
  const r = 58, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-12">
      <svg width="170" height="170" viewBox="0 0 170 170" className="-rotate-90 shrink-0">
        <circle cx="85" cy="85" r={r} fill="none" stroke="hsl(226 20% 88%)" strokeWidth="16" />
        {segments.map((s) => {
          const len = (s.value / 100) * c;
          const node = (
            <circle
              key={s.label}
              cx="85" cy="85" r={r} fill="none"
              stroke={s.shade} strokeWidth="16"
              strokeDasharray={`${Math.max(len - 1.5, 0)} ${c - len + 1.5}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return node;
        })}
      </svg>
      <div className="space-y-3 text-left">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-3 text-sm">
            <span className="h-2.5 w-2.5 shrink-0" style={{ background: s.shade }} />
            <span style={{ color: LIGHT_SUB }}>{s.label}</span>
            <span className="ml-6 font-display tabular-nums">{s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── 정적 라인(추이) 차트 ──
const TrendChart = ({ data, labels }: { data: number[]; labels: string[] }) => {
  const W = 520, H = 180, padX = 24, padY = 26;
  const max = Math.max(...data) * 1.2;
  const stepX = (W - padX * 2) / (data.length - 1);
  const pts = data.map((v, i) => [padX + i * stepX, H - padY - (v / max) * (H - padY * 2)] as const);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
  return (
    <div className="mx-auto max-w-2xl">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={padX} y1={H - padY} x2={W - padX} y2={H - padY} stroke={LINE_LIGHT} strokeWidth="1" />
        <path d={`${line} L ${pts[pts.length - 1][0]} ${H - padY} L ${pts[0][0]} ${H - padY} Z`} fill="hsl(210 45% 55% / 0.10)" />
        <path d={line} fill="none" stroke="hsl(210 45% 45%)" strokeWidth="1.5" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r="3" fill="hsl(210 45% 45%)" />
            <text x={p[0]} y={p[1] - 10} textAnchor="middle" fontSize="10" fill={LIGHT_TEXT}>{data[i]}</text>
            <text x={p[0]} y={H - padY + 15} textAnchor="middle" fontSize="9" fill={LIGHT_SUB}>{labels[i]}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const StatRow = ({ items }: { items: { label: string; value: string; note: string }[] }) => (
  <div className="mx-auto grid max-w-4xl grid-cols-1 sm:grid-cols-3" style={{ borderTop: `1px solid ${LINE_LIGHT}` }}>
    {items.map((s, i) => (
      <Reveal key={s.label} delay={i * 100}>
        <div className="px-4 py-8" style={{ borderBottom: `1px solid ${LINE_LIGHT}` }}>
          <p className="text-sm" style={{ color: LIGHT_SUB }}>{s.label}</p>
          <p className="mt-3 font-display text-3xl font-light tabular-nums md:text-4xl">{s.value}</p>
          <p className="mt-3 text-xs" style={{ color: LIGHT_SUB }}>{s.note}</p>
        </div>
      </Reveal>
    ))}
  </div>
);

// ── What We Provide: 원형 스텝 (호버 시 설명) ──
const steps = [
  { step: 'STEP 01', title: '자산 탐색', desc: '전국 유휴자산 지도 핀 탐색. 등급 배치(S~D)로 즉시 확인합니다.' },
  { step: 'STEP 02', title: '등급 분석', desc: 'COSMO-P 알고리즘이 입지·규제·심미성·사업성 4분류를 종합 평가합니다.' },
  { step: 'STEP 03', title: '시나리오', desc: '1/2/3순위 개발 방향을 자동 추천하고 전환 용도·대출 구조를 제안합니다.' },
  { step: 'STEP 04', title: '재무 검증', desc: 'IRR·DSCR·투자회수기간을 시뮬레이션하고 자기자본 손익을 재계산합니다.' },
  { step: 'STEP 05', title: '딜 연결', desc: '브릿지 솔루션으로 기회 발굴부터 PM까지 지원합니다.' },
];

const StepCircles = () => {
  const [active, setActive] = useState<number | null>(null);
  return (
    <div>
      <div className="relative mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-x-4 gap-y-8 sm:flex-nowrap">
        {steps.map((s, i) => (
          <Reveal key={s.step} delay={i * 120} className="flex-1">
            <div className="flex flex-col items-center">
              <div className="flex w-full items-center">
                <div className="hidden h-px flex-1 sm:block" style={{ background: i === 0 ? 'transparent' : LINE_DARK }} />
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive(active === i ? null : i)}
                  className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full transition-all duration-300 sm:h-28 sm:w-28"
                  style={{
                    border: `1px solid ${active === i ? 'hsl(210 45% 72%)' : LINE_DARK}`,
                    background: active === i ? 'hsl(0 0% 100% / 0.08)' : 'transparent',
                    transform: active === i ? 'scale(1.06)' : 'scale(1)',
                  }}
                >
                  <span className="font-display text-[9px] tracking-[0.2em]" style={{ color: DARK_SUB }}>{s.step}</span>
                  <span className="mt-1.5 text-sm font-light">{s.title}</span>
                </button>
                <div className="hidden h-px flex-1 sm:block" style={{ background: i === steps.length - 1 ? 'transparent' : LINE_DARK }} />
              </div>
              <p
                className="mt-3 min-h-[3.5rem] px-1 text-center text-[11px] leading-[1.7] transition-opacity duration-300 sm:min-h-[4.5rem]"
                style={{ color: DARK_SUB, opacity: active === i ? 1 : 0 }}
              >
                {s.desc}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
      <p className="mt-2 text-xs" style={{ color: DARK_SUB }}>각 단계를 마우스로 올려보세요</p>
    </div>
  );
};

// ── 플랫폼 기능 원형 다이어그램 ──
const features = [
  { icon: Search, title: '자산 탐색' },
  { icon: FileText, title: '기본 정보 열람' },
  { icon: Award, title: '재생 등급 확인' },
  { icon: Lightbulb, title: '재생 시나리오' },
  { icon: BarChart3, title: '재무 수익성 지표' },
  { icon: GitCompare, title: '시나리오 비교표' },
  { icon: Landmark, title: '정부협력 경로' },
  { icon: HandCoins, title: '딜 관심 표명' },
  { icon: Bookmark, title: '무제한 자산 저장' },
];

const FeatureWheel = ({ onExplore }: { onExplore: () => void }) => (
  <div className="relative mx-auto aspect-square w-full max-w-[520px] sm:max-w-[600px]">
    <div className="absolute inset-0 rounded-full" style={{ border: `1px solid ${LINE_LIGHT}` }} />
    <div className="absolute inset-[10%] rounded-full" style={{ border: `1px dashed ${LINE_LIGHT}` }} />

    <div
      className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center sm:h-44 sm:w-44"
      style={{ background: '#ffffff', border: `1px solid ${LINE_LIGHT}` }}
    >
      <span className="font-display text-[10px] uppercase tracking-[0.25em]" style={{ color: LIGHT_SUB }}>The Layer</span>
      <p className="mt-2 text-base font-light">Heritage<br />Layer</p>
      <Button size="sm" variant="outline" className="mt-3 h-7 px-3 text-[10px]" onClick={onExplore}>
        자산 탐색
      </Button>
    </div>

    {features.map((f, i) => {
      const angle = (i / features.length) * 2 * Math.PI - Math.PI / 2;
      const left = 50 + 50 * Math.cos(angle);
      const top = 50 + 50 * Math.sin(angle);
      const Icon = f.icon;
      return (
        <div
          key={f.title}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${left}%`, top: `${top}%`, width: 'min(28%, 128px)' }}
        >
          <div
            className="flex flex-col items-center animate-fade-in"
            style={{ animationDelay: `${i * 70}ms`, animationFillMode: 'both' }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14"
              style={{ background: LIGHT, border: `1px solid ${LINE_LIGHT}` }}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: 'hsl(210 45% 45%)' }} />
            </div>
            <p className="mt-2 text-center text-[10px] leading-tight sm:text-xs" style={{ color: LIGHT_SUB }}>
              {f.title}
            </p>
          </div>
        </div>


      );
    })}
  </div>
);

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen [word-break:keep-all]" style={{ background: DARK }}>
      <Seo
        title="회사 소개 — Heritage Layer"
        description="(주)더레이어코퍼레이션이 운영하는 Heritage Layer의 비전과 유휴 부동산 재생 접근법을 소개합니다."
        path="/about"
      />

      {/* 01. PROBLEM */}
      <Section
        tone="dark"
        eyebrow="Problem"
        title="방치된 자산이 매년 늘어나고 있습니다"
        lead="지역은 텅 비어가는데, 활용할 방법은 없습니다. 데이터는 흩어져 있고 절차는 복잡합니다."
      />

      {/* 02. 전국 부동산 현황 */}
      <Section
        tone="light"
        eyebrow="Status"
        title="전국 부동산 현황"
        lead="방치된 자원이 매년 늘어나고 있습니다 — 새로운 기회로 전환할 시간입니다."
      >
        <StatRow
          items={[
            { label: '전국 폐교', value: '3,955개', note: '교육부 통계 (참고치)' },
            { label: '전국 빈집', value: '1,450,000호', note: '전국 주택 기준 (참고치)' },
            { label: '소멸위험 지자체', value: '89곳', note: '인구감소 지역 기준' },
          ]}
        />

        <div className="mt-16">
          <Reveal>
            <h3 className="text-base font-light md:text-lg">권역별 폐교 분포 (Top 5)</h3>
          </Reveal>
          <div className="mt-8">
            <BarChart
              unit="개"
              max={1000}
              items={[
                { label: '전남', value: 839 },
                { label: '경북', value: 745 },
                { label: '경남', value: 584 },
                { label: '강원', value: 476 },
                { label: '전북', value: 329 },
              ]}
            />
          </div>
        </div>

        <div className="mt-16">
          <Reveal>
            <h3 className="text-base font-light md:text-lg">소유 구분 비율</h3>
            <p className="mt-3 text-xs" style={{ color: LIGHT_SUB }}>국·공유 자산이 절반 이상 — 민관협력 기회가 큽니다.</p>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-8">
              <Donut
                segments={[
                  { label: '국·공유', value: 62, shade: 'hsl(210 45% 45%)' },
                  { label: '사유', value: 28, shade: 'hsl(210 40% 68%)' },
                  { label: '기타', value: 10, shade: 'hsl(210 25% 84%)' },
                ]}
              />
            </div>
          </Reveal>
        </div>

        <div className="mt-16">
          <Reveal>
            <h3 className="text-base font-light md:text-lg">연도별 신규 폐교 발생 추이</h3>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-8">
              <TrendChart
                data={[112, 138, 165, 190, 224, 261]}
                labels={['2019', '2020', '2021', '2022', '2023', '2024']}
              />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 03. ROOT CAUSE — 2단 */}
      <Section
        tone="dark"
        eyebrow="Root Cause"
        title="왜 재생되지 못할까요?"
        lead="방치는 우연이 아닙니다. 구조적 원인이 네 가지 축에서 작동하고 있습니다."
      >
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-x-12 sm:grid-cols-2">
          {[
            { i: '01', t: '정보 사일로화', d: '유휴자산 정보가 교육부·국토부·행안부·지자체별로 흩어져 있습니다. 통합 파악이 구조적으로 불가능합니다.' },
            { i: '02', t: '사업성 판단 어려움', d: '용도지역·건폐율·수요환경을 종합 분석할 도구가 없습니다. 개인·소규모 주체의 진입 장벽이 높습니다.' },
            { i: '03', t: '인허가 불확실성', d: '수의계약·민간제안·종상향 등 공공자산 활용 경로가 복잡하고, 지자체마다 조건이 다릅니다.' },
            { i: '04', t: '재무 모델 부재', d: '전환 용도별 IRR·DSCR·투자회수기간 등 재무 검증 수단이 없어 투자 결정이 직관에 의존합니다.' },
          ].map((c, idx) => (
            <Reveal key={c.i} delay={idx * 100}>
              <div className="py-8" style={{ borderTop: `1px solid ${LINE_DARK}` }}>
                <span className="font-display text-xs tracking-[0.25em]" style={{ color: DARK_SUB }}>{c.i}</span>
                <h3 className="mt-3 text-lg font-light md:text-xl">{c.t}</h3>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-[1.9]" style={{ color: DARK_SUB }}>{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 04. WHAT WE PROVIDE — 원형 스텝 */}
      <Section
        tone="dark"
        eyebrow="What We Provide"
        title="Heritage Layer가 제공하는 것"
        lead="유휴자산 재생을 다섯 단계로 연결합니다."
      >
        <StepCircles />
      </Section>

      {/* 05. OUR SERVICE */}
      <Section
        tone="light"
        eyebrow="Our Service"
        title={<>유휴자산 등록부터 매입까지,<br className="hidden sm:block" /> 매니징해주는 파트너</>}
        lead="Heritage Layer는 단순 분석 도구가 아닙니다. 자산 발굴부터 사업화까지 전 과정을 함께 책임집니다."
      >
        <div className="mx-auto max-w-4xl" style={{ borderTop: `1px solid ${LINE_LIGHT}` }}>
          {[
            { i: 'STEP 01', t: '유휴자산 통합 데이터베이스', d: '전국에 흩어진 폐교·빈집·유휴 공공시설을 한곳에 모아 시각화합니다. 검증된 자산 정보를 즉시 탐색할 수 있습니다.' },
            { i: 'STEP 02', t: '재생 가능성 진단', d: '입지·법규·시장·예산 등 6개 차원을 결합한 알고리즘이 재생 가능성을 점수화하고 사업 시나리오와 수익성 시뮬레이션을 제공합니다.' },
            { i: 'STEP 03', t: '등록부터 매입까지 풀 매니징', d: '자산 등록·인허가 검토·지자체 협력 구조 설계·매입 실행까지 전 과정을 매니징하고 필요한 자본·전문가 리소스를 제공합니다.' },
          ].map((s, idx) => (
            <Reveal key={s.i} delay={idx * 100}>
              <div className="py-10" style={{ borderBottom: `1px solid ${LINE_LIGHT}` }}>
                <span className="font-display text-xs tracking-[0.25em]" style={{ color: LIGHT_SUB }}>{s.i}</span>
                <h3 className="mt-3 text-xl font-light md:text-2xl">{s.t}</h3>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-[1.9] md:text-base" style={{ color: LIGHT_SUB }}>{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 06. 플랫폼 기능 — 원형 다이어그램 */}
      <Section
        tone="light"
        eyebrow="Platform"
        title="플랫폼 기능"
        lead="Heritage Layer는 누구나 무료로 이용할 수 있는 데이터 기반 재생 플랫폼입니다."
      >
        <FeatureWheel onExplore={() => navigate('/properties')} />
      </Section>

      <Footer />
    </div>
  );
};

export default AboutPage;
