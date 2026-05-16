export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

/**
 * Pro 이상 (Pro/Enterprise) 권한 보유 여부.
 * 모든 ProLockOverlay·잠금 게이트는 이 헬퍼를 사용해야 상위 등급이 누락되지 않음.
 */
export function hasProAccess(tier: SubscriptionTier | string | null | undefined): boolean {
  return tier === 'pro' || tier === 'enterprise';
}

export function tierLabel(tier: SubscriptionTier | string | null | undefined): string {
  if (tier === 'enterprise') return 'Enterprise';
  if (tier === 'pro') return 'Pro';
  return 'Free';
}
