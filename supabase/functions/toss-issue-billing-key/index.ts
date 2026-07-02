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
    // Toss 카드사 코드 → 한글 이름 매핑 (주요 카드사만)
    const ISSUER_MAP: Record<string, string> = {
      '11': 'BC카드', '14': '광주카드', '16': '전북카드', '21': '개별가맹점', '31': 'BC(글로벌)',
      '32': 'BC', '33': '수협카드', '34': '수협', '35': '산업카드', '36': '씨티카드',
      '37': 'NH농협카드', '38': '하이플러스카드', '39': '경남은행', '40': '수협은행', '41': '우체국카드',
      '42': '새마을금고', '43': '신협체크', '44': 'KDB산업은행', '45': '저축은행',
      '46': '신한카드', '47': '카카오뱅크', '48': '토스뱅크',
      '51': '삼성카드', '52': '조흥카드', '54': '한미카드', '55': '신한카드',
      '56': '현대카드', '57': 'NH농협카드', '61': '롯데카드', '62': '산림조합',
      '63': '기업BC카드', '64': '기업카드', '66': '우리카드', '71': '롯데카드',
      '72': 'KB국민카드', '75': '롯데카드', '76': '하나(외환)카드', '77': 'KB국민카드',
      '78': '단위농협', '81': '하나카드', '83': '우리카드', '87': '신협', '88': '신한카드', '89': '현대카드',
    };
    const mapIssuer = (code: string | null | undefined) =>
      code ? (ISSUER_MAP[code] ?? `카드사(${code})`) : null;
    const cardCompany = (issueData?.card?.company
      ?? mapIssuer(issueData?.card?.issuerCode)
      ?? issueData?.cardCompany
      ?? null) as string | null;
    const cardNumber = (issueData?.card?.number ?? issueData?.cardNumber ?? null) as string | null;

    const admin = createClient(supabaseUrl, serviceKey);

    // 카드 변경(mode='update')이면 기존 활성 구독의 빌링키/카드정보만 갱신
    if (isUpdate) {
      const { data: existing, error: existErr } = await admin
        .from('subscriptions')
        .select('id, toss_billing_key')
        .eq('user_id', userId)
        .eq('provider', 'toss')
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existErr) throw existErr;
      if (!existing) {
        return new Response(JSON.stringify({ error: '갱신할 활성 구독이 없습니다.' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 기존 빌링키 삭제 (실패해도 진행)
      if (existing.toss_billing_key && existing.toss_billing_key !== billingKey) {
        try {
          await fetch(`${TOSS_API}/billing/${existing.toss_billing_key}`, {
            method: 'DELETE',
            headers: { Authorization: basicAuth(tossSecret) },
          });
        } catch (e) {
          console.warn('기존 빌링키 삭제 실패(무시):', e);
        }
      }

      const { error: updErr } = await admin
        .from('subscriptions')
        .update({
          toss_billing_key: billingKey,
          toss_customer_key: customerKey,
          toss_card_company: cardCompany,
          toss_card_number: cardNumber,
        })
        .eq('id', existing.id);
      if (updErr) throw updErr;

      return new Response(JSON.stringify({ ok: true, subscriptionId: existing.id, mode: 'update' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
    const now = new Date();
    const periodEnd = new Date(now.getTime() + plan.intervalDays * 24 * 60 * 60 * 1000);

    // 결제 승인 응답에서 카드사/카드번호를 우선 추출 (한글 카드사명 제공)
    const chargeCardCompany = (chargeData?.card?.company ?? null) as string | null;
    const chargeCardNumber = (chargeData?.card?.number ?? null) as string | null;

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
        toss_card_company: chargeCardCompany ?? cardCompany,
        toss_card_number: chargeCardNumber ?? cardNumber,
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
