import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { calculateScoringFields } from '@/lib/assetScoring';

// 컬럼 정의: DB 키 ↔ 한글 헤더 ↔ 타입
type ColType = 'string' | 'number' | 'boolean';
interface ColDef { key: string; label: string; type: ColType; }

// 편집 가능한 컬럼만 (등급/점수 등 자동 계산 필드 제외)
export const ASSET_COLUMNS: ColDef[] = [
  { key: 'id', label: 'ID (수정 시 필수)', type: 'string' },
  { key: 'address', label: '주소', type: 'string' },
  { key: 'asset_type', label: '자산 유형', type: 'string' },
  { key: 'is_published', label: '공개 여부', type: 'boolean' },
  { key: 'gov_cooperation', label: '정부 협력', type: 'boolean' },
  { key: 'zoning', label: '용도지역', type: 'string' },
  { key: 'building_coverage', label: '건폐율(%)', type: 'number' },
  { key: 'floor_area_ratio', label: '용적률(%)', type: 'number' },
  { key: 'land_area', label: '대지면적(㎡)', type: 'number' },
  { key: 'idle_years', label: '방치기간(년)', type: 'number' },
  { key: 'ownership_type', label: '소유구분', type: 'string' },
  { key: 'latitude', label: '위도', type: 'number' },
  { key: 'longitude', label: '경도', type: 'number' },
  { key: 'admin_memo', label: '관리자 메모', type: 'string' },
  { key: 'current_building_coverage', label: '현재 건폐율(%)', type: 'number' },
  { key: 'legal_max_building_coverage', label: '법정 최대 건폐율(%)', type: 'number' },
  { key: 'current_floor_area_ratio', label: '현재 용적률(%)', type: 'number' },
  { key: 'legal_max_floor_area_ratio', label: '법정 최대 용적률(%)', type: 'number' },
  { key: 'current_floor_area', label: '현재 연면적(㎡)', type: 'number' },
  { key: 'land_value_per_sqm', label: '㎡당 토지가치(원)', type: 'number' },
  
  { key: 'population_trend', label: '인구 추세', type: 'string' },
  { key: 'commercial_density', label: '상권 밀집도', type: 'string' },
  { key: 'distance_to_center', label: '중심지까지 거리(km)', type: 'number' },
  { key: 'historical_value', label: '역사적 가치', type: 'string' },
  { key: 'natural_scenery', label: '자연 경관', type: 'string' },
  { key: 'building_condition', label: '건물 상태', type: 'string' },
  { key: 'is_private_negotiation', label: '사적 협의 가능', type: 'boolean' },
  { key: 'is_citizen_proposal', label: '시민 제안 대상', type: 'boolean' },
  { key: 'is_waterfront_environmental', label: '수변/환경 보전구역', type: 'boolean' },
  { key: 'is_military_heritage_zone', label: '군사/문화재 보호구역', type: 'boolean' },
  { key: 'is_urban_facility_conflict', label: '도시계획시설 충돌', type: 'boolean' },
  { key: 'zoning_upgrade_gain', label: '용도지역 상향 가치', type: 'string' },
  { key: 'use_change_expansion', label: '용도 변경 확장성', type: 'string' },
  { key: 'has_conversion_precedent', label: '전환 선례 있음', type: 'boolean' },
  { key: 'is_urban_regeneration_area', label: '도시재생 활성화 지역', type: 'boolean' },
  { key: 'is_abandoned_school_budget', label: '폐교 예산 대상', type: 'boolean' },
  { key: 'is_balanced_dev_budget', label: '균형발전 예산 대상', type: 'boolean' },
];

// Export 전용 (자동 계산 / 알고리즘 산출 — import 시 무시)
export const ASSET_READONLY_COLUMNS: ColDef[] = [
  { key: 'scoring_grade', label: '점수 등급 (자동)', type: 'string' },
  { key: 'scoring_total', label: '총점 (자동)', type: 'number' },
  { key: 'recommended_use_type', label: '추천 활용 용도 (자동)', type: 'string' },
  { key: 'recommended_dev_direction', label: '추천 개발 방향 (자동)', type: 'string' },
];

export const exportAssetsToExcel = async () => {
  const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const allCols = [...ASSET_COLUMNS, ...ASSET_READONLY_COLUMNS];
  const rows = (data || []).map((a: any) => {
    const r: Record<string, any> = {};
    allCols.forEach(c => { r[c.label] = a[c.key] ?? ''; });
    return r;
  });
  const ws = XLSX.utils.json_to_sheet(rows, { header: allCols.map(c => c.label) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'assets');
  const ts = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `assets_${ts}.xlsx`);
};

const parseBool = (v: any): boolean | null => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  if (['true', '1', 'y', 'yes', '예', 'o', '공개', '참'].includes(s)) return true;
  if (['false', '0', 'n', 'no', '아니오', 'x', '비공개', '거짓'].includes(s)) return false;
  return null;
};

const parseNum = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

export interface ImportResult { inserted: number; updated: number; failed: number; errors: string[]; }

export const importAssetsFromExcel = async (file: File): Promise<ImportResult> => {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const result: ImportResult = { inserted: 0, updated: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const payload: Record<string, any> = {};
    let id: string | null = null;
    for (const col of ASSET_COLUMNS) {
      if (!(col.label in row)) continue;
      const raw = row[col.label];
      if (col.key === 'id') {
        const s = String(raw ?? '').trim();
        if (s) id = s;
        continue;
      }
      let val: any;
      if (col.type === 'number') val = parseNum(raw);
      else if (col.type === 'boolean') val = parseBool(raw);
      else val = raw === '' || raw === null || raw === undefined ? null : String(raw);
      payload[col.key] = val;
    }
    // 빈 칸 허용: 신규 삽입 시 필수 컬럼(address/asset_type)이 비어 있으면 placeholder로 채움
    // (DB NOT NULL 제약 회피 — 이후 admin 페이지에서 수정 가능)
    if (!id) {
      if (!payload.address) payload.address = '(미입력)';
      if (!payload.asset_type) payload.asset_type = '(미분류)';
    } else {
      // 업데이트: 빈 값은 보내지 않음 (기존 값 유지)
      Object.keys(payload).forEach(k => {
        if (payload[k] === null || payload[k] === undefined) delete payload[k];
      });
    }
    // 자동 등급/점수 산출
    const scoring = calculateScoringFields(payload);
    const finalPayload = { ...payload, ...scoring };
    try {
      if (id) {
        const { error } = await (supabase.from('assets').update as any)(finalPayload).eq('id', id);
        if (error) throw error;
        result.updated++;
      } else {
        const { error } = await (supabase.from('assets').insert as any)(finalPayload);
        if (error) throw error;
        result.inserted++;
      }
    } catch (e: any) {
      result.failed++;
      result.errors.push(`행 ${i + 2}: ${e.message}`);
    }
  }
  return result;
};
