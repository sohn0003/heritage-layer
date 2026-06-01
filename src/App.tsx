import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/common/Navbar";
import { PaymentTestModeBanner } from "@/components/common/PaymentTestModeBanner";
import Home from "@/pages/Home";
import Properties from "@/pages/Properties";
import Analysis from "@/pages/Analysis";
import About from "@/pages/About";
import Mypage from "@/pages/Mypage";
import Pricing from "@/pages/Pricing";
import Bridge from "@/pages/Bridge";
import Contact from "@/pages/Contact";
import AdminProperties from "@/pages/admin/AdminProperties";
import AdminDealSignals from "@/pages/admin/AdminDealSignals";
import NotFound from "@/pages/NotFound";
import Terms from "@/pages/legal/Terms";
import Refund from "@/pages/legal/Refund";
import Privacy from "@/pages/legal/Privacy";
import TossCheckout from "@/pages/checkout/TossCheckout";
import TossSuccess from "@/pages/checkout/TossSuccess";
import TossFail from "@/pages/checkout/TossFail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PaymentTestModeBanner />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/about" element={<About />} />
            <Route path="/mypage" element={<Mypage />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/bridge" element={<Bridge />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin/properties" element={<AdminProperties />} />
            <Route path="/admin/signals" element={<AdminDealSignals />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/checkout/toss" element={<TossCheckout />} />
            <Route path="/checkout/toss/success" element={<TossSuccess />} />
            <Route path="/checkout/toss/fail" element={<TossFail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
