import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Download, Upload } from 'lucide-react';
import { exportAssetsToExcel, importAssetsFromExcel } from '@/lib/assetExcel';
import { calculateScoringFields } from '@/lib/assetScoring';
import { useRef } from 'react';
import GradeBadge from '@/components/common/GradeBadge';

const assetTypes = ['폐교', '빈집', '유휴공공시설', '폐산업시설', '기타'];
const populationTrends = [
  { v: 'increasing', l: '증가' },
  { v: 'stable', l: '유지' },
  { v: 'decreasing', l: '감소' },
  { v: 'extinction_risk', l: '소멸위험' },
];
const densityOptions = [{ v: 'high', l: '높음' }, { v: 'low', l: '낮음' }];
const valueGrades = ['상', '중', '하'];
const conditionOptions = ['양호', '보통', '노후', '심각'];
const expansionOptions = ['높음', '중간', '낮음', '없음'];

interface AssetForm {
  // 기본
  address: string;
  asset_type: string;
  zoning: string;
  building_coverage: string;
  floor_area_ratio: string;
  land_area: string;
  idle_years: string;
  ownership_type: string;
  
  gov_cooperation: boolean;
  latitude: string;
  longitude: string;
  admin_memo: string;
  is_published: boolean;
  // 건폐율/용적률 상세
  current_building_coverage: string;
  legal_max_building_coverage: string;
  current_floor_area_ratio: string;
  legal_max_floor_area_ratio: string;
  current_floor_area: string;
  land_value_per_sqm: string;
  asset_use_type: string;
  // 입지/가치
  population_trend: string;
  commercial_density: string;
  distance_to_center: string;
  historical_value: string;
  natural_scenery: string;
  building_condition: string;
  // 규제/제도
  is_private_negotiation: boolean;
  is_citizen_proposal: boolean;
  is_waterfront_environmental: boolean;
  is_military_heritage_zone: boolean;
  is_urban_facility_conflict: boolean;
  zoning_upgrade_gain: string;
  use_change_expansion: string;
  has_conversion_precedent: boolean;
  is_urban_regeneration_area: boolean;
  is_abandoned_school_budget: boolean;
  is_balanced_dev_budget: boolean;
}

const emptyForm: AssetForm = {
  address: '', asset_type: '폐교', zoning: '', building_coverage: '', floor_area_ratio: '',
  land_area: '', idle_years: '', ownership_type: '', gov_cooperation: false,
  latitude: '', longitude: '', admin_memo: '', is_published: false,
  current_building_coverage: '', legal_max_building_coverage: '',
  current_floor_area_ratio: '', legal_max_floor_area_ratio: '',
  current_floor_area: '', land_value_per_sqm: '', asset_use_type: '',
  population_trend: '', commercial_density: '', distance_to_center: '',
  historical_value: '', natural_scenery: '', building_condition: '',
  is_private_negotiation: false, is_citizen_proposal: false,
  is_waterfront_environmental: false, is_military_heritage_zone: false,
  is_urban_facility_conflict: false, zoning_upgrade_gain: '', use_change_expansion: '',
  has_conversion_precedent: false, is_urban_regeneration_area: false,
  is_abandoned_school_budget: false, is_balanced_dev_budget: false,
};

const num = (v: string) => (v === '' ? null : Number(v));
const str = (v: string) => (v === '' ? null : v);

