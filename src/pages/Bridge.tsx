import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, ArrowRight, Compass, Wrench, Crown, Info } from 'lucide-react';

interface Level {
  key: 'L1' | 'L2' | 'L3';
  name: string;
  title: string;
  price: string;
  priceNote?: string;
  target: string;
  role: string;
  successFee?: string;
  Icon: React.ComponentType<{ className?: string }>;
  items: string[];
  highlight?: boolean;
}

const levels: Level[] = [
  {
    key: 'L1',
    name: 'Level 1',
    title: '사업성 검토 자문',
    price: '₩500만~1,000만',
    priceNote: '고정',
    target: '소형 투자자 · 첫 개발 도전자',
    role: '판단 지원 — 숫자 너머의 맥락을 더합니다',
    Icon: Compass,
    items: [
      '알고리즘 분석 해설 (전문가 해석 추가)',
      '개발 방향 타당성 검토',
      '투자비 개략 산출 (공사비·인허가비·금융비용)',
      '우선협상 전략 제안 (소유자 접촉·협상 방향)',
      '검토 보고서 제출 (A4 10~15장)',
    ],
  },
  {
    key: 'L2',
    name: 'Level 2',
    title: '착수 지원',
    price: '₩1,500만~3,000만',
    priceNote: '+ 성공보수',
    target: '중소 시행사 · 인허가/금융 역량 부족 투자자',
    role: '실제 인허가·금융 준비 단계까지 함께 갑니다',
    successFee: '금융 조달 성사 시 조달액의 0.5~1%',
    Icon: Wrench,
    highlight: true,
    items: [
      'Level 1 전체 포함',
      '인허가 사전 검토 (건축사 협업, 용도변경·종상향)',
      '지자체 사전 협의 동행 (변호사·건축사 동행)',
      '사업 제안서 작성',
      'PF·자본조달 구조 설계 초안',
      '금융기관 제안서 작성 및 파트너 금융기관 소개',
    ],
  },
  {
    key: 'L3',
    name: 'Level 3',
    title: '전체 PM',
    price: '개발비의 3~5%',
    target: '패밀리 오피스 · 전체 위탁 원하는 기업·기관',
    role: '전 과정 책임 관리 — 시간 없는 자본을 위해',
    Icon: Crown,
    items: [
      '예산 수립 및 관리 (공사비·부대비·예비비, 월별 보고)',
      '공정 스케줄 관리 (마일스톤·지연 리스크 대응)',
      '업체 선정 및 관리 (시공·설계·CM, 품질 감독)',
      '인허가 컨설팅 (모니터링·이슈 대응)',
      'PF·자본조달 구조 관리',
      'Level 2 연계 (실행이 필요한 항목은 별도 계약)',
    ],
  },
];

const customerMatrix = [
  { type: '대형 시행사·개발사', sub: 'Enterprise', bridge: '불필요', note: '자체 역량 보유 · 정보 수집 목적' },
  { type: '중소 시행사 (특정 역량 부족)', sub: 'Enterprise', bridge: 'Level 1~2 선택적', note: '인허가·지자체 협의 수요 높음' },
  { type: '패밀리 오피스·고액 투자자', sub: 'Pro 또는 Enterprise', bridge: 'Level 3 + Level 2 연계', note: '전체 위탁 수요 · 최우선 타깃' },
  { type: '소규모 시행사·첫 개발 도전자', sub: 'Pro', bridge: 'Level 1 → 업셀', note: '검토 후 Level 2~3으로 자연 연결' },
  { type: '기관 투자자', sub: 'Enterprise', bridge: 'Level 2~3 협의', note: '딜 플로우 확보 + PM 위탁 목적' },
];

const processSteps = [
  { n: '01', title: '상담 신청', desc: '프로젝트 개요·자산 정보 공유. 초기 적합도 확인.' },
  { n: '02', title: '자산·사업성 검토', desc: '알고리즘 분석 + 전문가 해석. 적정 레벨 제안.' },
  { n: '03', title: '계약·착수', desc: '레벨별 계약 체결. 인허가·금융·PM 실행 시작.' },
  { n: '04', title: '실행·정산', desc: '진행 보고 및 마일스톤 정산. 성공보수 정산 포함.' },
];

