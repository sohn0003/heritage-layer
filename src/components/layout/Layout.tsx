// Heritage Layer - Layout Wrapper
// 공통 레이아웃 래퍼 컴포넌트 (필요 시 확장)
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
};

export default Layout;