const AdminPropertiesPage = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<AssetForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/');
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => { fetchAssets(); }, []);

  const fetchAssets = async () => {
    const { data } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
    if (data) setAssets(data);
  };

  const openCreate = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };

  const openEdit = (a: any) => {
    setForm({
      address: a.address,
      asset_type: a.asset_type,
      zoning: a.zoning || '',
      building_coverage: a.building_coverage?.toString() || '',
      floor_area_ratio: a.floor_area_ratio?.toString() || '',
      land_area: a.land_area?.toString() || '',
      idle_years: a.idle_years?.toString() || '',
      ownership_type: a.ownership_type || '',
      grade: a.grade || 'C',
      gov_cooperation: a.gov_cooperation || false,
      latitude: a.latitude?.toString() || '',
      longitude: a.longitude?.toString() || '',
      admin_memo: a.admin_memo || '',
      is_published: a.is_published || false,
      current_building_coverage: a.current_building_coverage?.toString() || '',
      legal_max_building_coverage: a.legal_max_building_coverage?.toString() || '',
      current_floor_area_ratio: a.current_floor_area_ratio?.toString() || '',
      legal_max_floor_area_ratio: a.legal_max_floor_area_ratio?.toString() || '',
      current_floor_area: a.current_floor_area?.toString() || '',
      land_value_per_sqm: a.land_value_per_sqm?.toString() || '',
      asset_use_type: a.asset_use_type || '',
      population_trend: a.population_trend || '',
      commercial_density: a.commercial_density || '',
      distance_to_center: a.distance_to_center?.toString() || '',
      historical_value: a.historical_value || '',
      natural_scenery: a.natural_scenery || '',
      building_condition: a.building_condition || '',
      is_private_negotiation: a.is_private_negotiation || false,
      is_citizen_proposal: a.is_citizen_proposal || false,
      is_waterfront_environmental: a.is_waterfront_environmental || false,
      is_military_heritage_zone: a.is_military_heritage_zone || false,
      is_urban_facility_conflict: a.is_urban_facility_conflict || false,
      zoning_upgrade_gain: a.zoning_upgrade_gain || '',
      use_change_expansion: a.use_change_expansion || '',
      has_conversion_precedent: a.has_conversion_precedent || false,
      is_urban_regeneration_area: a.is_urban_regeneration_area || false,
      is_abandoned_school_budget: a.is_abandoned_school_budget || false,
      is_balanced_dev_budget: a.is_balanced_dev_budget || false,
    });
    setEditId(a.id);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      address: form.address,
      asset_type: form.asset_type,
      zoning: str(form.zoning),
      building_coverage: num(form.building_coverage),
      floor_area_ratio: num(form.floor_area_ratio),
      land_area: num(form.land_area),
      idle_years: num(form.idle_years),
      ownership_type: str(form.ownership_type),
      grade: form.grade,
      gov_cooperation: form.gov_cooperation,
      latitude: num(form.latitude),
      longitude: num(form.longitude),
      admin_memo: str(form.admin_memo),
      is_published: form.is_published,
      current_building_coverage: num(form.current_building_coverage),
      legal_max_building_coverage: num(form.legal_max_building_coverage),
      current_floor_area_ratio: num(form.current_floor_area_ratio),
      legal_max_floor_area_ratio: num(form.legal_max_floor_area_ratio),
      current_floor_area: num(form.current_floor_area),
      land_value_per_sqm: num(form.land_value_per_sqm),
      asset_use_type: str(form.asset_use_type),
      population_trend: str(form.population_trend),
      commercial_density: str(form.commercial_density),
      distance_to_center: num(form.distance_to_center),
      historical_value: str(form.historical_value),
      natural_scenery: str(form.natural_scenery),
      building_condition: str(form.building_condition),
      is_private_negotiation: form.is_private_negotiation,
      is_citizen_proposal: form.is_citizen_proposal,
      is_waterfront_environmental: form.is_waterfront_environmental,
      is_military_heritage_zone: form.is_military_heritage_zone,
      is_urban_facility_conflict: form.is_urban_facility_conflict,
      zoning_upgrade_gain: str(form.zoning_upgrade_gain),
      use_change_expansion: str(form.use_change_expansion),
      has_conversion_precedent: form.has_conversion_precedent,
      is_urban_regeneration_area: form.is_urban_regeneration_area,
      is_abandoned_school_budget: form.is_abandoned_school_budget,
      is_balanced_dev_budget: form.is_balanced_dev_budget,
    };

    if (editId) {
      const { error } = await supabase.from('assets').update(payload).eq('id', editId);
      if (error) toast({ title: '수정 실패', description: error.message, variant: 'destructive' });
      else toast({ title: '매물이 수정되었습니다' });
    } else {
      const { error } = await supabase.from('assets').insert(payload);
      if (error) toast({ title: '등록 실패', description: error.message, variant: 'destructive' });
      else toast({ title: '매물이 등록되었습니다' });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchAssets();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) toast({ title: '삭제 실패', description: error.message, variant: 'destructive' });
    else { toast({ title: '매물이 삭제되었습니다' }); fetchAssets(); }
  };

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">로딩 중...</div>;
  if (!isAdmin) return null;

  const setF = (patch: Partial<AssetForm>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">매물 관리</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={async () => {
            try { await exportAssetsToExcel(); toast({ title: '엑셀 다운로드 완료' }); }
            catch (e: any) { toast({ title: '다운로드 실패', description: e.message, variant: 'destructive' }); }
          }}>
            <Download className="mr-2 h-4 w-4" /> 엑셀 다운로드
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            <Upload className="mr-2 h-4 w-4" /> {importing ? '업로드 중...' : '엑셀 업로드'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setImporting(true);
              try {
                const r = await importAssetsFromExcel(f);
                toast({
                  title: '엑셀 업로드 완료',
                  description: `신규 ${r.inserted}건 / 수정 ${r.updated}건 / 실패 ${r.failed}건${r.errors.length ? '\n' + r.errors.slice(0, 3).join('\n') : ''}`,
                });
                fetchAssets();
              } catch (err: any) {
                toast({ title: '업로드 실패', description: err.message, variant: 'destructive' });
              } finally {
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }
            }}
          />
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> 신규 등록
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>등급</TableHead>
                <TableHead>주소</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>방치</TableHead>
                <TableHead>점수</TableHead>
                <TableHead>공개</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.grade && <GradeBadge grade={a.grade} />}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">{a.address}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{a.asset_type}</Badge></TableCell>
                  <TableCell className="text-sm">{a.idle_years ?? '-'}년</TableCell>
                  <TableCell className="text-sm">{a.scoring_total ?? '-'}</TableCell>
                  <TableCell>{a.is_published ? <Badge className="text-xs">공개</Badge> : <Badge variant="outline" className="text-xs">비공개</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {assets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">등록된 매물이 없습니다</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editId ? '매물 수정' : '신규 매물 등록'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            {/* 기본 정보 */}
            <div className="space-y-2">
              <Label>주소 *</Label>
              <Input value={form.address} onChange={(e) => setF({ address: e.target.value })} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>자산 유형 *</Label>
                <Select value={form.asset_type} onValueChange={(v) => setF({ asset_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{assetTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>등급</Label>
                <Select value={form.grade} onValueChange={(v) => setF({ grade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <Accordion type="multiple" defaultValue={['basic']} className="w-full">
              <AccordionItem value="basic">
                <AccordionTrigger>기본 제원</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>용도지역</Label>
                      <Input value={form.zoning} onChange={(e) => setF({ zoning: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>건폐율 (%)</Label>
                      <Input type="number" value={form.building_coverage} onChange={(e) => setF({ building_coverage: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>용적률 (%)</Label>
                      <Input type="number" value={form.floor_area_ratio} onChange={(e) => setF({ floor_area_ratio: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>대지면적 (㎡)</Label>
                      <Input type="number" value={form.land_area} onChange={(e) => setF({ land_area: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>방치 기간 (년)</Label>
                      <Input type="number" value={form.idle_years} onChange={(e) => setF({ idle_years: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>소유 구분</Label>
                      <Select value={form.ownership_type} onValueChange={(v) => setF({ ownership_type: v })}>
                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="국유">국유</SelectItem>
                          <SelectItem value="공유">공유</SelectItem>
                          <SelectItem value="사유">사유</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>위도</Label>
                      <Input type="number" step="any" value={form.latitude} onChange={(e) => setF({ latitude: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>경도</Label>
                      <Input type="number" step="any" value={form.longitude} onChange={(e) => setF({ longitude: e.target.value })} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ratios">
                <AccordionTrigger>건폐율·용적률 상세 / 가치</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>현재 건폐율 (%)</Label>
                      <Input type="number" value={form.current_building_coverage} onChange={(e) => setF({ current_building_coverage: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>법정 최대 건폐율 (%)</Label>
                      <Input type="number" value={form.legal_max_building_coverage} onChange={(e) => setF({ legal_max_building_coverage: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>현재 용적률 (%)</Label>
                      <Input type="number" value={form.current_floor_area_ratio} onChange={(e) => setF({ current_floor_area_ratio: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>법정 최대 용적률 (%)</Label>
                      <Input type="number" value={form.legal_max_floor_area_ratio} onChange={(e) => setF({ legal_max_floor_area_ratio: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>현재 연면적 (㎡)</Label>
                      <Input type="number" value={form.current_floor_area} onChange={(e) => setF({ current_floor_area: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>공시지가 (원/㎡)</Label>
                      <Input type="number" value={form.land_value_per_sqm} onChange={(e) => setF({ land_value_per_sqm: e.target.value })} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>전환 용도</Label>
                      <Input value={form.asset_use_type} onChange={(e) => setF({ asset_use_type: e.target.value })} placeholder="예: 복합문화공간, 청년주택" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="location">
                <AccordionTrigger>입지·환경</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>인구 추세</Label>
                      <Select value={form.population_trend} onValueChange={(v) => setF({ population_trend: v })}>
                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent>{populationTrends.map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>상권 밀도</Label>
                      <Select value={form.commercial_density} onValueChange={(v) => setF({ commercial_density: v })}>
                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent>{densityOptions.map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>도심까지 거리 (km)</Label>
                      <Input type="number" step="any" value={form.distance_to_center} onChange={(e) => setF({ distance_to_center: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>건물 상태</Label>
                      <Select value={form.building_condition} onValueChange={(v) => setF({ building_condition: v })}>
                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent>{conditionOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>역사·건축적 가치</Label>
                      <Select value={form.historical_value} onValueChange={(v) => setF({ historical_value: v })}>
                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent>{valueGrades.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>자연경관</Label>
                      <Select value={form.natural_scenery} onValueChange={(v) => setF({ natural_scenery: v })}>
                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent>{valueGrades.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="regulation">
                <AccordionTrigger>규제·인허가</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ['is_private_negotiation', '수의계약 가능'],
                      ['is_citizen_proposal', '민간제안 가능'],
                      ['is_waterfront_environmental', '수변구역 해당'],
                      ['is_military_heritage_zone', '군사·문화재구역'],
                      ['is_urban_facility_conflict', '도시계획시설 저촉'],
                      ['has_conversion_precedent', '인근 용도변경 전례'],
                    ].map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between rounded-md border p-2">
                        <Label htmlFor={key}>{label}</Label>
                        <Switch
                          id={key}
                          checked={(form as any)[key]}
                          onCheckedChange={(v) => setF({ [key]: v } as any)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>종상향 여력</Label>
                      <Select value={form.zoning_upgrade_gain} onValueChange={(v) => setF({ zoning_upgrade_gain: v })}>
                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent>{expansionOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>용도변경 확대 가능성</Label>
                      <Select value={form.use_change_expansion} onValueChange={(v) => setF({ use_change_expansion: v })}>
                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent>{expansionOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="budget">
                <AccordionTrigger>예산·지원</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ['is_urban_regeneration_area', '도시재생기금 해당'],
                      ['is_abandoned_school_budget', '폐교 교육부 예산'],
                      ['is_balanced_dev_budget', '균형발전특별회계'],
                      ['gov_cooperation', '정부협력 가능'],
                    ].map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between rounded-md border p-2">
                        <Label htmlFor={key}>{label}</Label>
                        <Switch
                          id={key}
                          checked={(form as any)[key]}
                          onCheckedChange={(v) => setF({ [key]: v } as any)}
                        />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="meta">
                <AccordionTrigger>메모 · 공개</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>관리자 메모</Label>
                    <Textarea value={form.admin_memo} onChange={(e) => setF({ admin_memo: e.target.value })} rows={3} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="pub" checked={form.is_published} onCheckedChange={(v) => setF({ is_published: v })} />
                    <Label htmlFor="pub">공개</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    점수(scoring_*) 및 IRR 결과(irr_result)는 알고리즘 계산 후 자동 저장됩니다.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? '저장 중...' : editId ? '수정하기' : '등록하기'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPropertiesPage;
