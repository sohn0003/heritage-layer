

# Heritage Layer 플랫폼 구축 계획

## 구현 전 주요 제안사항

시작 전에 몇 가지 중요한 수정/제안 사항이 있습니다:

1. **카카오 로그인**: Lovable Cloud는 카카오 OAuth를 네이티브 지원하지 않습니다. Google 로그인 + 이메일/비밀번호로 먼저 구현하고, 카카오는 외부 Supabase 프로젝트 연결 후 별도 설정이 필요합니다.

2. **`.env` 파일 불가**: Lovable에는 .env 파일이 없습니다. 공개 API 키(Naver Maps 등)는 코드에 직접 넣거나, 비밀 키는 Lovable Secrets를 통해 관리합니다.

3. **`users` 테이블 → `profiles` 테이블**: Supabase Auth의 `auth.users`와 별도로 `profiles` 테이블을 만들어야 합니다. `subscription_tier` 등 사용자 정보를 여기에 저장합니다.

4. **관리자 역할**: 보안 가이드라인에 따라 `user_roles` 테이블을 별도로 만들어 관리자 권한을 관리합니다 (profiles에 role 저장 금지).

5. **`algorithm/` 폴더 위치**: Vite는 `src/` 외부 파일을 번들링하지 않습니다. `src/algorithm/`으로 배치하겠습니다.

6. **네이버 지도 API**: API 키가 필요합니다. 우선 정적 지도 placeholder로 구현하고, API 키 설정 후 실제 연동하겠습니다.

---

## 구현 단계

### 단계 1: 프로젝트 구조 및 라우팅 설정
- 페이지 파일 생성: Home, Properties, Analysis, About, AdminProperties
- `src/algorithm/` 하위에 빈 파일 3개 생성
- React Router에 모든 라우트 등록 (`/`, `/properties`, `/analysis`, `/about`, `/admin/properties`)
- 공통 Navbar 컴포넌트 (Heritage Layer 로고, Properties, Analysis, About, 로그인 버튼)

### 단계 2: Supabase 데이터베이스 설정
테이블 생성 (마이그레이션):
- `profiles` (id, email, name, subscription_tier, created_at) + auth.users 트리거
- `user_roles` (id, user_id, role) — admin 권한 관리용
- `assets` (요청한 스키마 그대로)
- `saved_assets`, `deal_signals`, `partner_inquiries`
- RLS 정책: assets는 is_published=true만 공개, admin_memo는 관리자만, saved_assets/deal_signals는 본인만, partner_inquiries는 INSERT 공개/SELECT 관리자만

### 단계 3: 인증 구현
- Supabase Auth (Google + 이메일/비밀번호)
- 로그인/회원가입 모달
- AuthContext로 전역 인증 상태 관리
- 관리자 라우트 보호 (user_roles 기반)

### 단계 4: Home 페이지
- Hero 섹션 (레퍼런스 이미지 스타일 참고 — 고급스러운 부동산 느낌)
- 현황 수치 카드 3개
- 서비스 소개 3단계
- 지도 티저 (정적 이미지 + CTA)
- Partners 섹션 (문의 폼 → partner_inquiries INSERT)

### 단계 5: Properties 페이지
- 좌측 지도 영역 (초기: placeholder, 이후 Naver Maps 연동)
- 우측 자산 카드 목록 (AssetCard 컴포넌트)
- 재생 등급 배지, blur 처리된 Pro 영역
- 상단 필터 (지역, 등급, 자산유형, 정부협력)
- 저장 기능 (비로그인 시 로그인 유도)

### 단계 6: Analysis 페이지
- URL 파라미터로 자산 로드
- 무료 공개 영역 (기본 정보)
- Pro 잠금 영역 4개 섹션 (blur + 오버레이, 레이아웃만)
- 딜 관심 표명 버튼, Pro 구독 버튼

### 단계 7: About 페이지
- 회사 소개, 재생 방법론 3단계, 무료/Pro 비교표
- Partners 섹션 (Home과 컴포넌트 재사용)

### 단계 8: Admin 페이지
- 관리자 전용 라우트 가드
- 매물 목록 테이블 (수정/삭제)
- 신규 매물 등록 폼

---

## 디자인 방향
레퍼런스 이미지를 참고하여 고급스럽고 모던한 부동산 플랫폼 느낌으로 구현합니다. 깔끔한 타이포그래피, 넉넉한 여백, 세련된 카드 UI를 적용합니다.

---

## 기술 세부사항

- Supabase 클라이언트: `src/lib/supabase.ts`에 초기화
- 인증 상태: React Context + `onAuthStateChange`
- Pro 잠금 UI: `backdrop-filter: blur()` + absolute overlay
- 재생 등급 배지: S(금)/A(은)/B(동)/C(회)/D(적) 색상 코딩
- Partners 문의 폼: 별도 컴포넌트로 분리하여 Home/About에서 재사용
- 관리자 확인: `has_role()` security definer 함수 사용

