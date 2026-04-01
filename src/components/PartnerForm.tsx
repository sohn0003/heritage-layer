import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const PartnerForm = () => {
  const [form, setForm] = useState({ name: '', organization: '', contact: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('partner_inquiries').insert(form);
    if (error) {
      toast({ title: '전송 실패', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '문의가 전송되었습니다', description: '빠른 시일 내에 연락드리겠습니다.' });
      setForm({ name: '', organization: '', contact: '', message: '' });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="partner-name">이름</Label>
          <Input id="partner-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner-org">기관명</Label>
          <Input id="partner-org" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} required maxLength={200} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="partner-contact">연락처</Label>
        <Input id="partner-contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} required maxLength={100} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="partner-msg">메시지</Label>
        <Textarea id="partner-msg" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required maxLength={2000} rows={4} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '전송 중...' : '문의 보내기'}
      </Button>
    </form>
  );
};

export default PartnerForm;
