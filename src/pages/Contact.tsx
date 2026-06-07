import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mail, Building2, FileQuestion, CheckCircle2 } from 'lucide-react';
import BridgeInquiryForm from '@/components/common/BridgeInquiryForm';
import Seo from '@/components/common/Seo';

const inquiryTypes = [
  { v: 'asset_report', l: '유휴자산 등록 의뢰' },
  { v: 'bridge_solution', l: 'Bridge Solution 의뢰' },
  { v: 'platform_inquiry', l: '플랫폼 이용 관련 문의' },
];

const ContactPage = () => {
  const [type, setType] = useState('asset_report');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [assetAddress, setAssetAddress] = useState('');
  const [assetType, setAssetType] = useState('');
  const [landArea, setLandArea] = useState('');
  const [buildingArea, setBuildingArea] = useState('');
  const [totalFloorArea, setTotalFloorArea] = useState('');
  const [ownerType, setOwnerType] = useState('');
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const reset = () => {
    setName(''); setOrganization(''); setPhone(''); setEmail(''); setMessage('');
    setAssetAddress(''); setAssetType(''); setLandArea(''); setBuildingArea(''); setTotalFloorArea(''); setOwnerType('');
    setType('asset_report');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const typeLabel = inquiryTypes.find((t) => t.v === type)?.l ?? type;
    const assetBlock = type === 'asset_report'
      ? `\n[자산정보]\n- 주소: ${assetAddress}\n- 유형: ${assetType}\n- 대지면적: ${landArea}㎡\n- 건축면적: ${buildingArea ? buildingArea + '㎡' : '-'}\n- 연면적: ${totalFloorArea ? totalFloorArea + '㎡' : '-'}\n- 소유자: ${ownerType}\n`
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
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background pt-20">
      <Seo
        title="문의하기 — Heritage Layer"
        description="유휴자산 등록 의뢰, Bridge Solution 의뢰 등 Heritage Layer에 문의하세요."
        path="/contact"
      />
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Contact</span>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">문의하기</h1>
          <p className="mt-3 text-muted-foreground">
            유휴자산 등록 또는 Bridge Solution 의뢰를 남겨주세요. 담당자가 빠르게 안내드립니다.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 rounded-xl border bg-card/60 p-4 backdrop-blur">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15">
              <Mail className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">이메일</p>
              <p className="text-sm font-semibold">contact@thelayercorp.com</p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="mb-5 space-y-2">
              <Label className="flex items-center gap-2">
                <FileQuestion className="h-4 w-4 text-accent" /> 문의 항목 *
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">이름 *</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" /> 소속 (선택)
                    </Label>
                    <Input id="org" value={organization} onChange={(e) => setOrganization(e.target.value)} maxLength={200} />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">연락처 *</Label>
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={50} placeholder="010-0000-0000" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일 *</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={100} placeholder="email@example.com" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">문의 내용 *</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    maxLength={2000}
                    required
                    placeholder="제보하실 자산의 위치, 유형, 특이사항 등을 자유롭게 작성해주세요."
                  />
                  <p className="text-right text-xs text-muted-foreground">{message.length}/2000</p>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? '접수 중...' : '문의하기'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
              <CheckCircle2 className="h-8 w-8 text-accent" />
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
