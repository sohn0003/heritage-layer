import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Lock, ArrowRight } from 'lucide-react';
import GradeBadge from './GradeBadge';
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
}

interface AssetCardProps {
  asset: Asset;
  onAuthRequired: () => void;
}

const AssetCard = ({ asset, onAuthRequired }: AssetCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('saved_assets').insert({ user_id: user.id, asset_id: asset.id });
    if (error) {
      if (error.code === '23505') {
        toast({ title: '이미 저장된 자산입니다' });
      } else {
        toast({ title: '저장 실패', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: '자산이 저장되었습니다' });
    }
    setSaving(false);
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            {asset.grade && <GradeBadge grade={asset.grade} />}
            <Badge variant="secondary" className="text-xs">{asset.asset_type}</Badge>
          </div>
          {asset.gov_cooperation && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-300">정부협력</Badge>
          )}
        </div>

        <p className="mb-1 text-sm font-medium leading-snug">{asset.address}</p>

        <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
          {asset.idle_years != null && <span>방치 {asset.idle_years}년</span>}
          {asset.land_area != null && <span>{asset.land_area.toLocaleString()}㎡</span>}
        </div>

        {/* Pro locked preview */}
        <div className="relative mb-3 rounded-md bg-muted p-3">
          <div className="pointer-events-none select-none blur-sm">
            <p className="text-xs text-muted-foreground">재생 시나리오: 복합문화공간</p>
            <p className="text-xs text-muted-foreground">사업성 분석: IRR 12.5%</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="mr-1 h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Pro 구독 시 열람 가능</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/analysis?id=${asset.id}`)}
          >
            전체 분석 보기 <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetCard;
