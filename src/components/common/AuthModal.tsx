import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { toast } from '@/hooks/use-toast';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const translateError = (err: any): string => {
    const code = err?.code || err?.error_code;
    const msg = err?.message || '';
    if (code === 'weak_password' || /weak|pwned|known to be weak/i.test(msg)) {
      return '비밀번호가 너무 단순하거나 유출된 비밀번호입니다. 대소문자·숫자·특수문자를 조합해 8자 이상으로 설정해주세요.';
    }
    if (code === 'user_already_exists' || /already registered|already exists/i.test(msg)) {
      return '이미 가입된 이메일입니다. 로그인해주세요.';
    }
    if (code === 'invalid_credentials' || /invalid login/i.test(msg)) {
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    }
    if (code === 'email_address_invalid' || /invalid.*email/i.test(msg)) {
      return '올바른 이메일 주소를 입력해주세요.';
    }
    if (code === 'over_email_send_rate_limit' || /rate limit/i.test(msg)) {
      return '요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.';
    }
    return msg || '알 수 없는 오류가 발생했습니다.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'signup') {
      if (password.length < 8) {
        toast({ title: '회원가입 실패', description: '비밀번호는 8자 이상이어야 합니다.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, phone, address },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast({ title: '회원가입 실패', description: translateError(error), variant: 'destructive' });
      } else {
        toast({ title: '회원가입 완료', description: '이메일을 확인해주세요.' });
        onOpenChange(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: '로그인 실패', description: translateError(error), variant: 'destructive' });
      } else {
        toast({ title: '로그인 성공' });
        onOpenChange(false);
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ title: 'Google 로그인 실패', description: result.error.message, variant: 'destructive' });
      return;
    }
    if (result.redirected) return;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {mode === 'login' ? '로그인' : '회원가입'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">연락처</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">주소</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="서울시 강남구 ..." required />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </Button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">또는</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google로 로그인
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {mode === 'login' ? (
            <>계정이 없으신가요? <button type="button" className="text-primary underline" onClick={() => setMode('signup')}>회원가입</button></>
          ) : (
            <>이미 계정이 있으신가요? <button type="button" className="text-primary underline" onClick={() => setMode('login')}>로그인</button></>
          )}
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
