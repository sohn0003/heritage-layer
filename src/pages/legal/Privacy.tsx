import LegalLayout from '@/components/legal/LegalLayout';
import Seo from '@/components/common/Seo';

const Privacy = () => (
  <>
    <Seo
      title="개인정보 처리방침 — Heritage Layer"
      description="Heritage Layer 개인정보 처리방침."
      path="/privacy"
    />
    <LegalLayout title="개인정보 처리방침 (Privacy Notice)">
    <p>
      <strong>(주)더레이어코퍼레이션 (The Layer Corporation Co., Ltd.)</strong>(이하 "회사")은(는) Heritage Layer
      서비스(이하 "서비스")의 이용과 관련하여 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을
      준수합니다. 회사는 본 처리방침을 통해 회사가 수집하는 개인정보의 항목, 이용 목적, 보유 기간, 제3자 제공 및
      이용자의 권리에 대해 안내합니다.
    </p>

    <h2>1. 개인정보 처리자 (Controller)</h2>
    <ul>
      <li>상호: (주)더레이어코퍼레이션 (The Layer Corporation Co., Ltd.)</li>
      <li>서비스: Heritage Layer (heritagelayer.com)</li>
      <li>개인정보 보호 문의: contact@thelayercorp.com</li>
    </ul>
    <p>회사는 본 처리방침에서 정한 범위 내에서 개인정보 처리자(data controller)로서의 책임을 부담합니다.</p>

    <h2>2. 수집하는 개인정보 항목 및 수집 방법</h2>
    <h3>가. 회원가입·계정 운영</h3>
    <ul>
      <li>이메일 주소, 비밀번호(해시), 표시 이름(닉네임)</li>
      <li>Google OAuth 로그인 시: 이메일, 프로필 이름, 프로필 사진 URL</li>
    </ul>
    <h3>나. 서비스 이용 과정에서 자동 수집</h3>
    <ul>
      <li>접속 IP, 브라우저 종류, 기기 식별자, 접속 일시, 이용 페이지, 쿠키</li>
      <li>저장 자산 목록, 검색 이력, 분석 요청 내역 등 서비스 이용 기록</li>
    </ul>
    <h3>다. 유료 구독 결제 시 (Paddle 처리)</h3>
    <ul>
      <li>결제 카드 정보, 청구지 주소, 결제 국가, 부가세 식별번호(해당 시)는 회사가 직접 수집하지 않으며,
        결제 리셀러인 <strong>Paddle.com Market Limited</strong>이(가) 수집·처리합니다.</li>
      <li>회사는 Paddle로부터 결제 ID, 구독 상태, 결제 이메일 등 구독 관리에 필요한 최소 정보만 전달받습니다.</li>
    </ul>
    <h3>라. 문의·파트너 신청</h3>
    <ul>
      <li>문의 폼: 이름, 이메일, 회사명(선택), 문의 내용</li>
      <li>파트너 신청: 회사명, 담당자 이메일·연락처, 관심 자산, 메시지</li>
    </ul>

    <h2>3. 개인정보의 이용 목적 및 법적 근거</h2>
    <ul>
      <li><strong>계정 생성 및 인증</strong> — 서비스 이용계약 이행 (계약)</li>
      <li><strong>서비스 제공 및 분석 결과 표시</strong> — 계약 이행 (계약)</li>
      <li><strong>구독·결제 관리, 인보이스 발행</strong> — 계약 이행 및 법적 의무 (계약 / 법적 의무)</li>
      <li><strong>보안, 부정 이용 방지, 시스템 안정성 유지</strong> — 정당한 이익</li>
      <li><strong>서비스 개선, 사용 통계 분석</strong> — 정당한 이익 (식별 정보 최소화)</li>
      <li><strong>고객 지원, 문의 응대</strong> — 계약 이행 / 정당한 이익</li>
      <li><strong>마케팅·뉴스레터 발송</strong> — 사전 동의 (수신거부 가능)</li>
    </ul>

    <h2>4. 개인정보 공유 및 제3자 제공</h2>
    <p>회사는 다음의 경우 외에는 이용자의 개인정보를 제3자에게 제공하지 않습니다.</p>
    <ul>
      <li>
        <strong>결제 리셀러 (Merchant of Record)</strong>: <strong>Paddle.com Market Limited</strong>
        — 결제 처리, 구독 관리, 인보이스 발행, 세금 신고, 환불 처리 목적으로 결제 관련 정보를 공유합니다.
      </li>
      <li>
        <strong>인프라·운영 서비스 제공자(처리위탁)</strong>:
        Supabase Inc.(데이터베이스·인증·스토리지 호스팅), 클라우드 호스팅 사업자, 분석 도구 제공자 등
      </li>
      <li><strong>법률 자문, 회계 자문</strong>: 법적 권리 행사·방어를 위해 필요한 범위</li>
      <li><strong>법령에 따른 정부 기관·수사 기관</strong>: 관련 법령상 의무가 있는 경우에 한함</li>
    </ul>

    <h2>5. 개인정보의 보유 및 이용 기간</h2>
    <ul>
      <li>회원 정보: 회원 탈퇴 시까지 보유, 탈퇴 후 30일 내 삭제 또는 익명화</li>
      <li>결제·인보이스 관련 정보: 「전자상거래법」에 따라 5년 보관</li>
      <li>로그 기록(접속 IP 등): 「통신비밀보호법」에 따라 3개월 보관</li>
      <li>문의 내역: 응대 완료 후 1년 보관</li>
    </ul>

    <h2>6. 이용자의 권리</h2>
    <p>이용자는 회사에 대해 다음의 권리를 행사할 수 있습니다.</p>
    <ul>
      <li>개인정보 열람 청구</li>
      <li>오류 등이 있을 경우 정정·삭제 요청</li>
      <li>처리 정지 요청</li>
      <li>회원 탈퇴를 통한 동의 철회</li>
      <li>마케팅 수신 동의 철회</li>
    </ul>
    <p>
      위 권리는 마이페이지 또는 contact@thelayercorp.com으로 신청하실 수 있으며, 회사는 신청 접수 후 지체 없이(최대 30일
      이내) 조치합니다. 이용자는 또한 대한민국 개인정보 보호위원회(privacy.go.kr) 등 관할 감독기관에 민원을 제기할 권리가
      있습니다.
    </p>

    <h2>7. 안전성 확보 조치</h2>
    <p>회사는 개인정보의 안전한 처리를 위해 다음과 같은 기술적·관리적 조치를 시행합니다.</p>
    <ul>
      <li>비밀번호 단방향 암호화 저장 및 전송 구간 TLS 암호화</li>
      <li>접근 권한 최소화 및 접근 통제(Role-Based Access Control)</li>
      <li>데이터베이스 RLS(Row-Level Security) 기반 행 단위 접근 제어</li>
      <li>접속 기록 보관 및 정기 점검</li>
    </ul>

    <h2>8. 쿠키의 사용</h2>
    <p>
      회사는 로그인 유지, 세션 관리, 서비스 이용 분석을 위해 쿠키를 사용합니다. 이용자는 브라우저 설정에서 쿠키 저장을
      거부할 수 있으나, 이 경우 일부 기능 이용이 제한될 수 있습니다.
    </p>
    <ul>
      <li><strong>필수 쿠키</strong>: 인증 세션 유지에 필요</li>
      <li><strong>분석 쿠키</strong>: 서비스 개선을 위한 익명 통계 (해당 시)</li>
    </ul>

    <h2>9. 국외 이전</h2>
    <p>
      회사는 인프라(Supabase, 클라우드 호스팅) 및 결제(Paddle) 처리 과정에서 개인정보가 대한민국 외 지역(미국, 유럽 등)으로
      이전될 수 있습니다. 회사는 해당 수탁자가 적정한 보호 수준(표준계약조항 등)을 갖추도록 합니다.
    </p>

    <h2>10. 처리방침의 변경</h2>
    <p>
      본 처리방침은 법령·서비스의 변경에 따라 개정될 수 있으며, 변경 시 효력 발생일 7일 전(중요한 변경의 경우 30일 전)에
      서비스 내 공지합니다.
    </p>

    <h2>11. 문의</h2>
    <ul>
      <li>개인정보 보호 담당: contact@thelayercorp.com</li>
      <li>결제 관련 개인정보 처리: Paddle.com Market Limited (privacy@paddle.com)</li>
    </ul>
  </LegalLayout>
);

export default Privacy;
