import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type BridgeLevel = 'L1' | 'L2' | 'L3';

const levelOptions: { v: BridgeLevel; l: string; d: string }[] = [
  { v: 'L1', l: 'Level 1 — 사업성 검토 자문', d: '판단 지원, 검토 보고서' },
  { v: 'L2', l: 'Level 2 — 착수 지원', d: '인허가·금융 준비 동행' },
  { v: 'L3', l: 'Level 3 — 전체 PM', d: '전 과정 책임 관리' },
];

interface Props {
  defaultLevel?: BridgeLevel;
  onSuccess?: () => void;
}

const BridgeInquiryForm = ({ defaultLevel = 'L1', onSuccess }: Props) => {
  const [level, setLevel] = useState<BridgeLevel>(defaultLevel);
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const levelLabel = levelOptions.find((l) => l.v === level)?.l ?? level;
    const finalMessage = `[Bridge Solution 의뢰 / ${levelLabel}]\n${message}`;
    const { error } = await supabase.from('partner_inquiries').insert({
      name,
      organization: organization || '-',
      contact: `${phone} / ${email}`,
      message: finalMessage,
    });
    setLoading(false);
    if (error) {
      toast({ title: '문의 접수 실패', description: error.message, variant: 'destructive' });
      return;
    }
    setName(''); setOrganization(''); setPhone(''); setEmail(''); setMessage('');
    setLevel(defaultLevel);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>솔루션 레벨 선택 *</Label>
        <RadioGroup value={level} onValueChange={(v) => setLevel(v as BridgeLevel)} className="gap-2">
          {levelOptions.map((opt) => (
            <label
              key={opt.v}
              htmlFor={`lvl-${opt.v}`}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                level === opt.v ? 'border-accent bg-accent/5' : 'hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem id={`lvl-${opt.v}`} value={opt.v} className="mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{opt.l}</p>
                <p className="text-xs text-muted-foreground">{opt.d}</p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="b-name">이름 *</Label>
          <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-org">소속 (선택)</Label>
          <Input id="b-org" value={organization} onChange={(e) => setOrganization(e.target.value)} maxLength={200} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="b-phone">연락처 *</Label>
          <Input id="b-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={50} placeholder="010-0000-0000" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-email">이메일 *</Label>
          <Input id="b-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={100} placeholder="email@example.com" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="b-msg">문의 내용 *</Label>
        <Textarea
          id="b-msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={2000}
          required
          placeholder="의뢰하실 자산 정보와 검토하고자 하는 개발 방향을 알려주세요."
        />
        <p className="text-right text-xs text-muted-foreground">{message.length}/2000</p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? '접수 중...' : '문의하기'}
      </Button>
    </form>
  );
};

export default BridgeInquiryForm;
