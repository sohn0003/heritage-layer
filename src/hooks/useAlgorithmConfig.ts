import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AlgorithmConfig {
  loanRates: { pf: number; collateral: number };
  equityRatio: number;       // %
  projectYears: number;      // 년
  residualValueRatio: number; // 0~1 (예: 0.4 = 40%)
  loaded: boolean;
}

const DEFAULTS: AlgorithmConfig = {
  loanRates: { pf: 5.5, collateral: 4.8 },
  equityRatio: 30,
  projectYears: 10,
  residualValueRatio: 0.4,
  loaded: false,
};

export function useAlgorithmConfig(): AlgorithmConfig {
  const [config, setConfig] = useState<AlgorithmConfig>(DEFAULTS);

  useEffect(() => {
    (async () => {
      const [ratesRes, cfgRes] = await Promise.all([
        supabase
          .from('loan_rates')
          .select('rate_type, rate_value, effective_date')
          .order('effective_date', { ascending: false }),
        supabase.from('system_config').select('key, value'),
      ]);

      const next: AlgorithmConfig = { ...DEFAULTS, loaded: true };

      // 가장 최근 적용일자 기준 이자율
      const seen = new Set<string>();
      (ratesRes.data ?? []).forEach((r: any) => {
        if (seen.has(r.rate_type)) return;
        seen.add(r.rate_type);
        const v = Number(r.rate_value);
        if (!Number.isFinite(v)) return;
        if (r.rate_type === 'pf') next.loanRates.pf = v;
        if (r.rate_type === 'collateral') next.loanRates.collateral = v;
      });

      (cfgRes.data ?? []).forEach((row: any) => {
        const v = Number(row.value);
        if (!Number.isFinite(v)) return;
        if (row.key === 'default_equity_ratio') next.equityRatio = v;
        if (row.key === 'default_project_years') next.projectYears = v;
        if (row.key === 'residual_value_ratio') next.residualValueRatio = v;
      });

      setConfig(next);
    })();
  }, []);

  return config;
}
