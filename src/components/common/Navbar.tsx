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
  { label: 'Solution', href: '/bridge' },
  { label: 'Contact', href: '/contact' },
];

const Navbar = () => {
  const { user, signOut, isAdmin } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
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
            {user ? (
              <>
                <Link
                  to="/mypage"
                  className={`text-sm font-light tracking-wide transition-colors ${textMuted} hover:${textColor}`}
                  title="마이페이지로 이동"
                >
                  {user.email}
                </Link>
                <button
                  onClick={signOut}
                  className={`text-sm font-light tracking-wide transition-colors ${textMuted} hover:${textColor}`}
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className={`text-sm font-light tracking-wide transition-colors ${textMuted} hover:${textColor}`}
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile right side — Login + menu toggle */}
          <div className="flex items-center gap-4 md:hidden">
            {user ? (
              <button
                onClick={signOut}
                className={`text-sm font-light tracking-wide transition-colors ${textMuted}`}
              >
                Logout
              </button>
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

        {/* Mobile menu */}
        {mobileOpen && (
          <div className={`px-6 pb-6 pt-2 md:hidden transition-colors duration-300 ${
            isDark ? 'bg-black/60 backdrop-blur-md' : 'bg-background/95 backdrop-blur-md'
          }`}>
            <div className="flex flex-col items-end gap-4">
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
              {isAdmin && (
                <Link
                  to="/admin/properties"
                  className={`text-sm font-light tracking-wide ${textMuted}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Admin
                </Link>
              )}
              {user && (
                <Link
                  to="/mypage"
                  className={`text-sm font-light tracking-wide ${textMuted}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {user.email}
                </Link>
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
