import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import PartnerForm from '@/components/common/PartnerForm';
import { Database, Lightbulb, Rocket, Check, X } from 'lucide-react';
import aboutHeroBg from '@/assets/about-hero-bg.png';

const methodology = [
  { icon: Database, step: '01', title: '데이터 분석', desc: '전국 유휴자산 데이터를 수집·정제하여 재생 가능성을 정량 평가합니다.' },
  { icon: Lightbulb, step: '02', title: '재생 방향 도출', desc: '입지·법규·시장 분석을 바탕으로 최적의 재생 시나리오를 도출합니다.' },
  { icon: Rocket, step: '03', title: '딜 실행', desc: '지자체·시행사와 연결하여 실제 사업화를 추진합니다.' },
];

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
  return (
    <div className="min-h-screen">
      {/* Intro */}
      <section
        className="relative flex items-center justify-center px-4 text-center"
        style={{
          backgroundImage: `url(${aboutHeroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '80vh',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.55)' }} />
        <div className="relative mx-auto max-w-3xl z-10">
          <Badge variant="secondary" className="mb-4">THE LAYER</Badge>
          <h1 className="mb-6 text-3xl font-bold sm:text-4xl" style={{ color: 'hsl(0 0% 95%)' }}>
            우리는 유휴자산을 가장 잘 아는<br />재생 사업자입니다
          </h1>
          <p className="leading-relaxed" style={{ color: 'hsl(0 0% 80%)' }}>
            Heritage Layer는 전국의 유휴 부동산 자산을 데이터 기반으로 분석하고,
            최적의 재생 방향을 도출하여 실제 딜로 연결하는 플랫폼입니다.
            폐교, 빈집, 유휴 공공시설을 새로운 가치의 공간으로 전환합니다.
          </p>
        </div>
      </section>

      {/* Methodology */}
      <section className="bg-muted/50 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">재생 방법론</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {methodology.map((m) => (
              <Card key={m.step} className="text-center">
                <CardContent className="p-8">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                    <m.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="text-xs font-bold tracking-widest text-accent">{m.step}</span>
                  <h3 className="mt-1 text-lg font-semibold">{m.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform / Pricing */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-center text-3xl font-bold">플랫폼 소개</h2>
          <p className="mb-10 text-center text-muted-foreground">
            Heritage Layer의 스코어링 시스템은 입지, 법규, 시장 데이터를 결합하여
            각 자산의 재생 가능성을 S~D 등급으로 평가합니다.
          </p>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2">기능</TableHead>
                    <TableHead className="text-center">무료</TableHead>
                    <TableHead className="text-center">Pro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparison.map((row) => (
                    <TableRow key={row.feature}>
                      <TableCell className="font-medium">{row.feature}</TableCell>
                      <TableCell className="text-center">
                        {row.free ? <Check className="mx-auto h-4 w-4 text-accent" /> : <X className="mx-auto h-4 w-4 text-muted-foreground/40" />}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.pro ? <Check className="mx-auto h-4 w-4 text-accent" /> : <X className="mx-auto h-4 w-4 text-muted-foreground/40" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="bg-muted/50 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-3xl font-bold">지자체·시행사 협력 제안</h2>
          <p className="mb-10 text-center text-muted-foreground">
            귀 기관의 유휴자산, Heritage Layer가 예산 없이 재생합니다
          </p>
          <PartnerForm />
        </div>
      </section>

      <footer className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© 2025 Heritage Layer. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AboutPage;
