import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bookmark, School, Home, Building2, Factory, Building } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Asset {
  id: string;
  address: string;
  asset_type: string;
  idle_years: number | null;
  grade: string | null;
  gov_cooperation: boolean | null;
  land_area: number | null;
  land_value_per_sqm?: number | null;
  recommended_use_type?: string | null;
  recommended_dev_direction?: string | null;
}

interface AssetCardProps {
  asset: Asset;
  onAuthRequired: () => void;
}

const ASSET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  '폐교': School,
  '빈집': Home,
  '유휴공공시설': Building2,
  '폐산업시설': Factory,
  '기타': Building,
};

const AssetCard = ({ asset, onAuthRequired }: AssetCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsSaved(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('saved_assets')
        .select('id')
        .eq('user_id', user.id)
        .eq('asset_id', asset.id)
        .maybeSingle();
      if (!cancelled) setIsSaved(!!data);
    })();
    return () => { cancelled = true; };
  }, [user, asset.id]);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onAuthRequired();
      return;
    }
    setSaving(true);
    if (isSaved) {
      const { error } = await supabase
        .from('saved_assets')
        .delete()
        .eq('user_id', user.id)
        .eq('asset_id', asset.id);
      if (error) toast({ title: '해제 실패', description: error.message, variant: 'destructive' });
      else { setIsSaved(false); toast({ title: '저장이 해제되었습니다' }); }
    } else {
      const { error } = await supabase.from('saved_assets').insert({ user_id: user.id, asset_id: asset.id });
      if (error && error.code !== '23505') {
        toast({ title: '저장 실패', description: error.message, variant: 'destructive' });
      } else {
        setIsSaved(true);
        toast({ title: '자산이 저장되었습니다' });
      }
    }
    setSaving(false);
  };

  const Icon = ASSET_ICONS[asset.asset_type] ?? Building;

  const gradeStyles: Record<string, string> = {
    S: 'border-[hsl(var(--grade-s))] text-[hsl(var(--grade-s))] bg-[hsl(var(--grade-s)_/_0.12)]',
    A: 'border-[hsl(var(--grade-a))] text-[hsl(var(--grade-a))] bg-[hsl(var(--grade-a)_/_0.12)]',
    B: 'border-[hsl(var(--grade-b))] text-[hsl(var(--grade-b))] bg-[hsl(var(--grade-b)_/_0.12)]',
    C: 'border-[hsl(var(--grade-c))] text-[hsl(var(--grade-c))] bg-[hsl(var(--grade-c)_/_0.12)]',
    D: 'border-[hsl(var(--grade-d))] text-[hsl(var(--grade-d))] bg-[hsl(var(--grade-d)_/_0.12)]',
  };

  return (
    <Card
      onClick={() => navigate(`/analysis?id=${asset.id}`)}
      className="group cursor-pointer overflow-hidden rounded-none border-border bg-muted/30 transition-colors hover:bg-white hover:shadow-md"
    >
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center bg-muted text-foreground transition-colors group-hover:bg-slate-200 group-hover:text-slate-900">
              <Icon className="h-4 w-4" />
            </span>
            <Badge variant="secondary" className="text-xs font-medium transition-colors group-hover:bg-slate-200 group-hover:text-slate-900">{asset.asset_type}</Badge>
            {asset.gov_cooperation && (
              <Badge
                variant="outline"
                className="border-foreground/20 bg-background text-xs font-medium text-foreground transition-colors group-hover:border-slate-300 group-hover:bg-slate-100 group-hover:text-slate-900"
              >
                정부협력
              </Badge>
            )}
          </div>
          {asset.grade && (
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-base font-semibold ${gradeStyles[asset.grade] || ''}`}
              aria-label={`등급 ${asset.grade}`}
            >
              {asset.grade}
            </span>
          )}
        </div>

        <p className="mb-1.5 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-slate-900">{asset.address}</p>

        <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground transition-colors group-hover:text-slate-600">
          {asset.idle_years != null && <span>방치 {asset.idle_years}년</span>}
          {asset.land_area != null && <span>{asset.land_area.toLocaleString()}㎡</span>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3 transition-colors group-hover:border-slate-200">
          <div className="min-w-0 flex-1">
            {asset.land_value_per_sqm != null ? (
              <>
                <p className="text-[11px] text-muted-foreground transition-colors group-hover:text-slate-500">공시지가</p>
                <p className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-slate-900">
                  {Math.round(asset.land_value_per_sqm).toLocaleString()}
                  <span className="ml-0.5 text-xs font-normal text-muted-foreground transition-colors group-hover:text-slate-500">원/㎡</span>
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground transition-colors group-hover:text-slate-600">공시지가 정보 없음</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            aria-pressed={isSaved}
            aria-label={isSaved ? '저장 해제' : '자산 저장'}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-slate-400 hover:text-slate-900 disabled:opacity-50 group-hover:border-slate-300 group-hover:text-slate-700"
          >
            <Bookmark className={`h-4 w-4 transition-colors ${isSaved ? 'fill-current text-foreground group-hover:text-slate-900' : ''}`} />
          </button>
        </div>

      </CardContent>
    </Card>
  );
};

export default AssetCard;
