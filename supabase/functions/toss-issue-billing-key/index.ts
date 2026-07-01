// Toss billing key issuance + 첫 결제 승인
// 입력: { authKey, customerKey, priceId, planLabel }
// 출력: { ok: true, subscriptionId } 또는 { error }

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const TOSS_API = 'https://api.tosspayments.com/v1';

// priceId → 결제 금액/이름 (Edge에서도 동일 매핑 유지)
const PLANS: Record<string, { amount: number; orderName: string; tier: 'pro' | 'enterprise'; intervalDays: number }> = {
  pro_monthly: { amount: 39000, orderName: 'Heritage Layer Pro 월간 구독', tier: 'pro', intervalDays: 30 },
  enterprise_monthly: { amount: 300000, orderName: 'Heritage Layer Enterprise 월간 구독', tier: 'enterprise', intervalDays: 30 },
  enterprise_yearly: { amount: 3000000, orderName: 'Heritage Layer Enterprise 연간 구독', tier: 'enterprise', intervalDays: 365 },
};

function basicAuth(secret: string) {
  return 'Basic ' + btoa(`${secret}:`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const tossSecret = Deno.env.get('TOSS_SECRET_KEY')!;
    if (!tossSecret) throw new Error('TOSS_SECRET_KEY is not configured');

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string | undefined;

    const body = await req.json();
    const { authKey, customerKey, priceId, mode } = body ?? {};
    const isUpdate = mode === 'update';
    if (!authKey || !customerKey || !priceId) {
      return new Response(JSON.stringify({ error: 'authKey, customerKey, priceId 필수' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const plan = PLANS[priceId];
    if (!plan) {
      return new Response(JSON.stringify({ error: `알 수 없는 priceId: ${priceId}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1) 빌링키 발급
    const issueRes = await fetch(`${TOSS_API}/billing/authorizations/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: basicAuth(tossSecret) },
      body: JSON.stringify({ authKey, customerKey }),
    });
    const issueData = await issueRes.json();
    if (!issueRes.ok) {
      console.error('toss issue billing key failed:', issueData);
      return new Response(JSON.stringify({ error: issueData?.message ?? '빌링키 발급 실패', code: issueData?.code }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const billingKey = issueData.billingKey as string;

    // 2) 첫 결제 승인
    const orderId = `hl_${userId.slice(0, 8)}_${Date.now()}`;
    const chargeRes = await fetch(`${TOSS_API}/billing/${billingKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: basicAuth(tossSecret) },
      body: JSON.stringify({
        customerKey,
        amount: plan.amount,
        orderId,
        orderName: plan.orderName,
        customerEmail: userEmail,
      }),
    });
    const chargeData = await chargeRes.json();
    if (!chargeRes.ok) {
      console.error('toss charge billing key failed:', chargeData);
      return new Response(JSON.stringify({ error: chargeData?.message ?? '결제 승인 실패', code: chargeData?.code }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3) subscriptions 저장 + profiles.subscription_tier 갱신
    const admin = createClient(supabaseUrl, serviceKey);
    const now = new Date();
    const periodEnd = new Date(now.getTime() + plan.intervalDays * 24 * 60 * 60 * 1000);

    const { data: subRow, error: insertErr } = await admin
      .from('subscriptions')
      .insert({
        user_id: userId,
        provider: 'toss',
        product_id: plan.tier === 'pro' ? 'pro_plan' : 'enterprise_plan',
        price_id: priceId,
        status: 'active',
        environment: 'sandbox',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        toss_billing_key: billingKey,
        toss_customer_key: customerKey,
      })
      .select('id')
      .single();
    if (insertErr) throw insertErr;

    await admin
      .from('profiles')
      .update({ subscription_tier: plan.tier })
      .eq('id', userId);

    return new Response(JSON.stringify({ ok: true, subscriptionId: subRow.id, orderId }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('toss-issue-billing-key error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
