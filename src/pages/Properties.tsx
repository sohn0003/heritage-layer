import { useEffect, useMemo, useRef, useState } from 'react';
import AssetCard from '@/components/cards/AssetCard';
import AuthModal from '@/components/common/AuthModal';
import NaverMap from '@/components/map/NaverMap';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';
import Seo from '@/components/common/Seo';
import { hasValidKoreaCoordinate } from '@/lib/geo';

interface Asset {
  id: string;
  address: string;
  asset_type: string;
  idle_years: number | null;
  grade: string | null;
  gov_cooperation: boolean | null;
  land_area: number | null;
  land_value_per_sqm: number | null;
  latitude: number | null;
  longitude: number | null;
  zoning: string | null;
  building_coverage: number | null;
  floor_area_ratio: number | null;
  ownership_type: string | null;
  population_trend: string | null;
  commercial_density: string | null;
  historical_value: string | null;
  natural_scenery: string | null;
  building_condition: string | null;
  use_change_expansion: string | null;
  is_private_negotiation: boolean | null;
  is_citizen_proposal: boolean | null;
  is_waterfront_environmental: boolean | null;
  is_military_heritage_zone: boolean | null;
  is_urban_facility_conflict: boolean | null;
  has_conversion_precedent: boolean | null;
  is_urban_regeneration_area: boolean | null;
  is_abandoned_school_budget: boolean | null;
  is_balanced_dev_budget: boolean | null;
}

const grades = ['S', 'A', 'B', 'C', 'D'];
const assetTypes = ['폐교', '빈집', '유휴공공시설', '폐산업시설', '기타'];
const ownershipTypes = [{ v: 'Public', l: 'Public' }, { v: 'Private', l: 'Private' }];
const populationTrends = [
  { v: '인구증가', l: '인구증가' },
  { v: '유지', l: '유지' },
  { v: '인구감소', l: '인구감소' },
  { v: '소멸위험 지역', l: '소멸위험 지역' },
];
const densityOptions = [
  { v: '높음(반경 500m 내 10개 이상)', l: '높음 (반경 500m 내 10개 이상)' },
  { v: '낮음', l: '낮음' },
];
const historicalOptions = ['등록문화재·근대건축 유산', '지역 역사 상징성 (50년 이상)', '일반 건물'];
const sceneryOptions = ['우수한 자연경관 인접', '산·바다·강·호수 조망 가능', '도심 내 평범'];
const conditionOptions = ['리모델링 가능 (구조 양호)', '일부 보강 후 활용 가능', '대수선 필요', '전면 철거 후 신축 필요'];
const zoningOptions = ['1종 일반주거', '2종 일반주거', '3종 일반주거', '준주거', '자연녹지', '보전녹지', '계획관리지역', '농림지역', '자연환경보전'];
const expansionOptions = ['허용 용도 대폭 확대 가능', '소폭 확대 가능', '해당 없음'];

const BOOL_FLAGS: { key: keyof Asset; label: string }[] = [
  { key: 'gov_cooperation', label: '정부협력' },
  { key: 'is_private_negotiation', label: '사적협상 가능' },
  { key: 'is_citizen_proposal', label: '시민제안 가능' },
  { key: 'is_waterfront_environmental', label: '수변/환경 자산' },
  { key: 'is_military_heritage_zone', label: '군사/문화재 구역' },
  { key: 'is_urban_facility_conflict', label: '도시계획시설 저촉' },
  { key: 'has_conversion_precedent', label: '용도전환 선례 있음' },
  { key: 'is_urban_regeneration_area', label: '도시재생 활성화 지역' },
  { key: 'is_abandoned_school_budget', label: '폐교 활용 예산 대상' },
  { key: 'is_balanced_dev_budget', label: '균형발전 예산 대상' },
];

const initialFilters = {
  search: '',
  gradeFilter: [] as string[],
  typeFilter: 'all',
  ownership: 'all',
  zoning: 'all',
  idleMin: '',
  idleMax: '',
  landMin: '',
  landMax: '',
  populationTrend: 'all',
  commercialDensity: 'all',
  historicalValue: 'all',
  naturalScenery: 'all',
  buildingCondition: 'all',
  useChangeExpansion: 'all',
  bools: {} as Record<string, boolean>,
};

