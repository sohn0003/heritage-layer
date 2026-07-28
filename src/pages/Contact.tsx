import { useState } from 'react';
// Card 컴포넌트 제거 — 섹션은 선으로 구분합니다.
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mail, CheckCircle2 } from 'lucide-react';
import BridgeInquiryForm from '@/components/common/BridgeInquiryForm';
import Seo from '@/components/common/Seo';

const inquiryTypes = [
  { v: 'asset_report', l: '유휴자산 등록 의뢰' },
  { v: 'bridge_solution', l: 'Bridge Solution 의뢰' },
  { v: 'platform_inquiry', l: '플랫폼 이용 관련 문의' },
];

// 한국어 + 영어 보조 라벨 (중앙 정렬)
const FieldLabel = ({ ko, en, htmlFor, required }: { ko: string; en: string; htmlFor?: string; required?: boolean }) => (
  <Label htmlFor={htmlFor} className="flex items-baseline justify-center gap-2 text-sm font-normal">
    <span>{ko}{required && ' *'}</span>
    <span className="text-[11px] font-light text-muted-foreground/60">{en}</span>
  </Label>
);

const ContactPage = () => {
  const [type, setType] = useState('asset_report');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [assetAddress, setAssetAddress] = useState('');
  const [assetType, setAssetType] = useState('');
  const [ownerType, setOwnerType] = useState('');
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const reset = () => {
    setName(''); setOrganization(''); setPhone(''); setEmail(''); setMessage('');
    setAssetAddress(''); setAssetType(''); setOwnerType('');
    setType('asset_report');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const typeLabel = inquiryTypes.find((t) => t.v === type)?.l ?? type;
    const assetBlock = type === 'asset_report'
      ? `\n[자산정보]\n- 주소: ${assetAddress}\n- 유형: ${assetType}\n- 소유자: ${ownerType}\n`
      : '';
    const finalMessage = `[${typeLabel}]${assetBlock}\n${message}`;
    const { error } = await supabase.from('partner_inquiries').insert({
      name, organization: organization || '-', contact: `${phone} / ${email}`, message: finalMessage,
    });
    setLoading(false);
    if (error) {
      toast({ title: '문의 접수 실패', description: error.message, variant: 'destructive' });
      return;
    }
    setSuccessOpen(true);
    reset();
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <Seo
        title="문의하기 — Heritage Layer"
        description="유휴자산 등록 의뢰, Bridge Solution 의뢰 등 Heritage Layer에 문의하세요."
        path="/contact"
      />
      <div className="mx-auto max-w-4xl px-3 sm:px-4 py-14 md:py-20">
        <div className="mb-12 text-center">
          <h1 className="text-2xl font-light tracking-tight md:text-3xl">문의하기</h1>
          <p className="mt-4 text-sm leading-[1.9] text-muted-foreground">
            유휴자산 등록 또는 Bridge Solution 의뢰를 남겨주세요. 담당자가 빠르게 안내드립니다.
          </p>
        </div>

        <div className="mb-10 space-y-2 text-center">
          <FieldLabel ko="문의 항목" en="Inquiry type" required />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="mx-auto max-w-md"><SelectValue /></SelectTrigger>
            <SelectContent>
              {inquiryTypes.map((t) => (
                <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {type === 'bridge_solution' ? (
          <BridgeInquiryForm onSuccess={() => setSuccessOpen(true)} />
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-7 text-center">
            <div className="space-y-2">
              <FieldLabel ko="이름" en="Name" htmlFor="name" required />
              <Input id="name" className="text-center" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
            </div>

            <div className="space-y-2">
              <FieldLabel ko="소속 (선택)" en="Organization" htmlFor="org" />
              <Input id="org" className="text-center" value={organization} onChange={(e) => setOrganization(e.target.value)} maxLength={200} />
            </div>

            <div className="space-y-2">
              <FieldLabel ko="연락처" en="Phone" htmlFor="phone" required />
              <Input id="phone" type="tel" className="text-center" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={50} placeholder="010-0000-0000" required />
            </div>

            <div className="space-y-2">
              <FieldLabel ko="이메일" en="Email" htmlFor="email" required />
              <Input id="email" type="email" className="text-center" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={100} placeholder="email@example.com" required />
            </div>

            {type === 'asset_report' && (
              <div className="space-y-5 border-t border-border/30 pt-7 text-left">
                <p className="text-center text-sm font-normal">
                  자산 정보 <span className="ml-2 text-[11px] font-light text-muted-foreground/60">Asset details</span>
                </p>
                <div className="space-y-2">
                  <FieldLabel ko="유휴자산 주소" en="Address" htmlFor="asset-address" required />
                  <Input id="asset-address" className="text-center" value={assetAddress} onChange={(e) => setAssetAddress(e.target.value)} maxLength={200} required placeholder="예) 서울특별시 종로구 ..." />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel ko="유형" en="Type" htmlFor="asset-type" required />
                    <Select value={assetType} onValueChange={setAssetType}>
                      <SelectTrigger id="asset-type"><SelectValue placeholder="유형 선택" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="토지">토지</SelectItem>
                        <SelectItem value="단독주택">단독주택</SelectItem>
                        <SelectItem value="상가/근린생활시설">상가/근린생활시설</SelectItem>
                        <SelectItem value="공장/창고">공장/창고</SelectItem>
                        <SelectItem value="업무시설">업무시설</SelectItem>
                        <SelectItem value="기타">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel ko="소유자" en="Owner" htmlFor="owner-type" required />
                    <Select value={ownerType} onValueChange={setOwnerType}>
                      <SelectTrigger id="owner-type"><SelectValue placeholder="소유자 구분" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="기관">기관</SelectItem>
                        <SelectItem value="개인">개인</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 border-t border-border/30 pt-7">
              <FieldLabel ko="문의 내용" en="Message" htmlFor="message" required />
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={2000}
                required
                placeholder="제보하실 자산의 특이사항을 자유롭게 작성해주세요."
              />
              <p className="text-right text-xs text-muted-foreground">{message.length}/2000</p>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? '접수 중...' : '문의하기'}
            </Button>
          </form>
        )}

        {/* 이메일 안내 — 최하단 */}
        <div className="mx-auto mt-14 max-w-md border-t border-border/30 pt-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">이메일</span>
            <span className="text-[11px] font-light text-muted-foreground/60">Email</span>
          </div>
          <p className="mt-2 text-sm">contact@thelayercorp.com</p>
        </div>
      </div>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">문의가 접수되었습니다</DialogTitle>
            <DialogDescription className="text-center">
              성공적으로 문의가 접수되었습니다.<br />
              담당자가 순차적으로 안내 연락을 드리겠습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full" onClick={() => setSuccessOpen(false)}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactPage;
