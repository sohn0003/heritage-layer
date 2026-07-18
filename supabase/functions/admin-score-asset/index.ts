// 관리자 전용 자산 스코어링 서버 API
// - 클라이언트에는 알고리즘 코드가 전혀 없음
// - 관리자 페이지에서 자산 저장/일괄 재계산 시 호출
//
// 모드:
//   { mode: "recompute", asset_id }        — 단일 자산 재계산 + DB 업데이트
//   { mode: "recompute_all" }              — 전체 자산 재계산 + DB 업데이트 (관리자 전용)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { analyzeAsset } from "./_algo/financial/irr-calculator.ts";
import { buildScoringInput } from "./_algo/buildScoringInput.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_ALGO = {
  loanRates: { pf: 5.5, collateral: 4.8 },
  projectYears: 10,
  residualValueRatio: 0.4,
};

interface ScoringWrite {
  scoring_grade: string;
  scoring_total: number;
  scoring_detail: unknown;
  grade: string;
  irr_result: unknown;
  recommended_use_type: string | null;
  recommended_dev_direction: string | null;
}

async function loadAlgoConfig(admin: ReturnType<typeof createClient>) {
  const [ratesRes, cfgRes] = await Promise.all([
    admin.from("loan_rates").select("rate_type, rate_value, effective_date").order("effective_date", { ascending: false }),
    admin.from("system_config").select("key, value"),
  ]);
  const cfg = {
    loanRates: { ...DEFAULT_ALGO.loanRates },
    projectYears: DEFAULT_ALGO.projectYears,
    residualValueRatio: DEFAULT_ALGO.residualValueRatio,
  };
  const seen = new Set<string>();
  (ratesRes.data ?? []).forEach((r: { rate_type: string; rate_value: unknown }) => {
    if (seen.has(r.rate_type)) return;
    seen.add(r.rate_type);
    const v = Number(r.rate_value);
    if (!Number.isFinite(v)) return;
    if (r.rate_type === "pf") cfg.loanRates.pf = v;
    if (r.rate_type === "collateral") cfg.loanRates.collateral = v;
  });
  (cfgRes.data ?? []).forEach((row: { key: string; value: unknown }) => {
    const v = Number(row.value);
    if (!Number.isFinite(v)) return;
    if (row.key === "default_project_years") cfg.projectYears = v;
    if (row.key === "residual_value_ratio") cfg.residualValueRatio = v;
  });
  return cfg;
}

function computeScoringFields(asset: Record<string, unknown>, algoCfg: ReturnType<typeof loadAlgoConfig> extends Promise<infer T> ? T : never): ScoringWrite {
  const { preliminaryROI, ...assetInputBase } = buildScoringInput(asset);
  const askingLandPrice = (asset as { asking_land_price?: number | null }).asking_land_price ?? null;
  const landArea = Number(asset.land_area ?? 0);
  const landValuePerSqm = askingLandPrice && landArea > 0
    ? askingLandPrice / landArea
    : Number(asset.land_value_per_sqm ?? 4_500_000);

  const result = analyzeAsset({
    assetInput: assetInputBase,
    landValuePerSqm,
    loanRates: algoCfg.loanRates,
    projectYears: algoCfg.projectYears,
    residualValueRatio: algoCfg.residualValueRatio,
  });

  const top = result.recommendation.scenarios[0];
  return {
    scoring_grade: result.scoring.grade,
    scoring_total: result.scoring.totalScore,
    scoring_detail: result.scoring.detail,
    grade: result.scoring.grade,
    irr_result: {
      preliminaryROI,
      scenarios: result.recommendation.scenarios.map((s) => ({
        rank: s.rank,
        irr: s.irr,
        useTypeSummary: s.useTypeSummary,
        developmentDirectionLabel: s.developmentDirectionLabel,
      })),
    },
    recommended_use_type: top?.useTypeSummary ?? null,
    recommended_dev_direction: top?.developmentDirectionLabel ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 인증
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userError } = await anonClient.auth.getUser();
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 관리자 권한 검증
    const { data: roleRows } = await admin
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin");
    if (!roleRows || roleRows.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body?.mode;
    const algoCfg = await loadAlgoConfig(admin);

    if (mode === "recompute") {
      const assetId = typeof body?.asset_id === "string" ? body.asset_id : null;
      if (!assetId || !/^[0-9a-f-]{36}$/i.test(assetId)) {
        return new Response(JSON.stringify({ error: "asset_id (uuid) is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: asset, error } = await admin.from("assets").select("*").eq("id", assetId).maybeSingle();
      if (error || !asset) {
        return new Response(JSON.stringify({ error: "Asset not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const scoring = computeScoringFields(asset as Record<string, unknown>, algoCfg);
      const { error: upErr } = await admin.from("assets").update(scoring).eq("id", assetId);
      if (upErr) throw upErr;
      return new Response(JSON.stringify({ ok: true, grade: scoring.grade, total: scoring.scoring_total }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "recompute_all") {
      const { data: assets, error } = await admin.from("assets").select("*");
      if (error) throw error;
      let ok = 0, fail = 0;
      for (const a of assets ?? []) {
        try {
          const scoring = computeScoringFields(a as Record<string, unknown>, algoCfg);
          const { error: upErr } = await admin.from("assets").update(scoring).eq("id", (a as { id: string }).id);
          if (upErr) throw upErr;
          ok++;
        } catch (e) {
          console.error("recompute_all 개별 실패", (a as { id?: string }).id, e);
          fail++;
        }
      }
      return new Response(JSON.stringify({ ok: true, updated: ok, failed: fail }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "invalid mode" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-score-asset 실패", e);
    return new Response(JSON.stringify({ error: "재계산 중 오류가 발생했습니다." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
