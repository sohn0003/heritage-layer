import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/common/Navbar";
import Properties from "@/pages/Properties";
import PropertiesAsHome from "@/pages/Properties";
import Properties from "@/pages/Properties";
import Analysis from "@/pages/Analysis";
import About from "@/pages/About";
import Mypage from "@/pages/Mypage";
import Bridge from "@/pages/Bridge";
import Contact from "@/pages/Contact";
// 관리자 페이지는 알고리즘 코드를 사용하므로 lazy-load하여 공개 번들에서 분리합니다.
const AdminProperties = lazy(() => import("@/pages/admin/AdminProperties"));
const AdminDealSignals = lazy(() => import("@/pages/admin/AdminDealSignals"));
import NotFound from "@/pages/NotFound";
import Terms from "@/pages/legal/Terms";
import Privacy from "@/pages/legal/Privacy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/about" element={<About />} />
            <Route path="/mypage" element={<Mypage />} />
            <Route path="/bridge" element={<Bridge />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin/properties" element={<Suspense fallback={<div className="p-8 text-muted-foreground">로딩 중...</div>}><AdminProperties /></Suspense>} />
            <Route path="/admin/signals" element={<Suspense fallback={<div className="p-8 text-muted-foreground">로딩 중...</div>}><AdminDealSignals /></Suspense>} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
