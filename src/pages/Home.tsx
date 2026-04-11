import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PartnerForm from '@/components/common/PartnerForm';
import { ArrowRight, Search, Brain, Handshake, School, Home as HomeIcon, MapPin } from 'lucide-react';

const stats = [
  { icon: School, label: '폐교', value: '4,008개', desc: '전국 폐교 현황' },
  { icon: HomeIcon, label: '방치 빈집', value: '13만 호', desc: '관리 사각지대' },
  { icon: MapPin, label: '소멸위험 지역', value: '118개', desc: '인구감소 위기' },
];

const steps = [
  { num: '01', icon: Search, title: '전국 유휴자산 탐색', desc: '폐교, 빈집, 유휴 공공시설을 데이터 기반으로 탐색합니다.' },
  { num: '02', icon: Brain, title: 'AI 재생 가능성 분석', desc: '입지, 법규, 시장 데이터를 결합해 재생 가능성을 평가합니다.' },
  { num: '03', icon: Handshake, title: '직접 딜 연결', desc: '지자체·시행사와 직접 연결하여 사업을 실행합니다.' },
];

const cooperations = [
  { title: 'PPP 운영권', desc: '민관협력으로 유휴자산 운영권을 확보합니다.' },
  { title: '공동개발', desc: '지자체와 함께 재생 프로젝트를 기획·실행합니다.' },
  { title: '자산매입', desc: '적정가에 자산을 매입하여 직접 재생합니다.' },
];

// Building silhouette data (x%, width, height as vh)
const buildings = [
  { x: 0, w: 6, h: 45 },
  { x: 5, w: 5, h: 60 },
  { x: 9, w: 7, h: 50 },
  { x: 15, w: 4, h: 70 },
  { x: 18, w: 6, h: 55 },
  { x: 23, w: 5, h: 40 },
  { x: 28, w: 8, h: 65 },
  { x: 35, w: 5, h: 50 },
  { x: 39, w: 7, h: 75 },
  { x: 45, w: 6, h: 55 },
  { x: 50, w: 5, h: 45 },
  { x: 54, w: 8, h: 60 },
  { x: 61, w: 5, h: 80 },
  { x: 65, w: 7, h: 50 },
  { x: 71, w: 6, h: 65 },
  { x: 76, w: 5, h: 45 },
  { x: 80, w: 7, h: 70 },
  { x: 86, w: 5, h: 55 },
  { x: 90, w: 6, h: 60 },
  { x: 95, w: 6, h: 50 },
];

const HomePage = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToPartners = () => {
    document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero with Parallax */}
      <section
        ref={heroRef}
        className="relative overflow-hidden"
        style={{
          height: '100vh',
          background: 'linear-gradient(180deg, hsl(220 30% 12%) 0%, hsl(220 25% 18%) 60%, hsl(220 20% 22%) 100%)',
        }}
      >
        {/* Text layer (behind silhouettes) */}
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 lg:px-20 z-10">
          <span
            className="mb-4 text-xs font-semibold tracking-[0.3em] uppercase"
            style={{ color: 'hsl(220 20% 55%)' }}
          >
            Heritage Layer
          </span>
          <h1
            className="py-[10px] font-medium my-0 border-none text-3xl"
            style={{ color: 'hsl(0 0% 95%)' }}
          >
            국내 최초 No.1<br />
            유휴부지를 활용한<br />
            부동산 재생 솔루션
          </h1>
        </div>

        {/* Building silhouettes (foreground, parallax) */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
          style={{
            transform: `translateY(${scrollY * 0.4}px)`,
            willChange: 'transform',
          }}
        >
          <svg
            viewBox="0 0 100 50"
            preserveAspectRatio="none"
            className="w-full"
            style={{ height: '70vh' }}
          >
            {buildings.map((b, i) => (
              <rect
                key={i}
                x={b.x}
                y={50 - b.h * 0.5}
                width={b.w}
                height={b.h * 0.5}
                fill={`hsl(220 25% ${8 + (i % 3) * 3}%)`}
                opacity={0.7 + (i % 3) * 0.1}
              />
            ))}
          </svg>
        </div>

        {/* Secondary silhouette layer (slower parallax, deeper) */}
        <div
          className="absolute bottom-0 left-0 right-0 z-[5] pointer-events-none"
          style={{
            transform: `translateY(${scrollY * 0.15}px)`,
            willChange: 'transform',
          }}
        >
          <svg
            viewBox="0 0 100 50"
            preserveAspectRatio="none"
            className="w-full"
            style={{ height: '60vh' }}
          >
            {buildings.map((b, i) => (
              <rect
                key={i}
                x={b.x + 3}
                y={50 - b.h * 0.35}
                width={b.w * 0.8}
                height={b.h * 0.35}
                fill={`hsl(220 20% ${14 + (i % 4) * 2}%)`}
                opacity={0.4}
              />
            ))}
          </svg>
        </div>

        {/* Glass "접속하기" button */}
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
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: 'hsl(var(--accent))' }}
            />
          </button>
        </div>

        {/* SCROLL indicator */}
        <div
          className="absolute bottom-8 right-8 z-30 text-xs tracking-widest"
          style={{
            color: 'rgba(255,255,255,0.3)',
            writingMode: 'vertical-rl',
          }}
        >
          SCROLL
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 py-20">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label} className="text-center transition-shadow hover:shadow-md">
              <CardContent className="p-8">
                <s.icon className="mx-auto mb-4 h-8 w-8 text-accent" />
                <p className="text-3xl font-bold tracking-tight">{s.value}</p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Service Steps */}
      <section className="bg-muted/50 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Heritage Layer는 이렇게 작동합니다</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                  <s.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xs font-bold tracking-widest text-accent">{s.num}</span>
                <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Teaser */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mb-4 text-3xl font-bold">전국 유휴자산 지도</h2>
          <p className="mb-8 text-muted-foreground">데이터 기반으로 전국의 재생 가능 자산을 한눈에 확인하세요</p>
          <div className="mx-auto mb-8 flex aspect-[16/9] max-w-3xl items-center justify-center rounded-xl bg-muted">
            <div className="text-center text-muted-foreground">
              <MapPin className="mx-auto mb-2 h-12 w-12" />
              <p className="text-sm">전국 유휴자산 분포 지도</p>
            </div>
          </div>
          <Button size="lg" onClick={() => navigate('/properties')}>
            지금 탐색하기 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="bg-muted/50 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-3xl font-bold">지자체·시행사 협력 제안</h2>
          <p className="mb-10 text-center text-muted-foreground">
            귀 기관의 유휴자산, Heritage Layer가 예산 없이 재생합니다
          </p>
          <div className="mb-12 grid gap-6 sm:grid-cols-3">
            {cooperations.map((c) => (
              <Card key={c.title} className="text-center">
                <CardContent className="p-6">
                  <h3 className="mb-2 text-lg font-semibold">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <PartnerForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© 2025 Heritage Layer. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;
