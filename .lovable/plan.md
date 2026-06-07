## 변경 내용 (src/pages/Analysis.tsx)

세부 항목 점수 섹션에서 Accordion 기반 드롭다운을 제거하고, 각 행 우측 끝에 정보(i) 아이콘 버튼을 배치합니다. 아이콘 클릭 시 Popover로 안내 문구를 표시합니다.

### 구체 작업
1. import 정리
   - `Accordion`, `AccordionContent`, `AccordionItem`, `AccordionTrigger` 제거
   - `Popover, PopoverTrigger, PopoverContent` (`@/components/ui/popover`) 추가
   - `lucide-react`의 `Info` 아이콘 추가

2. 안내 문구 ("각 항목을 클릭하면 산출 기준과 의미가 표시됩니다.") 문구를 "각 항목의 i 아이콘을 클릭하면 산출 기준과 의미가 표시됩니다." 로 수정

3. `.map((row) => ...)` 렌더링 구조를 다음과 같이 변경
   - 외곽: `div` 행 (border-b, py-3, flex items-center justify-between)
   - 좌측: 라벨 + 값 (기존과 동일)
   - 중앙/우측: short 설명 텍스트 (기존과 동일, hidden sm:inline)
   - 우측 끝: `Popover` — Trigger는 `Info` 아이콘 버튼 (h-4 w-4, text-muted-foreground hover:text-foreground), Content에 `row.desc` 를 `whitespace-pre-line text-sm leading-relaxed` 로 표시 (max-w-sm)

4. 화살표(ChevronDown) 관련 동작/스타일 제거 — Accordion 제거로 자연스럽게 사라짐

### 손대지 않는 것
- 데이터(row 배열 자체)·점수 계산 로직
- Pro 락(ProLockOverlay) 처리
- 다른 섹션 UI

빌드 검증으로 마무리합니다.