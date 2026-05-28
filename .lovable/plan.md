# Google 로그인 (Lovable Cloud Managed) 적용 계획

현재 프로젝트는 legacy `supabase.auth.signInWithOAuth('google')` 방식을 사용 중입니다. 이를 Lovable Cloud Managed 방식으로 마이그레이션하여, 별도 Google Cloud Console 설정 없이 고객들이 Google 계정으로 회원가입/로그인할 수 있도록 합니다.

## 작업 내용

### 1. Lovable Cloud Social Auth 활성화
- `configure_social_auth` 도구로 Google provider 활성화
- 이메일+비밀번호 로그인은 기존대로 유지 (병행)
- 자동으로 `src/integrations/lovable/` 모듈 + `@lovable.dev/cloud-auth-js` 패키지 생성/설치

### 2. 코드 마이그레이션
- Google 로그인 호출부를 `supabase.auth.signInWithOAuth(...)` → `lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin })` 로 교체
- 영향 파일: `Login.tsx`, `SignUp.tsx` 등 Google 버튼이 있는 인증 페이지 (탐색 후 정확한 경로 확인)
- 이메일/비밀번호 흐름, `AuthContext`, `onAuthStateChange`, profiles 트리거(`handle_new_user`)는 그대로 유지 → Google 신규 가입 시에도 profiles 자동 생성됨

### 3. 검증
- 로그인 페이지에서 Google 버튼 클릭 → Google 동의화면 → 콜백 후 세션 생성 확인
- 신규 Google 사용자 → `profiles` 행 자동 생성 확인
- 기존 이메일 로그인 사용자 영향 없음 확인

## 사용자가 제공할 것
**없습니다.** Lovable Cloud가 OAuth credentials를 관리하므로 Google Cloud Console 작업, Client ID/Secret 입력 모두 불필요합니다.

## 기술 메모
- Managed 방식은 커스텀 도메인(www.heritagelayer.com 포함)에서도 동작 — `redirect_uri: window.location.origin` 그대로 사용
- 추후 자체 브랜딩이 필요해지면 Cloud → Users → Authentication Settings에서 본인 Google credentials로 교체 가능 (코드 변경 없음)
