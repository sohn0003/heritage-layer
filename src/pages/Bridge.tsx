import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Map, FileText, LineChart, ClipboardCheck, ArrowRight, CheckCircle2,
  Compass, Wrench, Crown,
} from 'lucide-react';
import BridgeInquiryForm, { type BridgeLevel } from '@/components/common/BridgeInquiryForm';
import Seo from '@/components/common/Seo';

// ── Scroll reveal 훅 ──────────────────────────
const useInView = <T extends Element>(threshold = 0.25) => {
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

// ── Process step: 좌측 큰 아이콘, 우측 텍스트 — 스크롤 시 페이드+슬라이드 ──
const ProcessStep = ({
  num, icon: Icon, title, desc, isLast = false,
}: {
  num: string; icon: any; title: string; desc: string; isLast?: boolean;
}) => {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  return (
    <div
      ref={ref}
      className="relative flex gap-6 pb-16 transition-all duration-700 ease-out sm:gap-10"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
      }}
    >
      {/* 아이콘 + 세로 연결선 */}
      <div className="relative flex shrink-0 flex-col items-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl border sm:h-20 sm:w-20"
          style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))' }}
        >
          <Icon className="h-7 w-7 text-foreground sm:h-9 sm:w-9" strokeWidth={1.5} />
        </div>
        {!isLast && (
          <div
            className="mt-2 w-px flex-1"
            style={{ background: 'hsl(var(--border))', minHeight: '48px' }}
          />
        )}
      </div>
      <div className="flex-1 pt-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Step {num}
        </p>
        <h3 className="mt-2 text-xl font-semibold sm:text-2xl">{title}</h3>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {desc}
        </p>
      </div>
    </div>
  );
};

// ── 유료 서비스: 라인형 아이템 ──
const ServiceItem = ({
  icon: Icon, title, desc,
}: { icon: any; title: string; desc: string }) => (
  <div className="flex gap-5 border-b border-border/50 py-6">
    <Icon className="mt-1 h-5 w-5 shrink-0 text-foreground" strokeWidth={1.5} />
    <div>
      <h4 className="text-base font-semibold sm:text-lg">{title}</h4>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  </div>
);

// ── 3단계 레벨 ──
const levels = [
  {
    key: 'L1' as BridgeLevel, name: 'Level 1', title: '사업성 검토 자문',
    Icon: Compass,
    items: ['알고리즘 분석 해설', '개발 방향 타당성 검토', '투자비 개략 산출', '검토 보고서 제출'],
  },
  {
    key: 'L2' as BridgeLevel, name: 'Level 2', title: '착수 지원',
    Icon: Wrench,
    items: ['Level 1 전체 포함', '인허가 사전 검토', '지자체 사전 협의', '사업 제안서 작성', 'PF·자본조달 설계'],
  },
  {
    key: 'L3' as BridgeLevel, name: 'Level 3', title: '전체 PM',
    Icon: Crown,
    items: ['예산 수립·관리', '공정 스케줄 관리', '업체 선정·감독', '인허가 컨설팅', 'PF 구조 관리'],
  },
];

