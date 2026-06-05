import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { address } = await req.json();
    if (!address || typeof address !== 'string') {
      return new Response(JSON.stringify({ error: 'address is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientId = Deno.env.get('NAVER_MAP_CLIENT_ID');
    const clientSecret = Deno.env.get('NAVER_MAP_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: 'Naver Map credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseAddress = address.trim().replace(/\s+/g, ' ');
    const withoutParen = baseAddress.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
    const beforeParen = baseAddress.replace(/\s*\([^)]*\).*$/g, '').trim();
    const normalizeDori = (value: string) =>
      value.replace(/([가-힣]+)도리/g, '$1리').replace(/\s+/g, ' ').trim();
    const candidates = Array.from(new Set([
      beforeParen,
      withoutParen,
      normalizeDori(beforeParen),
      normalizeDori(withoutParen),
      baseAddress,
      normalizeDori(baseAddress),
    ].filter(Boolean)));

    let first: any | null = null;
    let lastError: { status: number; detail: string } | null = null;
    for (const query of candidates) {
      const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          'x-ncp-apigw-api-key-id': clientId,
          'x-ncp-apigw-api-key': clientSecret,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        lastError = { status: res.status, detail: await res.text() };
        continue;
      }

      const data = await res.json();
      first = data?.addresses?.[0] ?? null;
      if (first) break;
    }

    if (lastError && !first) {
      return new Response(JSON.stringify({ error: 'Naver API error', ...lastError }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!first) {
      return new Response(JSON.stringify({ error: 'No result for address', address }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        latitude: Number(first.y),
        longitude: Number(first.x),
        roadAddress: first.roadAddress ?? null,
        jibunAddress: first.jibunAddress ?? null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
