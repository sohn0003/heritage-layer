import { useNavigate } from 'react-router-dom';
import Seo from '@/components/common/Seo';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

// ── 톤: 화이트 / 라이트 블루 / 다크 네이비 3단계만 사용 ──
const DARK = 'hsl(226 35% 10%)';
const DARK_TEXT = 'hsl(0 0% 95%)';
const DARK_SUB = 'hsl(0 0% 68%)';
const LIGHT = 'hsl(205 35% 96%)';
const LIGHT_TEXT = 'hsl(226 35% 12%)';
const LIGHT_SUB = 'hsl(226 12% 40%)';
const LINE_DARK = 'hsl(0 0% 100% / 0.14)';
const LINE_LIGHT = 'hsl(226 20% 82%)';

type Tone = 'dark' | 'light';

const Section = ({
  tone, eyebrow, title, lead, children,
}: {
  tone: Tone; eyebrow: string; title: React.ReactNode; lead?: React.ReactNode; children?: React.ReactNode;
}) => (
  <section
    className="px-6 py-20 sm:px-10 md:px-16 md:py-28"
    style={{
      background: tone === 'dark' ? DARK : LIGHT,
      color: tone === 'dark' ? DARK_TEXT : LIGHT_TEXT,
    }}
  >
    <div className="mx-auto max-w-5xl">
      <p
        className="font-display text-[11px] font-normal uppercase tracking-[0.35em]"
        style={{ color: tone === 'dark' ? DARK_SUB : LIGHT_SUB }}
      >
        {eyebrow}
      </p>
      <h2 className="mt-6 max-w-3xl text-2xl font-light leading-[1.45] sm:text-3xl md:text-4xl">
        {title}
      </h2>
      {lead && (
        <p
          className="mt-6 max-w-2xl text-sm leading-[1.9] md:text-base"
          style={{ color: tone === 'dark' ? DARK_SUB : LIGHT_SUB }}
        >
          {lead}
        </p>
      )}
      {children && <div className="mt-14">{children}</div>}
    </div>
  </section>
);

