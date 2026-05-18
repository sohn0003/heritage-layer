import LegalLayout from '@/components/legal/LegalLayout';
import Seo from '@/components/common/Seo';

const Refund = () => (
  <>
    <Seo
      title="환불 정책 — Heritage Layer"
      description="Heritage Layer 환불 정책 안내."
      path="/refund"
    />
    <LegalLayout title="환불 정책 (Refund Policy)">
    <p>
      <strong>(주)더레이어코퍼레이션 (The Layer Corporation Co., Ltd.)</strong>은(는) 이용자가 Heritage Layer
      서비스에 만족하지 못한 경우를 위해 다음과 같은 환불 정책을 운영합니다.
    </p>

    <h2>1. 30일 환불 보장 (30-Day Money-Back Guarantee)</h2>
    <p>
      구독 결제일로부터 <strong>30일 이내</strong>에 환불을 요청하시면 전액 환불해 드립니다. 별도의 사유 소명 없이
      단순 변심에 의한 환불도 동일 기간 내에 가능합니다.
    </p>

    <h2>2. 환불 신청 방법</h2>
    <p>
      Heritage Layer의 결제는 공식 리셀러(Merchant of Record)인 <strong>Paddle.com Market Limited</strong>이
      처리합니다. 환불은 다음 두 가지 방법 중 하나로 신청하실 수 있습니다.
    </p>
    <ul>
      <li>
        <strong>Paddle 고객 포털</strong>에서 직접 신청:
        <a href="https://paddle.net" target="_blank" rel="noopener noreferrer">paddle.net</a>에 접속하여 결제 시 사용한
        이메일로 로그인 → 거래 내역에서 "Request a refund"
      </li>
      <li>
        <strong>이메일 문의</strong>: contact@thelayercorp.com으로 결제 이메일, 거래 ID, 환불 사유(선택)를 보내주시면
        영업일 기준 3일 이내에 처리해 드립니다.
      </li>
    </ul>

    <h2>3. 환불 처리 기간</h2>
    <p>
      환불이 승인되면 Paddle을 통해 결제 시 사용한 동일한 결제수단으로 환불됩니다. 카드사·은행 처리 시간에 따라
      통상 5~10영업일 내에 입금이 확인됩니다.
    </p>

    <h2>4. 갱신 결제 (Renewal) 환불</h2>
    <p>
      구독은 선택한 주기(월간/연간)에 따라 자동 갱신됩니다. 자동 갱신 결제가 발생한 경우에도, 결제일로부터 30일 이내에
      환불을 신청하시면 환불을 받으실 수 있습니다. 향후 갱신을 원치 않으시면 마이페이지의 "구독 관리"에서 언제든지
      구독을 취소하실 수 있으며, 취소 후에도 결제한 기간의 종료일까지는 서비스 이용이 유지됩니다.
    </p>

    <h2>5. 부분 환불</h2>
    <p>
      장기간 정상적으로 이용한 후 환불을 요청하는 경우, 회사는 합리적 범위에서 부분 환불을 제안할 수 있습니다. 구체적인
      금액은 이용 기간 및 상황에 따라 Paddle과 협의하여 결정됩니다.
    </p>

    <h2>6. 분쟁</h2>
    <p>
      환불 관련 분쟁은 우선적으로 Paddle의 환불 정책
      (<a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener noreferrer">paddle.com/legal/refund-policy</a>)을
      따르며, 이후 회사의 <a href="/terms">이용약관</a>에 명시된 분쟁 해결 절차를 따릅니다.
    </p>

    <h2>7. 문의</h2>
    <ul>
      <li>이메일: contact@thelayercorp.com</li>
      <li>Paddle: <a href="https://paddle.net" target="_blank" rel="noopener noreferrer">paddle.net</a></li>
    </ul>
  </LegalLayout>
);

export default Refund;
