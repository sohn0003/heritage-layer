import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { X, CheckCircle2 } from 'lucide-react';
import BridgeInquiryForm from '@/components/common/BridgeInquiryForm';

const inquiryTypes = [
  { v: 'asset_report', l: '유휴자산 등록 의뢰' },
  { v: 'bridge_solution', l: 'Bridge Solution 의뢰' },
  { v: 'platform_inquiry', l: '플랫폼 이용 관련 문의' },
];

const FieldLabel = ({ ko, en, htmlFor, required }: { ko: string; en: string; htmlFor?: string; required?: boolean }) => (
  <Label htmlFor={htmlFor} className="flex items-baseline gap-2 text-sm font-normal text-neutral-800">
    <span>{ko}{required && ' *'}</span>
    <span className="text-[11px] font-light text-neutral-400">{en}</span>
  </Label>
);

/**
 * 우측에서 좌측으로 슬라이드/페이드 인 되는 문의하기 패널.
 */
const ContactPanel = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
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
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

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
    setDone(true);
    reset();
  };

  return (
    <div className={`fixed inset-0 z-[120] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <style>{`
        .cp-fields input,
        .cp-fields textarea,
        .cp-fields [role="combobox"] {
          background: transparent !important;
          border: 0 !important;
          border-bottom: 1px solid rgba(0,0,0,0.14) !important;
          border-radius: 0 !important;
          padding-left: 0 !important;
          box-shadow: none !important;
        }
        .cp-fields input:focus,
        .cp-fields textarea:focus,
        .cp-fields [role="combobox"]:focus {
          border-bottom-color: rgba(0,0,0,0.5) !important;
          outline: none !important;
        }
      `}</style>
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0 }}
        onClick={() => onOpenChange(false)}
      />
      {/* panel */}
      <aside
        className="cp-fields absolute right-0 top-0 h-full w-full overflow-y-auto bg-white text-neutral-900 shadow-2xl transition-all duration-500 ease-out sm:w-[62%] lg:w-[42%]"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(40px)',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-8 py-4 backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Contact / 문의하기</p>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="닫기" className="text-neutral-500 hover:text-neutral-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-8 py-12 md:px-14">
          {done ? (
            <div className="max-w-xl">
              <CheckCircle2 className="h-10 w-10 text-primary" />
              <h2 className="mt-6 text-2xl font-light">문의가 접수되었습니다</h2>
              <p className="mt-4 text-sm leading-[1.9] text-neutral-500">
                성공적으로 문의가 접수되었습니다.<br />담당자가 순차적으로 안내 연락을 드리겠습니다.
              </p>
              <Button className="mt-8" onClick={() => { setDone(false); onOpenChange(false); }}>확인</Button>
            </div>
          ) : (
            <>
              <h2 className="max-w-xl text-2xl font-light leading-[1.5] md:text-3xl">
                Heritage Layer와 함께<br />유휴자산 전략을 설계하시겠어요?
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-[1.9] text-neutral-500">
                유휴자산 등록 또는 Bridge Solution 의뢰를 남겨주세요. 담당자가 빠르게 안내드립니다.
              </p>

              <div className="mt-12 max-w-xl space-y-2">
                <FieldLabel ko="문의 항목" en="Inquiry type" required />
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
                <div className="mt-8 max-w-xl">
                  <BridgeInquiryForm onSuccess={() => setDone(true)} />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-7 text-left">
                  <div className="space-y-2">
                    <FieldLabel ko="이름" en="Name" htmlFor="cp-name" required />
                    <Input id="cp-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel ko="소속 (선택)" en="Organization" htmlFor="cp-org" />
                    <Input id="cp-org" value={organization} onChange={(e) => setOrganization(e.target.value)} maxLength={200} />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel ko="연락처" en="Phone" htmlFor="cp-phone" required />
                    <Input id="cp-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={50} placeholder="010-0000-0000" required />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel ko="이메일" en="Email" htmlFor="cp-email" required />
                    <Input id="cp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={100} placeholder="email@example.com" required />
                  </div>

                  {type === 'asset_report' && (
                    <div className="space-y-5 border-t border-neutral-200 pt-7">
                      <p className="text-sm font-normal">
                        자산 정보 <span className="ml-2 text-[11px] font-light text-neutral-400">Asset details</span>
                      </p>
                      <div className="space-y-2">
                        <FieldLabel ko="유휴자산 주소" en="Address" htmlFor="cp-addr" required />
                        <Input id="cp-addr" value={assetAddress} onChange={(e) => setAssetAddress(e.target.value)} maxLength={200} required placeholder="예) 서울특별시 종로구 ..." />
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <FieldLabel ko="유형" en="Type" htmlFor="cp-atype" required />
                          <Select value={assetType} onValueChange={setAssetType}>
                            <SelectTrigger id="cp-atype"><SelectValue placeholder="유형 선택" /></SelectTrigger>
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
                          <FieldLabel ko="소유자" en="Owner" htmlFor="cp-owner" required />
                          <Select value={ownerType} onValueChange={setOwnerType}>
                            <SelectTrigger id="cp-owner"><SelectValue placeholder="소유자 구분" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="기관">기관</SelectItem>
                              <SelectItem value="개인">개인</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-3">
                        <div className="space-y-2">
                          <FieldLabel ko="대지면적 (㎡)" en="Land" htmlFor="cp-land" required />
                          <Input id="cp-land" type="number" min="0" step="0.01" value={landArea} onChange={(e) => setLandArea(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <FieldLabel ko="건축면적 (㎡)" en="Building" htmlFor="cp-bldg" />
                          <Input id="cp-bldg" type="number" min="0" step="0.01" value={buildingArea} onChange={(e) => setBuildingArea(e.target.value)} placeholder="선택" />
                        </div>
                        <div className="space-y-2">
                          <FieldLabel ko="연면적 (㎡)" en="Floor area" htmlFor="cp-floor" />
                          <Input id="cp-floor" type="number" min="0" step="0.01" value={totalFloorArea} onChange={(e) => setTotalFloorArea(e.target.value)} placeholder="선택" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 border-t border-neutral-200 pt-7">
                    <FieldLabel ko="문의 내용" en="Message" htmlFor="cp-msg" required />
                    <Textarea
                      id="cp-msg"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      maxLength={2000}
                      required
                      placeholder="제보하실 자산의 특이사항을 자유롭게 작성해주세요."
                    />
                    <p className="text-right text-xs text-neutral-400">{message.length}/2000</p>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? '접수 중...' : '문의하기'}
                  </Button>
                </form>
              )}

              <div className="mt-14 max-w-xl border-t border-neutral-200 pt-6">
                <p className="text-xs text-neutral-400">이메일 <span className="ml-1">Email</span></p>
                <p className="mt-2 text-sm">contact@thelayercorp.com</p>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

export default ContactPanel;
