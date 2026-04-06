import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import GradeBadge from '@/components/common/GradeBadge';

const assetTypes = ['폐교', '빈집', '유휴공공시설', '폐산업시설', '기타'];
const grades = ['S', 'A', 'B', 'C', 'D'];

interface AssetForm {
  address: string;
  asset_type: string;
  zoning: string;
  building_coverage: string;
  floor_area_ratio: string;
  land_area: string;
  idle_years: string;
  ownership_type: string;
  grade: string;
  gov_cooperation: boolean;
  latitude: string;
  longitude: string;
  admin_memo: string;
  is_published: boolean;
}

const emptyForm: AssetForm = {
  address: '', asset_type: '폐교', zoning: '', building_coverage: '', floor_area_ratio: '',
  land_area: '', idle_years: '', ownership_type: '', grade: 'C', gov_cooperation: false,
  latitude: '', longitude: '', admin_memo: '', is_published: false,
};

const AdminPropertiesPage = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<AssetForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    const { data } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
    if (data) setAssets(data);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (asset: any) => {
    setForm({
      address: asset.address,
      asset_type: asset.asset_type,
      zoning: asset.zoning || '',
      building_coverage: asset.building_coverage?.toString() || '',
      floor_area_ratio: asset.floor_area_ratio?.toString() || '',
      land_area: asset.land_area?.toString() || '',
      idle_years: asset.idle_years?.toString() || '',
      ownership_type: asset.ownership_type || '',
      grade: asset.grade || 'C',
      gov_cooperation: asset.gov_cooperation || false,
      latitude: asset.latitude?.toString() || '',
      longitude: asset.longitude?.toString() || '',
      admin_memo: asset.admin_memo || '',
      is_published: asset.is_published || false,
    });
    setEditId(asset.id);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      address: form.address,
      asset_type: form.asset_type,
      zoning: form.zoning || null,
      building_coverage: form.building_coverage ? Number(form.building_coverage) : null,
      floor_area_ratio: form.floor_area_ratio ? Number(form.floor_area_ratio) : null,
      land_area: form.land_area ? Number(form.land_area) : null,
      idle_years: form.idle_years ? Number(form.idle_years) : null,
      ownership_type: form.ownership_type || null,
      grade: form.grade,
      gov_cooperation: form.gov_cooperation,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      admin_memo: form.admin_memo || null,
      is_published: form.is_published,
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">매물 관리</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> 신규 등록
        </Button>
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
                  <TableCell>{a.is_published ? <Badge className="text-xs">공개</Badge> : <Badge variant="outline" className="text-xs">비공개</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {assets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">등록된 매물이 없습니다</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? '매물 수정' : '신규 매물 등록'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>주소 *</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>자산 유형 *</Label>
                <Select value={form.asset_type} onValueChange={(v) => setForm({ ...form, asset_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {assetTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>등급</Label>
                <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>용도지역</Label>
                <Input value={form.zoning} onChange={(e) => setForm({ ...form, zoning: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>건폐율 (%)</Label>
                <Input type="number" value={form.building_coverage} onChange={(e) => setForm({ ...form, building_coverage: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>용적률 (%)</Label>
                <Input type="number" value={form.floor_area_ratio} onChange={(e) => setForm({ ...form, floor_area_ratio: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>대지면적 (㎡)</Label>
                <Input type="number" value={form.land_area} onChange={(e) => setForm({ ...form, land_area: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>방치 기간 (년)</Label>
                <Input type="number" value={form.idle_years} onChange={(e) => setForm({ ...form, idle_years: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>소유 구분</Label>
                <Select value={form.ownership_type} onValueChange={(v) => setForm({ ...form, ownership_type: v })}>
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="국유">국유</SelectItem>
                    <SelectItem value="공유">공유</SelectItem>
                    <SelectItem value="사유">사유</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>위도</Label>
                <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>경도</Label>
                <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>관리자 메모</Label>
              <Textarea value={form.admin_memo} onChange={(e) => setForm({ ...form, admin_memo: e.target.value })} rows={3} />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch id="gov" checked={form.gov_cooperation} onCheckedChange={(v) => setForm({ ...form, gov_cooperation: v })} />
                <Label htmlFor="gov">정부협력 가능</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="pub" checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
                <Label htmlFor="pub">공개</Label>
              </div>
            </div>
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
