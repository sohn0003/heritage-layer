import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, ArrowRight, School, Home, Building2, Factory, Building } from 'lucide-react';
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

  // 저장 여부 초기 조회
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

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-foreground">
              <Icon className="h-4 w-4" />
            </span>
            <Badge variant="secondary" className="text-xs">{asset.asset_type}</Badge>
          </div>
          {asset.gov_cooperation && (
            <Badge variant="outline" className="border-emerald-300 text-xs text-emerald-600">정부협력</Badge>
          )}
        </div>

        <p className="mb-1.5 text-sm font-medium leading-snug">{asset.address}</p>

        <div className="mb-3 flex gap-3 text-xs text-muted-foreground">
          {asset.idle_years != null && <span>방치 {asset.idle_years}년</span>}
          {asset.land_area != null && <span>{asset.land_area.toLocaleString()}㎡</span>}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={(e) => { e.stopPropagation(); navigate(`/analysis?id=${asset.id}`); }}
          >
            상세 분석 보기 <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={saving}
            aria-pressed={isSaved}
            aria-label={isSaved ? '저장 해제' : '자산 저장'}
            className={isSaved ? 'bg-background text-foreground hover:bg-background/90' : ''}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetCard;
