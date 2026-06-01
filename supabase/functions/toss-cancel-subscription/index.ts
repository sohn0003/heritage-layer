// 토스 구독 해지: 빌링키 삭제 시도 + DB status='canceled'
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const TOSS_API = 'https://api.tosspayments.com/v1';

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

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: sub, error: subErr } = await admin
      .from('subscriptions')
      .select('id, toss_billing_key, toss_customer_key, current_period_end, provider')
      .eq('user_id', userId)
      .eq('provider', 'toss')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subErr) throw subErr;
    if (!sub) {
      return new Response(JSON.stringify({ error: '활성 토스 구독이 없습니다.' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 토스 빌링키 삭제 시도 (실패해도 DB는 canceled 처리)
    try {
      await fetch(`${TOSS_API}/billing/${sub.toss_billing_key}`, {
        method: 'DELETE',
        headers: { Authorization: basicAuth(tossSecret) },
      });
    } catch (e) {
      console.warn('Toss billing key delete failed (계속 진행):', e);
    }

    await admin
      .from('subscriptions')
      .update({ status: 'canceled', cancel_at_period_end: true })
      .eq('id', sub.id);

    await admin
      .from('profiles')
      .update({ subscription_tier: 'free' })
      .eq('id', userId);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('toss-cancel-subscription error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