// 좌측 인덱스 + 우측 본문의 라인 리스트 (Cosmo-P 레퍼런스 배열)
const LineList = ({
  tone, items,
}: {
  tone: Tone;
  items: { index: string; title: string; desc?: string }[];
}) => {
  const line = tone === 'dark' ? LINE_DARK : LINE_LIGHT;
  const sub = tone === 'dark' ? DARK_SUB : LIGHT_SUB;
  return (
    <div style={{ borderTop: `1px solid ${line}` }}>
      {items.map((it) => (
        <div
          key={it.index + it.title}
          className="grid grid-cols-1 gap-3 py-8 md:grid-cols-[120px_1fr] md:gap-8 md:py-10"
          style={{ borderBottom: `1px solid ${line}` }}
        >
          <span className="font-display text-xs tracking-[0.25em]" style={{ color: sub }}>
            {it.index}
          </span>
          <div>
            <h3 className="text-lg font-light leading-[1.5] md:text-2xl">{it.title}</h3>
            {it.desc && (
              <p className="mt-3 max-w-2xl text-sm leading-[1.9] md:text-base" style={{ color: sub }}>
                {it.desc}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const StatRow = ({ items }: { items: { label: string; value: string; note: string }[] }) => (
  <div style={{ borderTop: `1px solid ${LINE_LIGHT}` }}>
    {items.map((s) => (
      <div
        key={s.label}
        className="flex flex-wrap items-baseline justify-between gap-2 py-7"
        style={{ borderBottom: `1px solid ${LINE_LIGHT}` }}
      >
        <span className="text-sm md:text-base" style={{ color: LIGHT_SUB }}>{s.label}</span>
        <span className="font-display text-2xl font-light tabular-nums md:text-4xl">{s.value}</span>
        <span className="w-full text-xs md:w-auto md:text-sm" style={{ color: LIGHT_SUB }}>{s.note}</span>
      </div>
    ))}
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
        lead={<>지역은 텅 비어가는데, 활용할 방법은 없습니다. 데이터는 흩어져 있고 절차는 복잡합니다.</>}
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
            { label: '국·공유 자산 비중', value: '62%', note: '민관협력 기회가 큰 영역' },
          ]}
        />
      </Section>

      {/* 03. ROOT CAUSE */}
      <Section
        tone="dark"
        eyebrow="Root Cause"
        title="왜 재생되지 못할까요?"
        lead="방치는 우연이 아닙니다. 구조적 원인이 네 가지 축에서 작동하고 있습니다."
      >
        <LineList
          tone="dark"
          items={[
            { index: 'C1', title: '정보 사일로화', desc: '유휴자산 정보가 교육부·국토부·행안부·지자체별로 흩어져 있습니다. 통합 파악이 구조적으로 불가능합니다.' },
            { index: 'C2', title: '사업성 판단 어려움', desc: '용도지역·건폐율·수요환경을 종합 분석할 도구가 없습니다. 개인·소규모 주체의 진입 장벽이 높습니다.' },
            { index: 'C3', title: '인허가 불확실성', desc: '수의계약·민간제안·종상향 등 공공자산 활용 경로가 복잡하고, 지자체마다 조건이 다릅니다.' },
            { index: 'C4', title: '재무 모델 부재', desc: '전환 용도별 IRR·DSCR·투자회수기간 등 재무 검증 수단이 없어 투자 결정이 직관에 의존합니다.' },
          ]}
        />
      </Section>

      {/* 04. WHAT WE PROVIDE */}
      <Section
        tone="light"
        eyebrow="What We Provide"
        title="Heritage Layer가 제공하는 것"
        lead="유휴자산 재생을 다섯 단계로 연결합니다."
      >
        <LineList
          tone="light"
          items={[
            { index: 'STEP 01', title: '자산 탐색', desc: '전국 유휴자산 지도 핀 탐색. 등급 배치(S~D)로 즉시 확인합니다.' },
            { index: 'STEP 02', title: '등급 분석', desc: 'COSMO-P 알고리즘이 입지·규제·심미성·사업성 4분류를 종합 평가합니다.' },
            { index: 'STEP 03', title: '시나리오', desc: '1/2/3순위 개발 방향을 자동 추천하고 전환 용도·공사 방식·대출 구조를 제안합니다.' },
            { index: 'STEP 04', title: '재무 검증', desc: 'IRR·DSCR·투자회수기간을 실시간 시뮬레이션하고 자기자본 손익을 즉시 재계산합니다.' },
            { index: 'STEP 05', title: '딜 연결', desc: '브릿지 솔루션으로 기회 발굴부터 PM까지 지원합니다.' },
          ]}
        />
      </Section>

      {/* 05. OUR SERVICE */}
      <Section
        tone="dark"
        eyebrow="Our Service"
        title={<>유휴자산 등록부터 매입까지,<br className="hidden sm:block" /> 매니징해주는 파트너</>}
        lead="Heritage Layer는 단순 분석 도구가 아닙니다. 자산 발굴부터 사업화까지 전 과정을 함께 책임집니다."
      >
        <LineList
          tone="dark"
          items={[
            { index: 'S1', title: '유휴자산 통합 데이터베이스', desc: '전국에 흩어진 폐교·빈집·유휴 공공시설을 한곳에 모아 시각화합니다. 검증된 자산 정보를 즉시 탐색할 수 있습니다.' },
            { index: 'S2', title: '재생 가능성 진단', desc: '입지·법규·시장·예산 등 6개 차원을 결합한 알고리즘이 자산별 재생 가능성을 점수화하고 사업 시나리오와 수익성 시뮬레이션을 제공합니다.' },
            { index: 'S3', title: '등록부터 매입까지 풀 매니징', desc: '자산 등록·인허가 검토·지자체 협력 구조 설계·매입 실행까지 전 과정을 매니징하고 필요한 자본·전문가 리소스를 함께 제공합니다.' },
          ]}
        />
      </Section>

      {/* 06. 플랫폼 기능 */}
      <Section
        tone="light"
        eyebrow="Platform"
        title="플랫폼 기능"
        lead="Heritage Layer는 누구나 무료로 이용할 수 있는 데이터 기반 재생 플랫폼입니다."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ borderTop: `1px solid ${LINE_LIGHT}` }}>
          {[
            '자산 탐색', '기본 정보 열람', '재생 등급 확인',
            '재생 시나리오', '재무 수익성 지표', '시나리오 비교표',
            '정부협력 경로', '딜 관심 표명', '무제한 자산 저장',
          ].map((f, i) => (
            <div
              key={f}
              className="flex items-baseline gap-4 py-6"
              style={{ borderBottom: `1px solid ${LINE_LIGHT}` }}
            >
              <span className="font-display text-xs tabular-nums tracking-[0.2em]" style={{ color: LIGHT_SUB }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-base font-light md:text-lg">{f}</span>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Button variant="outline" onClick={() => navigate('/properties')}>자산 탐색하기</Button>
        </div>
      </Section>

      <Footer />
    </div>
  );
};

export default AboutPage;
