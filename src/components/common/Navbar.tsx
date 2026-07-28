import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import ContactPanel from './ContactPanel';
import { Menu, X } from 'lucide-react';
import logo from '@/assets/logo.svg';

const navItems = [
  { label: 'About', href: '/about' },
  { label: 'Properties', href: '/properties' },
  { label: 'Solution', href: '/bridge' },
];

const Navbar = () => {
  const { user, isAdmin } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHeroPage = location.pathname === '/about';
  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDark = isHeroPage && !scrolled;

  const textColor = isDark ? 'text-white' : 'text-foreground';
  const textMuted = isDark ? 'text-white/70' : 'text-muted-foreground';
  const hoverStyle = 'relative after:content-[""] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left ' + (isDark ? 'after:bg-white' : 'after:bg-foreground');
  const activeStyle = (isDark ? 'text-white' : 'text-foreground') + ' after:scale-x-100 after:origin-bottom-left';
  const borderColor = isDark ? 'border-white/20' : 'border-border';

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isAdminPage
            ? 'bg-background/95 backdrop-blur-lg'
            : isDark
            ? 'bg-transparent'
            : 'bg-background/40 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Heritage Layer" className="h-7 w-7 rounded-md object-contain" />
            <span className={`text-base font-semibold tracking-tight transition-colors duration-300 ${textColor}`}>
              Heritage Layer
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-light tracking-wide transition-colors ${
                  location.pathname === item.href ? textColor : textMuted
                } hover:${textColor}`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin/properties"
                className={`text-sm font-light tracking-wide transition-colors ${
                  location.pathname === '/admin/properties' ? textColor : textMuted
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <button
              onClick={() => setContactOpen(true)}
              className="bg-white px-5 py-2 text-sm font-light tracking-wide text-neutral-900 transition-opacity hover:opacity-85"
            >
              문의하기
            </button>
            {user ? (
              <Link to="/mypage" aria-label="Mypage" className={`transition-colors ${textMuted} hover:${textColor}`}>
                <User className="h-5 w-5" strokeWidth={1.5} />
              </Link>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                aria-label="Login"
                className={`transition-colors ${textMuted} hover:${textColor}`}
              >
                <User className="h-5 w-5" strokeWidth={1.5} />
              </button>
            )}
          </div>



          {/* Mobile right side */}
          <div className="flex items-center gap-3 md:hidden">
            {user ? (
              <Link
                to="/mypage"
                className={`text-sm font-light tracking-wide transition-colors ${textMuted}`}
              >
                Mypage
              </Link>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className={`text-sm font-light tracking-wide transition-colors ${textMuted}`}
              >
                Login
              </button>
            )}
            <button
              className={`transition-colors duration-300 ${textColor}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu — 애니메이션 슬라이드 다운 */}
        <div
          className={`overflow-hidden md:hidden transition-[max-height,opacity] duration-200 ease-out ${
            mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          } ${isDark ? 'bg-black/70 backdrop-blur-md' : 'bg-background/95 backdrop-blur-md'}`}
        >
          <div className="flex flex-col items-end gap-4 px-6 pb-6 pt-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-light tracking-wide ${
                  location.pathname === item.href ? textColor : textMuted
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button
              className={`text-sm font-light tracking-wide ${textMuted}`}
              onClick={() => { setMobileOpen(false); setContactOpen(true); }}
            >
              문의하기
            </button>
            {isAdmin && (
              <Link
                to="/admin/properties"
                className={`text-sm font-light tracking-wide ${textMuted}`}
                onClick={() => setMobileOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>
        </div>

      </nav>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <ContactPanel open={contactOpen} onOpenChange={setContactOpen} />

    </>
  );
};

export default Navbar;