const PropertiesPage = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [f, setF] = useState(initialFilters);
  const [filterOpen, setFilterOpen] = useState(true);
  const [listOpen, setListOpen] = useState(true);
  const [mobileListMode, setMobileListMode] = useState<'full' | 'half' | 'collapsed'>('half');
  const dragStartY = useRef<number | null>(null);
  const dragStartMode = useRef<'full' | 'half' | 'collapsed'>('half');
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const update = <K extends keyof typeof initialFilters>(k: K, v: (typeof initialFilters)[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    const fetchAssets = async () => {
      const { data } = await supabase
        .from('assets_public')
        .select('*');
      if (data) setAssets(data as Asset[]);
    };
    fetchAssets();
  }, []);

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (f.search && !a.address.toLowerCase().includes(f.search.toLowerCase())) return false;
      if (f.gradeFilter.length && !(a.grade && f.gradeFilter.includes(a.grade))) return false;
      if (f.typeFilter !== 'all' && a.asset_type !== f.typeFilter) return false;
      if (f.ownership !== 'all' && a.ownership_type !== f.ownership) return false;
      if (f.zoning !== 'all' && a.zoning !== f.zoning) return false;
      if (f.idleMin && (a.idle_years ?? -Infinity) < Number(f.idleMin)) return false;
      if (f.idleMax && (a.idle_years ?? Infinity) > Number(f.idleMax)) return false;
      if (f.landMin && (a.land_area ?? -Infinity) < Number(f.landMin)) return false;
      if (f.landMax && (a.land_area ?? Infinity) > Number(f.landMax)) return false;
      if (f.populationTrend !== 'all' && a.population_trend !== f.populationTrend) return false;
      if (f.commercialDensity !== 'all' && a.commercial_density !== f.commercialDensity) return false;
      if (f.historicalValue !== 'all' && a.historical_value !== f.historicalValue) return false;
      if (f.naturalScenery !== 'all' && a.natural_scenery !== f.naturalScenery) return false;
      if (f.buildingCondition !== 'all' && a.building_condition !== f.buildingCondition) return false;
      if (f.useChangeExpansion !== 'all' && a.use_change_expansion !== f.useChangeExpansion) return false;
      for (const [k, v] of Object.entries(f.bools)) {
        if (v && !a[k as keyof Asset]) return false;
      }
      return true;
    });
  }, [assets, f]);

  const toggleGrade = (g: string) =>
    update('gradeFilter', f.gradeFilter.includes(g) ? f.gradeFilter.filter((x) => x !== g) : [...f.gradeFilter, g]);

  const activeCount =
    (f.search ? 1 : 0) +
    f.gradeFilter.length +
    (f.typeFilter !== 'all' ? 1 : 0) +
    (f.ownership !== 'all' ? 1 : 0) +
    (f.zoning !== 'all' ? 1 : 0) +
    (f.idleMin || f.idleMax ? 1 : 0) +
    (f.landMin || f.landMax ? 1 : 0) +
    (f.populationTrend !== 'all' ? 1 : 0) +
    (f.commercialDensity !== 'all' ? 1 : 0) +
    (f.historicalValue !== 'all' ? 1 : 0) +
    (f.naturalScenery !== 'all' ? 1 : 0) +
    (f.buildingCondition !== 'all' ? 1 : 0) +
    (f.useChangeExpansion !== 'all' ? 1 : 0) +
    Object.values(f.bools).filter(Boolean).length;

  const FilterPanel = (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={['basic', 'spec', 'location', 'regulation']} className="w-full">
        <AccordionItem value="basic">
          <AccordionTrigger className="text-sm">기본 정보</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">자산 등급</Label>
              <div className="flex flex-wrap gap-1.5">
                {grades.map((g) => (
                  <button
                    key={g}
                    onClick={() => toggleGrade(g)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      f.gradeFilter.includes(g) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">자산 유형</Label>
              <Select value={f.typeFilter} onValueChange={(v) => update('typeFilter', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {assetTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">소유 구분</Label>
              <Select value={f.ownership} onValueChange={(v) => update('ownership', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {ownershipTypes.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="spec">
          <AccordionTrigger className="text-sm">제원 / 규모</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">용도지역</Label>
              <Select value={f.zoning} onValueChange={(v) => update('zoning', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {zoningOptions.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">방치 기간 (년)</Label>
              <div className="flex items-center gap-1">
                <Input className="h-9" type="number" placeholder="Min" value={f.idleMin} onChange={(e) => update('idleMin', e.target.value)} />
                <span className="text-xs text-muted-foreground">~</span>
                <Input className="h-9" type="number" placeholder="Max" value={f.idleMax} onChange={(e) => update('idleMax', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">대지면적 (㎡)</Label>
              <div className="flex items-center gap-1">
                <Input className="h-9" type="number" placeholder="Min" value={f.landMin} onChange={(e) => update('landMin', e.target.value)} />
                <span className="text-xs text-muted-foreground">~</span>
                <Input className="h-9" type="number" placeholder="Max" value={f.landMax} onChange={(e) => update('landMax', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">건물 상태</Label>
              <Select value={f.buildingCondition} onValueChange={(v) => update('buildingCondition', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {conditionOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="location">
          <AccordionTrigger className="text-sm">입지 / 가치</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">인구 추이</Label>
              <Select value={f.populationTrend} onValueChange={(v) => update('populationTrend', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {populationTrends.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">상권 밀도</Label>
              <Select value={f.commercialDensity} onValueChange={(v) => update('commercialDensity', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {densityOptions.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">역사적 가치</Label>
              <Select value={f.historicalValue} onValueChange={(v) => update('historicalValue', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {historicalOptions.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">자연 경관</Label>
              <Select value={f.naturalScenery} onValueChange={(v) => update('naturalScenery', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {sceneryOptions.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="regulation">
          <AccordionTrigger className="text-sm">규제 / 제도</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">용도변경 가능성</Label>
              <Select value={f.useChangeExpansion} onValueChange={(v) => update('useChangeExpansion', v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {expansionOptions.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 pt-1">
              {BOOL_FLAGS.map((b) => (
                <div key={b.key as string} className="flex items-center justify-between">
                  <Label htmlFor={`bf-${b.key as string}`} className="text-xs font-normal">{b.label}</Label>
                  <Switch
                    id={`bf-${b.key as string}`}
                    checked={!!f.bools[b.key as string]}
                    onCheckedChange={(v) => update('bools', { ...f.bools, [b.key as string]: v })}
                  />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {activeCount > 0 && (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setF(initialFilters)}>
          <X className="mr-1 h-3 w-3" /> 필터 전체 초기화 ({activeCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col pt-16">

      <Seo
        title="매물 탐색 — Heritage Layer"
        description="전국 유휴 부동산 매물을 지도와 필터로 탐색하세요. 폐교, 종교시설, 유휴 자산 등 다양한 유형의 재생 가능한 부동산을 확인할 수 있습니다."
        path="/properties"
      />
      {/* Floating search / mobile filter */}
      <div className="pointer-events-none absolute inset-x-0 top-20 z-40 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="relative w-44 sm:w-52 md:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="주소로 검색하세요..."
              className="pl-9 bg-background/90 border-0 shadow-sm"
              value={f.search}
              onChange={(e) => update('search', e.target.value)}
            />
          </div>

          {/* Mobile filter trigger (md 미만에서만 노출) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden bg-background/90 border-0 shadow-sm">
                <SlidersHorizontal className="mr-1 h-4 w-4" />
                필터 {activeCount > 0 && <Badge variant="secondary" className="ml-1">{activeCount}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[65vh] overflow-y-auto rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>필터</SheetTitle>
              </SheetHeader>
              <div className="mt-4 pb-6">{FilterPanel}</div>
            </SheetContent>
          </Sheet>

        </div>
      </div>

      {/* Main content */}
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Desktop filter sidebar — 부드러운 슬라이드 */}
        <aside
          className={`relative hidden shrink-0 overflow-hidden border-r bg-muted/20 transition-[width] duration-300 ease-in-out md:block ${
            filterOpen ? 'w-[280px]' : 'w-0 border-r-0'
          }`}
        >
          <div className="h-full w-[280px] overflow-y-auto p-4">
            {FilterPanel}
          </div>
        </aside>
        {/* Desktop filter toggle arrow — chevron only, no background band */}
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          aria-label={filterOpen ? '필터 숨기기' : '필터 펼치기'}
          className="hidden h-8 w-5 shrink-0 items-center justify-center self-center text-muted-foreground/70 transition-colors hover:text-foreground md:flex"
        >
          {filterOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>

        {/* Map area — 데스크톱 */}
        <div className="hidden flex-1 md:flex">
          <NaverMap
            markers={filtered
              .filter(hasValidKoreaCoordinate)
              .map((a) => ({ lat: a.latitude!, lng: a.longitude!, title: a.address, id: a.id, address: a.address }))}
            focusedMarkerId={selectedAssetId}
            onMarkerClick={(idx, marker) => {
              if (marker?.id) {
                setSelectedAssetId(marker.id);
                const el = cardRefs.current[marker.id];
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
              }
              const validAssets = filtered.filter(hasValidKoreaCoordinate);
              const picked = validAssets[idx];
              if (!picked) return;
              setSelectedAssetId(picked.id);
              const el = cardRefs.current[picked.id];
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          />
        </div>

        {/* Desktop list toggle arrow — chevron only */}
        <button
          type="button"
          onClick={() => setListOpen((v) => !v)}
          aria-label={listOpen ? '리스트 숨기기' : '리스트 펼치기'}
          className="hidden h-8 w-5 shrink-0 items-center justify-center self-center text-muted-foreground/70 transition-colors hover:text-foreground md:flex"
        >
          {listOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>

        {/* 데스크톱 우측 리스트 — 부드러운 슬라이드 */}
        <div className={`hidden flex-col overflow-hidden transition-[width] duration-300 ease-in-out md:flex ${listOpen ? 'md:w-[400px] md:border-l' : 'md:w-0'}`}>
          <div className="flex items-center justify-end border-b bg-background px-4 py-2">
            <span className="text-xs text-muted-foreground">전체 매물 {filtered.length}건</span>
          </div>
          <div className="w-full flex-1 overflow-y-auto p-4">
            {filtered.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                <p className="text-sm">조건에 맞는 자산이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((asset) => {
                  const isSelected = selectedAssetId === asset.id;
                  return (
                    <div
                      key={asset.id}
                      ref={(el) => { cardRefs.current[asset.id] = el; }}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''
                      }`}
                    >
                      <AssetCard asset={asset} onAuthRequired={() => setAuthOpen(true)} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 모바일: 전체 화면 지도 + 드래그 가능한 바텀시트 */}
        <div className="relative flex flex-1 md:hidden">
          <div className="absolute inset-0">
            <NaverMap
              markers={filtered
                .filter(hasValidKoreaCoordinate)
                .map((a) => ({ lat: a.latitude!, lng: a.longitude!, title: a.address, id: a.id, address: a.address }))}
              focusedMarkerId={selectedAssetId}
              onMarkerClick={(idx, marker) => {
                if (mobileListMode === 'collapsed') setMobileListMode('half');
                if (marker?.id) {
                  setSelectedAssetId(marker.id);
                  setTimeout(() => {
                    const el = cardRefs.current[marker.id!];
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 320);
                  return;
                }
                const validAssets = filtered.filter(hasValidKoreaCoordinate);
                const picked = validAssets[idx];
                if (!picked) return;
                setSelectedAssetId(picked.id);
                setTimeout(() => {
                  const el = cardRefs.current[picked.id];
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 320);
              }}
            />
          </div>

          {/* 바텀시트 */}
          <div
            className={`absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-2xl border-t bg-background shadow-2xl transition-[height] duration-300 ease-out ${
              mobileListMode === 'full' ? 'h-[calc(100vh-4rem)]' : mobileListMode === 'half' ? 'h-[55vh]' : 'h-28'
            }`}
          >
            <button
              type="button"
              className="flex shrink-0 touch-none flex-col items-center justify-center py-4 select-none"
              onPointerDown={(e) => {
                dragStartY.current = e.clientY;
                dragStartMode.current = mobileListMode;
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (dragStartY.current == null) return;
                const dy = e.clientY - dragStartY.current;
                if (Math.abs(dy) < 24) return;
                const order: Array<'full' | 'half' | 'collapsed'> = ['full', 'half', 'collapsed'];
                const startIdx = order.indexOf(dragStartMode.current);
                const steps = Math.min(2, Math.max(-2, Math.round(dy / 60)));
                const nextIdx = Math.min(2, Math.max(0, startIdx + steps));
                setMobileListMode(order[nextIdx]);
              }}
              onPointerUp={(e) => {
                const moved = dragStartY.current != null && Math.abs(e.clientY - dragStartY.current) >= 24;
                dragStartY.current = null;
                try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
                if (moved) return;
                setMobileListMode((m) => (m === 'collapsed' ? 'half' : m === 'half' ? 'full' : 'collapsed'));
              }}
              aria-label="리스트 토글"
            >
              <span className="h-1.5 w-12 rounded-full bg-muted-foreground/50" />
              <span className="mt-2 text-[11px] text-muted-foreground">
                {mobileListMode === 'collapsed' ? `매물 ${filtered.length}건 · 탭하여 열기` : `전체 매물 ${filtered.length}건`}
              </span>
            </button>


            <div className={`flex-1 overflow-y-auto px-4 pb-4 ${mobileListMode === 'collapsed' ? 'hidden' : ''}`}>
              {filtered.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                  <p className="text-sm">조건에 맞는 자산이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((asset) => {
                    const isSelected = selectedAssetId === asset.id;
                    return (
                      <div
                        key={asset.id}
                        ref={(el) => { cardRefs.current[asset.id] = el; }}
                        onClick={() => setSelectedAssetId(asset.id)}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''
                        }`}
                      >
                        <AssetCard asset={asset} onAuthRequired={() => setAuthOpen(true)} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      <Footer />




      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default PropertiesPage;
