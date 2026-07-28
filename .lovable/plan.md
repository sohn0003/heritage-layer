## 1. 차이점 분석

### Cosmo Platform UX (https://preview--cosmos-pulse-ui.lovable.app/)
- **Body 폰트 순서**: Pretendard → Space Grotesk → 시스템 폰트
  - 한글/영문/숫자 모두 Pretendard를 우선으로 렌더링
- **Display/Heading**: Space Grotesk는 큰 타이틀에만 사용
- **Heading 스타일**: `font-weight: 300`, `letter-spacing: -0.02em`
- **Body 스타일**: `letter-spacing: -0.01em`, `font-weight: 400`
- **렌더링 보정**: `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale`, `text-rendering: optimizeLegibility`
- **Mono**: JetBrains Mono
- **결과**: 전체적으로 얇고, 타이트한 글자간격, 부드러운 안티앨리어싱 느낌

### Heritage Layer (현재)
- `src/index.css`에서 body/heading에 `Space Grotesk`를 **먼저** 나열
  - 영문/숫자는 Space Grotesk로, 한글만 Pretendard 폴백
- Heading은 `font-semibold`/`font-bold` 중심, 기본 letter-spacing
- 폰트 스무딩/렌더링 보정 미적용
- Space Grotesk 300 weight는 로드하지 않음
- **결과**: 더 굵고 기하학적인(Geometric) 느낌, 상대적으로 넓고 둔탁한 텍스트

## 2. 구현 내용

- **Global font-family 조정** (`src/index.css`)
  - Body: `Pretendard Variable`, `Pretendard`, `Space Grotesk`, system-ui, sans-serif
  - Display/Heading: `Space Grotesk`, `Pretendard`, sans-serif
- **Typography 세팅**
  - `body`: `letter-spacing: -0.01em`, `font-weight: 400`
  - `h1~h6`: `font-weight: 300` (너무 얇다면 `400`), `letter-spacing: -0.02em`
  - `html/body`: `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale`, `text-rendering: optimizeLegibility`
- **Google Fonts import** (`index.html`)
  - Space Grotesk 300 weight 추가 (`wght@300;400;500;600`)
- **(선택) Mono 폰트** — JetBrains Mono 추가
- **Tailwind config** (`tailwind.config.ts`)
  - `fontFamily`에 `display` 토큰 추가, `sans`는 Pretendard 우선으로 재정의
- **검증**
  - Preview에서 `/analysis`, `/properties`, `/about`의 한글/영문/숫자 혼용 텍스트 확인
  - Heading이 너무 얇지 않은지 모바일/데스크톱에서 확인

## 3. 변경하지 않는 것
- 컬러 팔레트 (navy/gold) 및 다크 테마 유지
- Pretendard Variable 사용 유지 — 별도 static 파일 교체 없음
- 페이지별 추가 폰트 오버라이드는 하지 않음 (한 곳에서 통제)