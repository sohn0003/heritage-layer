// Toss 단건 결제 승인 + 자산 잠금 해제 기록
// 입력: { assetId, paymentKey, orderId, amount }
// 출력: { ok: true } 또는 { error }
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const TOSS_API = 'https://api.tosspayments.com/v1';
const UNLOCK_AMOUNT = 15000;

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

    const body = await req.json();
    const { assetId, paymentKey, orderId, amount } = body ?? {};
    if (!assetId || !paymentKey || !orderId || !amount) {
      return new Response(JSON.stringify({ error: 'assetId, paymentKey, orderId, amount 필수' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (Number(amount) !== UNLOCK_AMOUNT) {
      return new Response(JSON.stringify({ error: '결제 금액 불일치' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 토스 결제 승인
    const confirmRes = await fetch(`${TOSS_API}/payments/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: basicAuth(tossSecret) },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    });
    const confirmData = await confirmRes.json();
    if (!confirmRes.ok) {
      console.error('toss confirm failed:', confirmData);
      return new Response(JSON.stringify({ error: confirmData?.message ?? '결제 승인 실패', code: confirmData?.code }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 잠금 해제 기록
    const admin = createClient(supabaseUrl, serviceKey);
    const { error: upsertErr } = await admin
      .from('asset_unlocks')
      .upsert({
        user_id: userId,
        asset_id: assetId,
        amount: UNLOCK_AMOUNT,
        payment_method: 'toss',
        payment_id: paymentKey,
        status: 'paid',
      }, { onConflict: 'user_id,asset_id' });
    if (upsertErr) throw upsertErr;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('toss-confirm-unlock error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
