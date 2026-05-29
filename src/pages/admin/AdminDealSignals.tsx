import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Phone, MapPin } from 'lucide-react';

interface SignalRow {
  id: string;
  signal_type: string;
  created_at: string;
  user_id: string;
  asset_id: string;
  asset_address?: string;
  asset_type?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_address?: string;
}

const signalLabel: Record<string, string> = {
  interest: '관심 표명',
  inquiry: '문의',
  view: '조회',
  bookmark: '저장',
};

const AdminDealSignalsPage = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<SignalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/');
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data: signals } = await supabase
        .from('deal_signals')
        .select('*')
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
        signals.map((s) => {
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
    })();
  }, [isAdmin]);

  if (authLoading || loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">로딩 중...</div>;
  }
  if (!isAdmin) return null;

  const interestRows = rows.filter((r) => r.signal_type === 'interest');

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">딜 관심 표명 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          회원이 관심을 표명한 자산과 회원 연락처를 확인할 수 있습니다.
        </p>
      </div>

      <div className="mb-4 flex gap-2 text-sm">
        <Badge variant="secondary">전체 {rows.length}건</Badge>
        <Badge>관심 표명 {interestRows.length}건</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>일시</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>자산</TableHead>
                <TableHead>회원</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>주소</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    아직 딜 관심 표명이 없습니다
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString('ko-KR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.signal_type === 'interest' ? 'default' : 'outline'} className="text-xs">
                      {signalLabel[r.signal_type] ?? r.signal_type}
                    </Badge>
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
                  <TableCell className="max-w-[220px]">
                    {r.user_address ? (
                      <div className="flex items-start gap-1 text-xs">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                        <span>{r.user_address}</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">미입력</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDealSignalsPage;
