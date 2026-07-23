import { useNavigate } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="border-t bg-card px-4 py-14">
      <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-3">
        <div>
          <h3 className="mb-3 text-base font-semibold">더레이어코퍼레이션</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            유휴 부동산을 새로운 기회로 잇는<br />Heritage Layer
          </p>
          <div className="mt-3 space-y-1 text-xs leading-relaxed text-muted-foreground">
            <p>(주)더레이어코퍼레이션</p>
            <p>대표자 : 이혜지</p>
            <p>사업자등록번호 : 354-87-02814</p>
            <p>사업장 주소 : 서울특별시 강남구 테헤란로79길 6, 5층 브이636</p>
            <p>통신판매업 신고번호 : 2024-서울강남-01639</p>
          </div>
        </div>
        <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-foreground">Contact</p>
          <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> contact@thelayercorp.com</p>
          <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> 010-5035-5901</p>
          <p>담당자 : 손성식</p>
        </div>
        <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-foreground">Service</p>
          <button onClick={() => navigate('/properties')} className="block hover:text-foreground">자산 탐색</button>
          <button onClick={() => navigate('/about')} className="block hover:text-foreground">회사 소개</button>
          <button onClick={() => navigate('/contact')} className="block hover:text-foreground">문의하기</button>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-5xl border-t pt-6 flex flex-col items-center gap-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <button onClick={() => navigate('/terms')} className="hover:text-foreground">이용약관</button>
          <span className="opacity-40">·</span>
          <button onClick={() => navigate('/privacy')} className="hover:text-foreground">개인정보 처리방침</button>
        </div>
        <p>© 2025 (주)더레이어코퍼레이션 (The Layer Corporation Co., Ltd.). All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
