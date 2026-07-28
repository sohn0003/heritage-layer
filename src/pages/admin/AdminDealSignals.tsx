import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, MessageSquare, CheckCircle2 } from 'lucide-react';
import LoadingBars from '@/components/common/LoadingBars';

interface SignalRow {
  id: string;
  signal_type: string;
  created_at: string;
  user_id: string;
  asset_id: string;
  admin_status: string;
  admin_response: string | null;
  responded_at: string | null;
  asset_address?: string;
  asset_type?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_address?: string;
}

const statusLabel: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pending: { label: '미확인', variant: 'secondary' },
  confirmed: { label: '확인됨', variant: 'outline' },
  responded: { label: '답변 완료', variant: 'default' },
};

const AdminDealSignalsPage = () => {
  const { isAdmin, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<SignalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'responded'>('all');
  const [dialogRow, setDialogRow] = useState<SignalRow | null>(null);
  const [responseText, setResponseText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/');
  }, [isAdmin, authLoading, navigate]);

  const fetchRows = async () => {
    const { data: signals } = await supabase
      .from('deal_signals')
      .select('*')
      .eq('signal_type', 'deal_interest')
      .order('created_at', { ascending: false });
    if (!signals) { setLoading(false); return; }

    const userIds = [...new Set(signals.map((s) => s.user_id))];
    const assetIds = [...new Set(signals.map((s) => s.asset_id))];

    const [{ data: profiles }, { data: assets }] = await Promise.all([
      supabase.from('profiles').select('id,name,email,phone,address').in('id', userIds),
      supabase.from('assets').select('id,address,asset_type').in('id', assetIds),
    ]);

    const pMap = new Map((profiles || []).map((p) => [p.id, p]));
    const aMap = new Map((assets || []).map((a) => [a.id, a]));

    setRows(
      signals.map((s: any) => {
        const p = pMap.get(s.user_id);
        const a = aMap.get(s.asset_id);
        return {
          ...s,
          asset_address: a?.address,
          asset_type: a?.asset_type,
          user_name: p?.name,
          user_email: p?.email,
          user_phone: p?.phone,
          user_address: p?.address,
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const openDialog = (r: SignalRow) => {
    setDialogRow(r);
    setResponseText(r.admin_response ?? '');
  };

  const markConfirmed = async (r: SignalRow) => {
    const { error } = await supabase
      .from('deal_signals')
      .update({ admin_status: 'confirmed' })
      .eq('id', r.id);
    if (error) {
      toast({ title: '상태 변경 실패', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '확인 처리되었습니다' });
    fetchRows();
  };

  const submitResponse = async () => {
    if (!dialogRow) return;
    if (!responseText.trim()) {
      toast({ title: '답변 내용을 입력해주세요', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('deal_signals')
      .update({
        admin_status: 'responded',
        admin_response: responseText.trim(),
        responded_at: new Date().toISOString(),
        responded_by: user?.id ?? null,
      })
      .eq('id', dialogRow.id);
    setSaving(false);
    if (error) {
      toast({ title: '답변 저장 실패', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '답변이 저장되었습니다' });
    setDialogRow(null);
    setResponseText('');
    fetchRows();
  };

  if (authLoading || loading) {
    return <LoadingBars />;
  }
  if (!isAdmin) return null;

  const counts = {
    all: rows.length,
    pending: rows.filter((r) => r.admin_status === 'pending').length,
    confirmed: rows.filter((r) => r.admin_status === 'confirmed').length,
    responded: rows.filter((r) => r.admin_status === 'responded').length,
  };
  const visibleRows = statusFilter === 'all' ? rows : rows.filter((r) => r.admin_status === statusFilter);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-32">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">자산 관심 상담 신청 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          회원이 신청한 관심 상담 내역을 확인하고 답변을 작성할 수 있습니다.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {(['all', 'pending', 'confirmed', 'responded'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setStatusFilter(k)}
            className={`rounded-full border px-3 py-1 transition-colors ${
              statusFilter === k ? 'border-accent bg-accent text-accent-foreground' : 'hover:bg-muted'
            }`}
          >
            {k === 'all' ? '전체' : statusLabel[k].label} {counts[k]}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>일시</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>자산</TableHead>
                <TableHead>회원</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>주소</TableHead>
                <TableHead className="text-right">처리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    해당 상태의 관심 상담 신청이 없습니다
                  </TableCell>
                </TableRow>
              )}
              {visibleRows.map((r) => {
                const st = statusLabel[r.admin_status] ?? statusLabel.pending;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{r.asset_address ?? '-'}</div>
                      {r.asset_type && (
                        <Badge variant="secondary" className="mt-1 text-[10px]">{r.asset_type}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{r.user_name || '-'}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />{r.user_email ?? '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {r.user_phone ? (
                        <a href={`tel:${r.user_phone}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
                          <Phone className="h-3 w-3" />{r.user_phone}
                        </a>
                      ) : <span className="text-xs text-muted-foreground">미입력</span>}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {r.user_address ? (
                        <div className="flex items-start gap-1 text-xs">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                          <span>{r.user_address}</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">미입력</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {r.admin_status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => markConfirmed(r)}>
                            <CheckCircle2 className="mr-1 h-3 w-3" />확인
                          </Button>
                        )}
                        <Button size="sm" onClick={() => openDialog(r)}>
                          <MessageSquare className="mr-1 h-3 w-3" />
                          {r.admin_response ? '답변 보기' : '답변'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!dialogRow} onOpenChange={(o) => !o && setDialogRow(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>관심 상담 답변</DialogTitle>
          </DialogHeader>
          {dialogRow && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <div className="mb-1"><span className="text-muted-foreground">신청자:</span> {dialogRow.user_name || '-'} · {dialogRow.user_email}</div>
                <div className="mb-1"><span className="text-muted-foreground">연락처:</span> {dialogRow.user_phone || '미입력'}</div>
                <div><span className="text-muted-foreground">자산:</span> {dialogRow.asset_address || '-'}</div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">답변 내용</label>
                <Textarea
                  rows={6}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="회원에게 전달할 답변 내용을 작성해주세요. (내부 기록용)"
                  maxLength={2000}
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">{responseText.length}/2000</p>
              </div>
              {dialogRow.responded_at && (
                <p className="text-xs text-muted-foreground">
                  마지막 답변: {new Date(dialogRow.responded_at).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogRow(null)}>취소</Button>
            <Button onClick={submitResponse} disabled={saving}>
              {saving ? '저장 중...' : '답변 저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDealSignalsPage;
