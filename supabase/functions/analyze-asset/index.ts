// 자산 상세 분석 서버 API — 알고리즘 로직을 클라이언트 번들에서 완전히 분리.
// 지시서: HERITA~1.MD (알고리즘 로직 유출 방지 실행 지시서)
//
// 책임:
// 1) JWT 검증 (로그인 필수)
// 2) 레이트리밋 (사용자당 1분 30회 / 1일 500회)
// 3) 자산 로드 → 알고리즘 실행 → 결과 소독 → 감사 로그
// 4) 응답에서 다음을 제외:
//    - scoring.detail (a1~d3 등 원점수)
//    - scoring.blockA/B/C/D (블록별 원점수)
//    - scenario.suitabilityScore 원값 → suitabilityLabel(5단계)

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

// 총점 → 5단계 라벨 (블록별 원점수 대신 노출용)
const scoreToLabel = (score: number, max: number): string => {
  const ratio = max > 0 ? score / max : 0;
  if (ratio >= 0.85) return "우수";
  if (ratio >= 0.7) return "양호";
  if (ratio >= 0.5) return "보통";
  if (ratio >= 0.3) return "미흡";
  return "취약";
};

interface OverrideItem {
  rank: number;
  equityRatio?: number;
  annualRevenue?: number;
  operatingMargin?: number; // 0~1
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // ---- 1) 인증 ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // ---- 2) 입력 파싱 & 검증 ----
    const body = await req.json().catch(() => ({}));
    const assetId = typeof body?.asset_id === "string" ? body.asset_id : null;
    if (!assetId || !/^[0-9a-f-]{36}$/i.test(assetId)) {
      return new Response(JSON.stringify({ error: "asset_id (uuid) is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const rawOverrides = Array.isArray(body?.overrides) ? body.overrides : [];
    const overrides: OverrideItem[] = rawOverrides
      .filter((o: unknown): o is Record<string, unknown> => !!o && typeof o === "object")
      .map((o) => ({
        rank: Number(o.rank),
        equityRatio: o.equityRatio !== undefined ? Math.max(0, Math.min(100, Number(o.equityRatio))) : undefined,
        annualRevenue: o.annualRevenue !== undefined ? Math.max(0, Number(o.annualRevenue)) : undefined,
        operatingMargin: o.operatingMargin !== undefined ? Math.max(0, Math.min(1, Number(o.operatingMargin))) : undefined,
      }))
      .filter((o) => [1, 2, 3].includes(o.rank));

    // ---- 3) service-role 클라이언트 (자산 로드 + 로그) ----
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ---- 4) 레이트리밋 (1분 30회 / 1일 500회) ----
    const now = Date.now();
    const [minuteRes, dayRes] = await Promise.all([
      admin.from("analysis_audit_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", new Date(now - 60_000).toISOString()),
      admin.from("analysis_audit_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", new Date(now - 86_400_000).toISOString()),
    ]);
    if ((minuteRes.count ?? 0) >= 30 || (dayRes.count ?? 0) >= 500) {
      return new Response(
        JSON.stringify({ error: "요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.", code: "rate_limited" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- 5) 자산 로드 ----
    const { data: asset, error: assetError } = await admin
      .from("assets")
      .select("*")
      .eq("id", assetId)
      .maybeSingle();
    if (assetError || !asset) {
      return new Response(JSON.stringify({ error: "Asset not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- 6) 알고리즘 설정 로드 ----
    const [ratesRes, cfgRes] = await Promise.all([
      admin.from("loan_rates").select("rate_type, rate_value, effective_date").order("effective_date", { ascending: false }),
      admin.from("system_config").select("key, value"),
    ]);
    const algoCfg = {
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
      if (r.rate_type === "pf") algoCfg.loanRates.pf = v;
      if (r.rate_type === "collateral") algoCfg.loanRates.collateral = v;
    });
    (cfgRes.data ?? []).forEach((row: { key: string; value: unknown }) => {
      const v = Number(row.value);
      if (!Number.isFinite(v)) return;
      if (row.key === "default_project_years") algoCfg.projectYears = v;
      if (row.key === "residual_value_ratio") algoCfg.residualValueRatio = v;
    });

    // ---- 7) 알고리즘 실행 ----
    const { preliminaryROI: _p, ...assetInputBase } = buildScoringInput(asset as Record<string, unknown>);
    const askingLandPrice = (asset as { asking_land_price?: number | null }).asking_land_price ?? null;
    const landArea = Number(asset.land_area ?? 0);
    const landValuePerSqm = askingLandPrice && landArea > 0
      ? askingLandPrice / landArea
      : Number(asset.land_value_per_sqm ?? 4_500_000);

    // 기준 시나리오
    const baseResult = analyzeAsset({
      assetInput: assetInputBase,
      landValuePerSqm,
      loanRates: algoCfg.loanRates,
      projectYears: algoCfg.projectYears,
      residualValueRatio: algoCfg.residualValueRatio,
    });

    // 오버라이드가 있는 rank는 rank별로 별도 실행
    const scenariosByRank = new Map(baseResult.recommendation.scenarios.map((s) => [s.rank, s]));
    for (const ov of overrides) {
      const hasChange = ov.equityRatio !== undefined || ov.annualRevenue !== undefined || ov.operatingMargin !== undefined;
      if (!hasChange) continue;
      try {
        const r = analyzeAsset({
          assetInput: assetInputBase,
          landValuePerSqm,
          loanRates: algoCfg.loanRates,
          projectYears: algoCfg.projectYears,
          residualValueRatio: algoCfg.residualValueRatio,
          overrideEquityRatio: ov.equityRatio,
          overrideAnnualRevenue: ov.annualRevenue,
          overrideOperatingMargin: ov.operatingMargin,
        });
        const scenario = r.recommendation.scenarios.find((x) => x.rank === ov.rank);
        if (scenario) scenariosByRank.set(ov.rank, scenario);
      } catch (e) {
        console.error(`override rank=${ov.rank} 실패`, e);
      }
    }

    // ---- 8) 응답 소독 ----
    const sanitizedScenarios = Array.from(scenariosByRank.values())
      .sort((a, b) => a.rank - b.rank)
      .map((s) => {
        const { suitabilityScore, ...rest } = s;
        void suitabilityScore;
        return {
          ...rest,
          suitabilityLabel: scoreToLabel(suitabilityScore, 100),
        };
      });

    const { detail: _d, blockA, blockB, blockC, blockD, ...scoringRest } = baseResult.scoring;
    void _d;
    const sanitizedScoring = {
      ...scoringRest,
      blockLabels: {
        A: scoreToLabel(blockA, 25),
        B: scoreToLabel(blockB, 25),
        C: scoreToLabel(blockC, 20),
        D: scoreToLabel(blockD, 30),
      },
    };

    const responsePayload = {
      scoring: sanitizedScoring,
      recommendation: {
        assetSummary: baseResult.recommendation.assetSummary,
        scenarios: sanitizedScenarios,
      },
      config: {
        landValuePerSqm,
        projectYears: algoCfg.projectYears,
        residualValueRatio: algoCfg.residualValueRatio,
        loanRates: algoCfg.loanRates,
      },
    };

    // ---- 9) 감사 로그 (best-effort) ----
    admin.from("analysis_audit_log").insert({
      user_id: userId,
      asset_id: assetId,
      overrides_count: overrides.length,
    }).then(({ error }) => {
      if (error) console.error("audit log insert 실패", error);
    });

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-asset 실패", e);
    return new Response(JSON.stringify({ error: "분석 중 오류가 발생했습니다." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
