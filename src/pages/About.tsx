import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Database, Lightbulb, AlertTriangle,
  TrendingDown, Building2,
  Search, FileText, BarChart3, GitCompare, Landmark, HandCoins, Bookmark, Award,
} from 'lucide-react';
import Seo from '@/components/common/Seo';
import { HomeSections } from './Home';
import Footer from '@/components/layout/Footer';

// ── 플랫폼 기능 데이터 (원형 다이어그램용) ───────────────────────────
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

const DARK_BG = 'hsl(226 35% 12%)';
const HIGHLIGHT = 'hsl(210 45% 72%)'; // 블루 계열 (오렌지 대체)

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen [word-break:keep-all] [&_h1]:leading-[1.5] [&_h2]:leading-[1.5] [&_h3]:leading-[1.5] [&_h4]:leading-[1.5] [&_p]:leading-[1.9]"
      style={{ background: DARK_BG, color: 'hsl(0 0% 96%)' }}
    >
      <Seo
        title="회사 소개 — Heritage Layer"
        description="(주)더레이어코퍼레이션이 운영하는 Heritage Layer의 비전, 팀, 그리고 유휴 부동산 재생 접근법을 소개합니다."
        path="/about"
      />
      {/* 홈 콘텐츠 (히어로/푸터 제외) 를 About 상단에 통합 */}
      <HomeSections embedded />

      {/* ── INTRO (얇은 전환 밴드) ── */}
      <section className="relative px-6 py-20 sm:px-10 md:px-16 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.3em]" style={{ color: HIGHLIGHT }}>THE LAYER</span>
          <h1 className="mt-4 text-2xl font-normal leading-[1.5] sm:text-3xl md:text-4xl">
            방치된 공간이 지역의 미래입니다
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-[1.9] md:text-base" style={{ color: 'hsl(0 0% 75%)' }}>
            Heritage Layer는 데이터로 유휴 부동산의 가능성을 발견하고,
            지자체와 시행사를 연결해 실제 재생 사업으로 이어줍니다.
          </p>
        </div>
      </section>

      {/* ── PROBLEM: 왜 우리 비즈니스가 필요한가 ── */}
      <section className="relative px-6 py-16 sm:px-10 sm:py-24 md:px-16 md:py-32">
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="mb-3 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.3em]" style={{ color: HIGHLIGHT }}>
              <AlertTriangle className="h-3 w-3" /> Problem
            </div>
            <h2 className="text-3xl font-medium md:text-4xl">방치된 자산이 매년 늘어나고 있습니다</h2>
            <p className="mx-auto mt-4 max-w-2xl" style={{ color: 'hsl(0 0% 75%)' }}>
              지역은 텅 비어가는데, 활용할 방법은 없습니다.<br />
              데이터가 흩어져 있고, 절차는 복잡합니다.
            </p>
          </div>

          <div className="mt-16">
            <div className="mb-10 text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: HIGHLIGHT }}>Root Cause</span>
              <h3 className="mt-3 text-2xl font-medium md:text-3xl">왜 재생되지 못할까요?</h3>
              <p className="mt-3" style={{ color: 'hsl(0 0% 75%)' }}>방치는 우연이 아닙니다. 구조적 원인이 4가지 축에서 작동하고 있습니다.</p>
            </div>

            <div className="space-y-6">
              {[
                { icon: Database, t: '정보 사일로화', d: '유휴자산 정보가 교육부·국토부·행안부·지자체별로 흩어져 있습니다. 통합 파악이 구조적으로 불가능합니다.' },
                { icon: TrendingDown, t: '사업성 판단 어려움', d: '용도지역·건폐율·수요환경을 종합 분석할 도구가 없습니다. 개인·소규모 주체의 진입 장벽이 구조적으로 높습니다.' },
                { icon: Building2, t: '인허가 불확실성', d: '수의계약·민간제안·종상향 가능성 등 공공자산 활용 경로가 복잡합니다. 지자체마다 조건이 다르고 정보가 없습니다.' },
                { icon: TrendingDown, t: '재무 모델 부재', d: '전환 용도별 IRR·DSCR·투자회수기간 등 재무 검증 수단이 없습니다. 투자 결정이 직관에 의존할 수밖에 없습니다.' },
              ].map((p, i) => (
                <div
                  key={p.t}
                  className="flex flex-col items-start gap-6 p-5 sm:p-6 md:p-8 md:flex-row"
                  style={{
                    background: 'hsl(0 0% 100% / 0.04)',
                    border: '1px solid hsl(0 0% 100% / 0.10)',
                  }}
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center md:h-24 md:w-24" style={{ border: '1px solid hsl(0 0% 100% / 0.14)' }}>
                    <p.icon className="h-10 w-10 md:h-12 md:w-12" style={{ color: '#ffffff' }} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="mb-2 flex items-center justify-start gap-3">
                      <span className="text-xs font-medium tabular-nums tracking-widest" style={{ color: HIGHLIGHT }}>
                        0{i + 1}
                      </span>
                      <h4 className="text-xl font-medium md:text-2xl">{p.t}</h4>
                    </div>
                    <p className="text-base leading-relaxed md:text-lg" style={{ color: 'hsl(0 0% 78%)' }}>{p.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mx-auto mt-12 max-w-2xl text-center text-base font-medium md:text-lg">
            <span style={{ color: HIGHLIGHT }}>&ldquo;방치&rdquo;가 아니라 &ldquo;기회&rdquo;</span>로 전환할 시간입니다.
          </p>
        </div>
      </section>

      {/* ── HOW WE WORK: Heritage Layer가 제공하는 것 ── */}
      <section className="relative px-6 py-16 sm:px-10 sm:py-24 md:px-16 md:py-32">
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-12 text-center md:mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: HIGHLIGHT }}>What We Provide</span>
            <h2 className="mt-3 text-3xl font-medium md:text-4xl">Heritage Layer가 제공하는 것</h2>
            <p className="mt-4" style={{ color: 'hsl(0 0% 75%)' }}>유휴자산 재생을 5단계로 연결합니다</p>
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
                className="relative flex flex-col p-6 transition-colors sm:min-h-[280px] md:p-8"
                style={{
                  background: 'hsl(0 0% 100% / 0.04)',
                  border: '1px solid hsl(0 0% 100% / 0.10)',
                }}
              >
                <span className="text-xs font-medium tracking-[0.2em]" style={{ color: HIGHLIGHT }}>STEP {s.num}</span>
                <h3 className="mt-4 text-xl font-medium sm:text-2xl">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'hsl(0 0% 75%)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM FEATURES (원형 다이어그램) ── */}
      <section className="relative px-6 py-20 sm:px-10 sm:py-28 md:px-16 md:py-36">
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: HIGHLIGHT }}>Platform</span>
            <h2 className="mt-3 text-3xl font-medium md:text-4xl">플랫폼 기능</h2>
            <p className="mx-auto mt-4 max-w-2xl" style={{ color: 'hsl(0 0% 75%)' }}>
              Heritage Layer는 누구나 무료로 이용할 수 있는 데이터 기반 재생 플랫폼입니다.
            </p>
          </div>

          {/* 원형 다이어그램 */}
          <div className="relative mx-auto aspect-square w-full max-w-[560px] sm:max-w-[640px]">
            {/* 외곽 원 라인 */}
            <div
              className="absolute inset-0 rounded-full"
              style={{ border: '1px solid hsl(0 0% 100% / 0.15)' }}
            />
            <div
              className="absolute inset-[10%] rounded-full"
              style={{ border: '1px dashed hsl(0 0% 100% / 0.08)' }}
            />

            {/* 중앙 원 — Heritage Layer */}
            <div className="absolute left-1/2 top-1/2 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center sm:h-48 sm:w-48"
              style={{
                background: 'hsl(0 0% 100% / 0.06)',
                border: '1px solid hsl(0 0% 100% / 0.25)',
              }}
            >
              <span className="text-xs font-medium uppercase tracking-[0.25em]" style={{ color: HIGHLIGHT }}>The Layer</span>
              <p className="mt-2 text-base font-medium sm:text-lg">Heritage<br/>Layer</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-7 border-white/25 bg-transparent px-3 text-[10px] text-white hover:bg-white/10 hover:text-white"
                onClick={() => navigate('/properties')}
              >
                자산 탐색
              </Button>
            </div>

            {/* 아이콘 — 원 둘레 배치 */}
            {features.map((f, i) => {
              const angle = (i / features.length) * 2 * Math.PI - Math.PI / 2;
              const r = 50; // %
              const left = 50 + r * Math.cos(angle);
              const top = 50 + r * Math.sin(angle);
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: `${left}%`, top: `${top}%`, width: 'min(28%, 130px)' }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14"
                    style={{
                      background: DARK_BG,
                      border: '1px solid hsl(0 0% 100% / 0.25)',
                    }}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#ffffff' }} />
                  </div>
                  <p className="mt-2 text-center text-[10px] leading-tight sm:text-xs" style={{ color: 'hsl(0 0% 82%)' }}>
                    {f.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
