
-- 1) 공개 뷰: 익명/로그인 사용자 SELECT 가능
GRANT SELECT ON public.assets_public TO anon, authenticated;
GRANT SELECT ON public.assets_public TO service_role;

-- 2) 원본 테이블: GRANT 부재로 인한 PostgREST 권한 오류 방지
--    실제 행 접근은 기존 RLS(관리자 전용)가 그대로 통제합니다.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT ALL ON public.assets TO service_role;
