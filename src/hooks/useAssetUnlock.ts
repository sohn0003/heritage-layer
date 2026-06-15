import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 자산별 잠금 해제 여부 조회.
 * Pro 구독자는 항상 unlocked. Free 사용자는 asset_unlocks 결제 기록이 있을 때만 unlocked.
 */
export function useAssetUnlock(assetId: string | null | undefined) {
  const { user, hasProAccess } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!assetId) { setUnlocked(false); setLoading(false); return; }
    if (hasProAccess) { setUnlocked(true); setLoading(false); return; }
    if (!user) { setUnlocked(false); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('asset_unlocks')
      .select('id')
      .eq('user_id', user.id)
      .eq('asset_id', assetId)
      .eq('status', 'paid')
      .maybeSingle();
    setUnlocked(!!data);
    setLoading(false);
  }, [assetId, user, hasProAccess]);

  useEffect(() => { refresh(); }, [refresh]);

  return { unlocked, loading, refresh };
}
