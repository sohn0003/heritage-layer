import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import BridgeInquiryForm, { type BridgeLevel } from '@/components/common/BridgeInquiryForm';
import Seo from '@/components/common/Seo';
import Footer from '@/components/layout/Footer';

// ── 톤: About과 동일한 2단계 대비 ──
const DARK = 'hsl(226 35% 10%)';
const DARK_TEXT = 'hsl(0 0% 95%)';
const DARK_SUB = 'hsl(0 0% 68%)';
const LIGHT = 'hsl(205 35% 96%)';
const LIGHT_TEXT = 'hsl(226 35% 12%)';
const LIGHT_SUB = 'hsl(226 12% 40%)';
const LINE_DARK = 'hsl(0 0% 100% / 0.14)';
const LINE_LIGHT = 'hsl(226 20% 82%)';

type Tone = 'dark' | 'light';

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
        <h2 className="mx-auto mt-6 max-w-3xl text-xl font-light leading-[1.5] sm:text-2xl md:text-3xl">
          {title}
        </h2>
        {lead && (
          <p
            className="mx-auto mt-6 max-w-2xl text-sm leading-[1.9]"
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

const levels = [
  {
    key: 'L1' as BridgeLevel, name: 'Level 1', title: '사업성 검토 자문',
    items: ['알고리즘 분석 해설', '개발 방향 타당성 검토', '투자비 개략 산출', '검토 보고서 제출'],
  },
  {
    key: 'L2' as BridgeLevel, name: 'Level 2', title: '착수 지원',
    items: ['Level 1 전체 포함', '인허가 사전 검토', '지자체 사전 협의', '사업 제안서 작성', 'PF·자본조달 설계'],
  },
  {
    key: 'L3' as BridgeLevel, name: 'Level 3', title: '전체 PM',
    items: ['예산 수립·관리', '공정 스케줄 관리', '업체 선정·감독', '인허가 컨설팅', 'PF 구조 관리'],
  },
];

const process = [
  { i: 'STEP 01', t: '지도에서 관심 자산 확인', d: 'Heritage Layer 지도에서 유휴자산과 등급, 기본 정보를 무료로 확인합니다.' },
  { i: 'STEP 02', t: '컨설팅 의뢰 제출', d: '자산 주소와 프로젝트 개요를 남겨주세요. 필요한 문서·검토 범위를 함께 알려주시면 됩니다.' },
  { i: 'STEP 03', t: '사업성 검토 · 문서 작성', d: '사업계획서, 투자자용 레포트, 타당성 검토 보고서를 프로젝트 단위로 작성해 드립니다.' },
  { i: 'STEP 04', t: '실행 지원', d: '필요 시 인허가·PF·PM까지 확장 컨설팅으로 연계합니다.' },
];

const services = [
  { t: '사업계획서 작성', d: '투자자·금융기관 제출용 사업계획서를 자산 데이터 기반으로 작성합니다.' },
  { t: '레포트 작성', d: '시장·경쟁·수익성 분석을 담은 프로젝트 레포트를 제공합니다.' },
  { t: '타당성 검토', d: '용도·인허가·재무 관점에서 사업 실행 가능성을 종합 검토합니다.' },
];

const RoundCTA = ({ onClick, tone = 'dark' as Tone, className = '' }: { onClick: () => void; tone?: Tone; className?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group inline-flex h-12 items-center gap-2 rounded-full px-8 text-sm font-light transition-all duration-300 ${className}`}
    style={{
      border: `1px solid ${tone === 'dark' ? LINE_DARK : LINE_LIGHT}`,
      color: tone === 'dark' ? DARK_TEXT : LIGHT_TEXT,
      background: 'transparent',
    }}
  >
    컨설팅 의뢰하기
    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
  </button>
);

const Bridge = () => {
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryLevel, setInquiryLevel] = useState<BridgeLevel>('L1');
  const [successOpen, setSuccessOpen] = useState(false);

  const openInquiry = (lvl: BridgeLevel = 'L1') => {
    setInquiryLevel(lvl);
    setInquiryOpen(true);
  };

  return (
    <div className="min-h-screen [word-break:keep-all]" style={{ background: DARK }}>
      <Seo
        title="컨설팅 의뢰 — Heritage Layer"
        description="사업성 가치를 올려줄 전문가와 함께 사업계획서·레포트·타당성 검토를 진행하세요."
        path="/bridge"
      />

      {/* HERO */}
      <section className="px-6 pb-24 pt-32 text-center sm:px-10 md:px-16 md:pb-32 md:pt-40" style={{ background: DARK, color: DARK_TEXT }}>
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <p className="font-display text-[11px] uppercase tracking-[0.35em]" style={{ color: DARK_SUB }}>Consulting</p>
            <h1 className="mt-8 text-2xl font-light leading-[1.5] sm:text-3xl md:text-4xl">
              사업성 가치를 올려줄<br className="hidden sm:block" /> 전문가를 만나보세요.
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-sm leading-[1.9]" style={{ color: DARK_SUB }}>
              Heritage Layer의 유휴자산 지도와 데이터 분석은 누구나 무료로 이용할 수 있습니다.
              사업계획서·레포트·타당성 검토가 필요할 때, 컨설팅을 요청하세요.
            </p>
            <div className="mt-12">
              <RoundCTA tone="dark" onClick={() => openInquiry('L1')} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* FREE vs PAID */}
      <Section
        tone="light"
        eyebrow="Scope"
        title="열람은 무료, 실행은 전문가와 함께"
      >
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-x-14 sm:grid-cols-2" style={{ borderTop: `1px solid ${LINE_LIGHT}` }}>
          {[
            { k: 'Free', t: '지도 · 데이터 열람', d: '전국 유휴자산 지도, 등급 조회, 기본 재무 시뮬레이션까지 — 회원가입만으로 무료 이용.' },
            { k: 'Paid Consulting', t: '사업계획서 · 레포트 · 타당성 검토', d: '프로젝트 단위 계약. 실제 사업 실행에 필요한 문서 작성부터 인허가·자본조달·PM까지.' },
          ].map((c, i) => (
            <Reveal key={c.k} delay={i * 100}>
              <div className="py-10" style={{ borderBottom: `1px solid ${LINE_LIGHT}` }}>
                <span className="font-display text-[11px] uppercase tracking-[0.25em]" style={{ color: LIGHT_SUB }}>{c.k}</span>
                <h3 className="mt-4 text-lg font-light md:text-xl">{c.t}</h3>
                <p className="mx-auto mt-4 max-w-sm text-sm leading-[1.9]" style={{ color: LIGHT_SUB }}>{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* PROCESS */}
      <Section
        tone="dark"
        eyebrow="Process"
        title="진행 프로세스"
        lead="문의 접수부터 실행 지원까지 네 단계로 진행됩니다."
      >
        <div className="mx-auto max-w-4xl" style={{ borderTop: `1px solid ${LINE_DARK}` }}>
          {process.map((s, i) => (
            <Reveal key={s.i} delay={i * 90}>
              <div className="py-9" style={{ borderBottom: `1px solid ${LINE_DARK}` }}>
                <span className="font-display text-xs tracking-[0.25em]" style={{ color: DARK_SUB }}>{s.i}</span>
                <h3 className="mt-3 text-lg font-light md:text-xl">{s.t}</h3>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-[1.9]" style={{ color: DARK_SUB }}>{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* SERVICES */}
      <Section
        tone="light"
        eyebrow="Paid Services"
        title="제공 서비스"
      >
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-x-14 sm:grid-cols-3" style={{ borderTop: `1px solid ${LINE_LIGHT}` }}>
          {services.map((s, i) => (
            <Reveal key={s.t} delay={i * 90}>
              <div className="py-9" style={{ borderBottom: `1px solid ${LINE_LIGHT}` }}>
                <h3 className="text-base font-light md:text-lg">{s.t}</h3>
                <p className="mt-3 text-sm leading-[1.9]" style={{ color: LIGHT_SUB }}>{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* LEVELS */}
      <Section
        tone="dark"
        eyebrow="Deeper Engagement"
        title="심화 컨설팅 3단계"
        lead="필요한 깊이만큼 선택하세요. 검토 자문부터 전체 PM까지."
      >
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-x-12 sm:grid-cols-3" style={{ borderTop: `1px solid ${LINE_DARK}` }}>
          {levels.map((lv, i) => (
            <Reveal key={lv.key} delay={i * 100}>
              <div className="flex h-full flex-col py-10" style={{ borderBottom: `1px solid ${LINE_DARK}` }}>
                <span className="font-display text-[11px] uppercase tracking-[0.25em]" style={{ color: DARK_SUB }}>{lv.name}</span>
                <h3 className="mt-3 text-lg font-light md:text-xl">{lv.title}</h3>
                <ul className="mt-5 flex-1 space-y-2 text-sm leading-[1.9]" style={{ color: DARK_SUB }}>
                  {lv.items.map((it) => <li key={it}>{it}</li>)}
                </ul>
                <button
                  type="button"
                  onClick={() => openInquiry(lv.key)}
                  className="mx-auto mt-7 h-10 rounded-full px-6 text-xs font-light transition-colors hover:bg-white/10"
                  style={{ border: `1px solid ${LINE_DARK}`, color: DARK_TEXT }}
                >
                  {lv.name} 문의하기
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="px-6 py-24 text-center sm:px-10 md:px-16 md:py-32" style={{ background: LIGHT, color: LIGHT_TEXT }}>
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-xl font-light leading-[1.5] sm:text-2xl md:text-3xl">프로젝트가 있으신가요?</h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-[1.9]" style={{ color: LIGHT_SUB }}>
              자산 주소와 개요만 남겨주시면, 적합한 컨설팅 범위를 제안해 드립니다.
            </p>
            <div className="mt-10">
              <RoundCTA tone="light" onClick={() => openInquiry('L1')} />
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />

      {/* Inquiry Dialog */}
      <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-light">컨설팅 의뢰</DialogTitle>
            <DialogDescription>
              희망 서비스와 프로젝트 정보를 알려주시면 담당자가 빠르게 안내드립니다.
            </DialogDescription>
          </DialogHeader>
          <BridgeInquiryForm
            defaultLevel={inquiryLevel}
            onSuccess={() => {
              setInquiryOpen(false);
              setSuccessOpen(true);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <CheckCircle2 className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <DialogTitle className="text-center text-xl font-light">문의가 접수되었습니다</DialogTitle>
            <DialogDescription className="text-center">
              담당자가 순차적으로 안내 연락을 드리겠습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full" onClick={() => setSuccessOpen(false)}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bridge;