const Bridge = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center md:py-28">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Bridge Solution
          </p>
          <h1 className="font-serif text-4xl font-semibold leading-tight md:text-5xl">
            정보를 넘어, 실행까지
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-primary-foreground/80 md:text-lg">
            구독이 정보 접근권이라면, Bridge Solution은 프로젝트 단위 실행 지원입니다.
            <br className="hidden md:block" />
            사업성 검토부터 인허가·금융 조달, 전체 PM까지 — 필요한 만큼 선택하세요.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="secondary" onClick={() => navigate('/contact')}>
              프로젝트 상담 신청
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/pricing')}
            >
              구독 요금제 보기
            </Button>
          </div>
        </div>
      </section>

      {/* 구독 vs Bridge */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">구독 서비스</CardTitle>
              <p className="text-sm text-muted-foreground">정보 접근권 · 월정액</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>· 전국 유휴자산 지도와 데이터 분석 결과 열람</p>
              <p>· Pro부터 IRR·DSCR 시뮬레이션과 시나리오 비교</p>
              <p>· 사용자가 직접 판단 · 외부 실행</p>
            </CardContent>
          </Card>
          <Card className="border-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                Bridge Solution
                <Badge className="bg-accent text-accent-foreground">실행 지원</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">프로젝트 단위 계약 · 착수금 + 성공보수</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>· 인허가·지자체 협의·PF 구조화 등 실제 실행 지원</p>
              <p>· 변호사·건축사·금융 파트너 네트워크 활용</p>
              <p>· Enterprise 고객 전용 또는 단독 계약 가능 (Level 1)</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3 Levels */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl font-semibold">3개 레벨</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              필요한 깊이만큼 선택하세요. Level 1은 단독 계약도 가능합니다.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {levels.map(({ key, name, title, price, priceNote, target, role, successFee, Icon, items, highlight }) => (
              <Card
                key={key}
                className={`flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg ${
                  highlight ? 'border-accent shadow-md' : ''
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    {successFee && (
                      <Badge variant="outline" className="border-accent text-accent">
                        + 성공보수
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {name}
                  </p>
                  <CardTitle className="mt-1 text-xl">{title}</CardTitle>
                  <div className="mt-3">
                    <span className="text-2xl font-bold">{price}</span>
                    {priceNote && (
                      <span className="ml-1 text-sm text-muted-foreground">{priceNote}</span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{role}</p>
                  <p className="mt-1 text-xs text-muted-foreground/80">타깃: {target}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="space-y-2 text-sm">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                  {successFee && (
                    <p className="mt-4 rounded-md bg-accent/10 px-3 py-2 text-xs text-foreground">
                      <Info className="mr-1 inline h-3 w-3 text-accent" />
                      {successFee}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            ※ Level 3은 PM 프레임워크 계약입니다. 인허가 실행·PF 구조화 등 특정 실행 항목은 Level 2 용역을 별도 추가 계약하는 방식으로 운영합니다.
          </p>
        </div>
      </section>

      {/* Customer matrix */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="font-serif text-3xl font-semibold">누가 어느 레벨을 쓰는가</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            고객 유형별 권장 조합. 상담 시 적합한 레벨을 함께 설계합니다.
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>고객 유형</TableHead>
                  <TableHead>구독 레벨</TableHead>
                  <TableHead>브릿지 레벨</TableHead>
                  <TableHead>비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerMatrix.map((row) => (
                  <TableRow key={row.type}>
                    <TableCell className="font-medium">{row.type}</TableCell>
                    <TableCell>{row.sub}</TableCell>
                    <TableCell>{row.bridge}</TableCell>
                    <TableCell className="text-muted-foreground">{row.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Process */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl font-semibold">진행 프로세스</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {processSteps.map((step) => (
              <Card key={step.n} className="border-border/60">
                <CardContent className="p-5">
                  <p className="font-serif text-2xl text-accent">{step.n}</p>
                  <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-snug text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="font-serif text-3xl font-semibold">프로젝트가 있으신가요?</h2>
        <p className="mt-3 text-muted-foreground">
          자산 주소와 개요만 알려주시면, 가장 적합한 레벨을 제안드립니다.
        </p>
        <Button size="lg" className="mt-6" onClick={() => navigate('/contact')}>
          상담 신청하기 <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </section>
    </div>
  );
};

export default Bridge;
