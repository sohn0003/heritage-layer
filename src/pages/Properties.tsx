import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AssetCard from '@/components/cards/AssetCard';
import AuthModal from '@/components/common/AuthModal';
import NaverMap from '@/components/map/NaverMap';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Asset {
  id: string;
  address: string;
  asset_type: string;
  idle_years: number | null;
  grade: string | null;
  gov_cooperation: boolean | null;
  land_area: number | null;
  latitude: number | null;
  longitude: number | null;
  zoning: string | null;
  building_coverage: number | null;
  floor_area_ratio: number | null;
  ownership_type: string | null;
}

const grades = ['S', 'A', 'B', 'C', 'D'];
const assetTypes = ['폐교', '빈집', '유휴공공시설', '폐산업시설', '기타'];

const PropertiesPage = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filtered, setFiltered] = useState<Asset[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Filters
  const [gradeFilter, setGradeFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [govOnly, setGovOnly] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAssets = async () => {
      const { data } = await supabase
        .from('assets')
        .select('id, address, asset_type, idle_years, grade, gov_cooperation, land_area, latitude, longitude, zoning, building_coverage, floor_area_ratio, ownership_type')
        .eq('is_published', true);
      if (data) {
        setAssets(data);
        setFiltered(data);
      }
    };
    fetchAssets();
  }, []);

  useEffect(() => {
    let result = assets;
    if (gradeFilter.length > 0) {
      result = result.filter(a => a.grade && gradeFilter.includes(a.grade));
    }
    if (typeFilter !== 'all') {
      result = result.filter(a => a.asset_type === typeFilter);
    }
    if (govOnly) {
      result = result.filter(a => a.gov_cooperation);
    }
    if (search) {
      result = result.filter(a => a.address.includes(search));
    }
    setFiltered(result);
  }, [assets, gradeFilter, typeFilter, govOnly, search]);

  const toggleGrade = (g: string) => {
    setGradeFilter(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b bg-background px-4 py-3">
        <Input
          placeholder="주소 검색..."
          className="w-48"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="자산 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            {assetTypes.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          {grades.map(g => (
            <button
              key={g}
              onClick={() => toggleGrade(g)}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${
                gradeFilter.includes(g) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Switch id="gov-filter" checked={govOnly} onCheckedChange={setGovOnly} />
          <Label htmlFor="gov-filter" className="text-xs">정부협력</Label>
        </div>
        <Badge variant="secondary" className="ml-auto">{filtered.length}건</Badge>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map area */}
        <div className="hidden flex-1 md:flex">
          <NaverMap
            markers={filtered
              .filter(a => a.latitude && a.longitude)
              .map(a => ({ lat: a.latitude!, lng: a.longitude!, title: a.address }))}
            onMarkerClick={(idx) => {
              const validAssets = filtered.filter(a => a.latitude && a.longitude);
              setSelectedAsset(validAssets[idx]);
            }}
          />
        </div>

        {/* Asset list */}
        <div className="w-full overflow-y-auto border-l p-4 md:w-[400px]">
          {filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <p className="text-sm">등록된 자산이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(asset => (
                <div key={asset.id} onClick={() => setSelectedAsset(asset)} className="cursor-pointer">
                  <AssetCard asset={asset} onAuthRequired={() => setAuthOpen(true)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default PropertiesPage;
