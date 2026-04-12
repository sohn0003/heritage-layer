import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import { Menu, X, LogOut } from 'lucide-react';
import logo from '@/assets/logo.svg';

const navItems = [
  { label: 'About', href: '/about' },
  { label: 'Properties', href: '/properties' },
  { label: 'Mypage', href: '/mypage' },
];

const Navbar = () => {
  const { user, signOut, isAdmin } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHeroPage = location.pathname === '/' || location.pathname === '/about';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDark = isHeroPage && !scrolled;

  const textColor = isDark ? 'text-white' : 'text-foreground';
  const textMuted = isDark ? 'text-white/70' : 'text-muted-foreground';
  const hoverStyle = 'hover:text-[1rem] hover:font-semibold transition-all duration-200';
  const activeStyle = isDark ? 'text-white font-semibold' : 'text-foreground font-semibold';
  const borderColor = isDark ? 'border-white/20' : 'border-border';

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${borderColor} ${
          isDark ? 'bg-transparent' : 'bg-background/40 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Heritage Layer" className="h-8 w-8 rounded-md object-contain" />
            <span className={`text-lg tracking-tight font-medium transition-colors duration-300 ${textColor}`}>
              Heritage Layer
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-3 py-2 text-sm font-medium ${hoverStyle} ${
                  location.pathname === item.href ? activeStyle : textMuted
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin/properties"
                className={`px-3 py-2 text-sm font-medium ${hoverStyle} ${
                  location.pathname === '/admin/properties' ? activeStyle : textMuted
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              to="/pricing"
              className={`px-3 py-2 text-sm font-medium ${hoverStyle} ${
                location.pathname === '/pricing' ? activeStyle : textMuted
              }`}
            >
              Pricing
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                <span className={`text-sm transition-colors duration-300 ${textMuted}`}>{user.email}</span>
                <Button variant="ghost" size="icon" onClick={signOut} className={`transition-colors duration-300 ${textMuted}`}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setAuthOpen(true)}
                className={`transition-colors duration-300 ${
                  isDark
                    ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                로그인
              </Button>
            )}
          </div>

          {/* Mobile toggle */}
          <button className={`md:hidden transition-colors duration-300 ${textColor}`} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className={`border-t px-4 pb-4 pt-2 md:hidden transition-colors duration-300 ${borderColor} ${
            isDark ? 'bg-black/60 backdrop-blur-md' : 'bg-background/95 backdrop-blur-md'
          }`}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`block px-3 py-2 text-sm font-medium ${textMuted} ${hoverStyle}`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin/properties" className={`block px-3 py-2 text-sm font-medium ${textMuted} ${hoverStyle}`} onClick={() => setMobileOpen(false)}>Admin</Link>
            )}
            <div className={`mt-2 border-t pt-2 ${borderColor}`}>
              {user ? (
                <Button variant="ghost" className={`w-full justify-start ${textMuted}`} onClick={() => { signOut(); setMobileOpen(false); }}>
                  <LogOut className="mr-2 h-4 w-4" /> 로그아웃
                </Button>
              ) : (
                <Button className={`w-full ${isDark ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20' : ''}`} onClick={() => { setAuthOpen(true); setMobileOpen(false); }}>로그인</Button>
              )}
            </div>
          </div>
        )}
      </nav>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
};

export default Navbar;
