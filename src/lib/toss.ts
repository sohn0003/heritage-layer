// 토스페이먼츠 가격 매핑 (Pricing 페이지의 priceId → 결제 정보)
// Toss는 KRW 정수 단위 (won, not cents).

export interface TossPlan {
  priceId: string;
  amount: number; // KRW
  orderName: string;
  tier: 'pro' | 'enterprise';
  intervalDays: number; // 다음 결제일 계산용
}

const PLANS: Record<string, TossPlan> = {
  pro_monthly: {
    priceId: 'pro_monthly',
    amount: 39000,
    orderName: 'Heritage Layer Pro 월간 구독',
    tier: 'pro',
    intervalDays: 30,
  },
  enterprise_monthly: {
    priceId: 'enterprise_monthly',
    amount: 300000,
    orderName: 'Heritage Layer Enterprise 월간 구독',
    tier: 'enterprise',
    intervalDays: 30,
  },
  enterprise_yearly: {
    priceId: 'enterprise_yearly',
    amount: 3000000,
    orderName: 'Heritage Layer Enterprise 연간 구독',
    tier: 'enterprise',
    intervalDays: 365,
  },
};

export function getTossPlan(priceId: string): TossPlan | null {
  return PLANS[priceId] ?? null;
}

export const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY as string | undefined;
