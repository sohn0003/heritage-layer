import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve((_req) => {
  const clientId = Deno.env.get('NAVER_MAP_CLIENT_ID');

  if (!clientId) {
    return new Response(JSON.stringify({ error: 'Naver Map client ID is not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ncpKeyId: clientId }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});