const Bridge = () => {
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryLevel, setInquiryLevel] = useState<BridgeLevel>('L1');
  const [successOpen, setSuccessOpen] = useState(false);

  const openInquiry = (lvl: BridgeLevel = 'L1') => {
    setInquiryLevel(lvl);
    setInquiryOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <Seo
        title="컨설팅 의뢰 — Heritage Layer"
        description="지도 열람은 무료, 사업계획서·레포트·타당성 검토는 유료 컨설팅으로 지원합니다."
        path="/bridge"
      />

      {/* ── HERO ── */}
      <section className="mx-auto max-w-3xl px-6 sm:px-8 pt-20 pb-16 text-center sm:pt-28">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Consulting
        </p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          지도는 무료,<br />실행은 컨설팅으로.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Heritage Layer의 유휴자산 지도와 데이터 분석은 누구나 무료로 이용할 수 있습니다.
          사업계획서·레포트·타당성 검토가 필요할 때, 컨설팅을 요청하세요.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => openInquiry('L1')}>
            컨설팅 의뢰하기 <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ── 무료 vs 유료 — 라인 구분 ── */}
      <section className="mx-auto max-w-4xl px-6 sm:px-8 py-8">
        <div className="grid gap-8 border-y border-border/60 py-10 md:grid-cols-2 md:divide-x md:divide-border/60">
          <div className="md:pr-8">
            <div className="mb-3 flex items-center gap-2">
              <Map className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Free</span>
            </div>
            <h3 className="text-lg font-semibold sm:text-xl">지도 · 데이터 열람</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
              전국 유휴자산 지도, 등급 조회, 기본 재무 시뮬레이션까지 — 회원가입만으로 무료 이용.
            </p>
          </div>
          <div className="md:pl-8">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">Paid Consulting</span>
            </div>
            <h3 className="text-lg font-semibold sm:text-xl">사업계획서 · 레포트 · 타당성 검토</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
              프로젝트 단위 계약. 실제 사업 실행에 필요한 문서 작성부터 인허가·자본조달·PM까지.
            </p>
          </div>
        </div>
      </section>

      {/* ── 프로세스 ── */}
      <section className="mx-auto max-w-3xl px-6 sm:px-8 py-16 sm:py-24">
        <div className="mb-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">Process</p>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">진행 프로세스</h2>
        </div>
        <div>
          <ProcessStep num="01" icon={Map} title="지도에서 관심 자산 확인"
            desc="Heritage Layer 지도에서 유휴자산과 등급, 기본 정보를 무료로 확인합니다." />
          <ProcessStep num="02" icon={FileText} title="컨설팅 의뢰 제출"
            desc="자산 주소와 프로젝트 개요를 남겨주세요. 필요한 문서·검토 범위를 함께 알려주시면 됩니다." />
          <ProcessStep num="03" icon={LineChart} title="사업성 검토 · 문서 작성"
            desc="사업계획서, 투자자용 레포트, 타당성 검토 보고서를 프로젝트 단위로 작성해 드립니다." />
          <ProcessStep num="04" icon={ClipboardCheck} title="실행 지원"
            desc="필요 시 인허가·PF·PM까지 확장 컨설팅으로 연계합니다." isLast />
        </div>
      </section>

      {/* ── 유료 서비스 목록 (라인) ── */}
      <section className="mx-auto max-w-3xl px-6 sm:px-8 py-16">
        <div className="mb-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">Paid Services</p>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">제공 서비스</h2>
        </div>
        <div className="border-t border-border/50">
          <ServiceItem icon={FileText} title="사업계획서 작성"
            desc="투자자·금융기관 제출용 사업계획서를 자산 데이터 기반으로 작성합니다." />
          <ServiceItem icon={LineChart} title="레포트 작성"
            desc="시장·경쟁·수익성 분석을 담은 프로젝트 레포트를 제공합니다." />
          <ServiceItem icon={ClipboardCheck} title="타당성 검토"
            desc="용도·인허가·재무 관점에서 사업 실행 가능성을 종합 검토합니다." />
        </div>
      </section>

      {/* ── 3 Levels — 라인 구분 ── */}
      <section className="mx-auto max-w-5xl px-6 sm:px-8 py-16">
        <div className="mb-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">Deeper Engagement</p>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">심화 컨설팅 3단계</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            필요한 깊이만큼 선택하세요. 검토 자문부터 전체 PM까지.
          </p>
        </div>
        <div className="grid gap-0 border-t border-border/50 md:grid-cols-3 md:divide-x md:divide-border/50 md:border-t-0">
          {levels.map(({ key, name, title, Icon, items }) => (
            <div key={key} className="flex flex-col border-b border-border/50 py-8 md:border-b-0 md:px-8 md:py-2">
              <Icon className="h-5 w-5" strokeWidth={1.5} />
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{name}</p>
              <h3 className="mt-1 text-lg font-semibold">{title}</h3>
              <ul className="mt-4 flex-1 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {items.map((it) => (
                  <li key={it} className="flex items-start gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" className="mt-6 self-start"
                onClick={() => openInquiry(key)}>
                {name} 문의하기
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-3xl px-6 sm:px-8 py-20 text-center sm:py-28">
        <h2 className="text-2xl font-semibold sm:text-3xl">프로젝트가 있으신가요?</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          자산 주소와 개요만 남겨주시면, 적합한 컨설팅 범위를 제안해 드립니다.
        </p>
        <Button size="lg" className="mt-8" onClick={() => openInquiry('L1')}>
          컨설팅 의뢰하기 <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </section>

      {/* Inquiry Dialog */}
      <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">컨설팅 의뢰</DialogTitle>
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
            <DialogTitle className="text-center text-xl">문의가 접수되었습니다</DialogTitle>
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
