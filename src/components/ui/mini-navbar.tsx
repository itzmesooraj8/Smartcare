import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, Menu, X } from 'lucide-react';

const AnimatedNavLink: React.FC<{ to: string; children: React.ReactNode; isOverWhiteSection?: boolean }> = ({ to, children, isOverWhiteSection }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => {
        const base = 'group relative inline-flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200';
        if (isOverWhiteSection) {
          return `${base} ${isActive ? 'text-blue-600' : 'text-blue-600/90'}`;
        }
        return `${base} ${isActive ? 'text-white' : 'text-white/90'}`;
      }}
    >
      <span className="relative block overflow-hidden h-5 leading-5">
        <span className="block transform transition-transform duration-200 group-hover:-translate-y-5">{children}</span>
        <span className="absolute left-0 top-0 block transform translate-y-5 transition-transform duration-200 group-hover:translate-y-0">{children}</span>
      </span>
    </NavLink>
  );
};

/**
 * Navbar
 * EXACT implementation as requested:
 * - Transparent glass background
 */
export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [isOverWhiteSection, setIsOverWhiteSection] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Two white zones where navbar should use blue text:
      // 1) Very top of the page (small scrollY)
      // 2) After the hero section (user scrolled past the hero)
      const topZone = 100; // within 100px of top
      const heroBoundary = Math.max(window.innerHeight - 120, 320); // approximate hero bottom

      const overWhite = window.scrollY < topZone || window.scrollY > heroBoundary;
      setIsOverWhiteSection(overWhite);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { label: 'Home', to: '/' },
    { label: 'Services', to: '/services' },
    { label: 'Doctors', to: '/doctors' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' }
  ];

  const styles = {
    // Container: 
    // - On Hero: Transparent, White border/shadow details
    // - On White: Glassy White, Blue border/shadow details
    navContainer: isOverWhiteSection
      ? 'bg-white/80 backdrop-blur-md shadow-md border-blue-200' 
      : 'bg-transparent border-white/20 shadow-none', 
    
    logoText: isOverWhiteSection ? 'text-blue-600' : 'text-white',
    logoIcon: isOverWhiteSection ? 'text-blue-600' : 'text-white',
    
    loginBtn: isOverWhiteSection
      ? 'border-blue-200 bg-blue-50/50 text-blue-600 hover:bg-blue-100'
      : 'border-white/20 bg-white/10 text-white hover:bg-white/20',
      
    signupBtn: isOverWhiteSection
      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
      : 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-black shadow-[0_8px_24px_rgba(57,224,121,0.16)]',

    mobileMenuBg: isOverWhiteSection ? 'bg-white/95 border-blue-100' : 'bg-[#0a0a0a]/95 border-white/10',
    mobileLink: isOverWhiteSection ? 'text-gray-700 hover:text-blue-600' : 'text-gray-300 hover:text-white',
    hamburger: isOverWhiteSection ? 'text-gray-700 hover:text-blue-600' : 'text-gray-300 hover:text-white'
  };

  return (
    <header className="fixed inset-x-0 top-6 z-40 flex justify-center pointer-events-none transition-all duration-500">
      <div className="pointer-events-auto w-full max-w-5xl px-4">
        <div
          className={`rounded-full border py-2 px-4 flex items-center justify-between gap-4 transition-all duration-500 ease-in-out ${styles.navContainer}`}
        >
          {/* Desktop logo (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-3 flex-1 min-w-0">
            <NavLink to="/" className="flex items-center gap-2 group">
              <Activity className={`w-6 h-6 transition-colors duration-500 ${styles.logoIcon}`} />
              <span className={`font-semibold text-lg tracking-tight transition-colors duration-500 ${styles.logoText}`}>SmartCare</span>
            </NavLink>
          </div>

          {/* Mobile centered logo (visible on mobile only) */}
          <div className="flex-1 flex md:hidden justify-center">
            <NavLink to="/" className="flex items-center gap-2">
              <Activity className={`w-6 h-6 transition-colors duration-500 ${styles.logoIcon}`} />
              <span className={`font-semibold text-base tracking-tight transition-colors duration-500 ${styles.logoText}`}>SmartCare</span>
            </NavLink>
          </div>

          {/* Links - Desktop */}
          <nav className="hidden md:flex gap-2 justify-center flex-1">
            <div className="flex items-center gap-1 bg-transparent rounded-full px-2">
              {links.map((link) => (
                <AnimatedNavLink key={link.label} to={link.to} isOverWhiteSection={isOverWhiteSection}>
                  {link.label}
                </AnimatedNavLink>
              ))}
            </div>
          </nav>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
            <NavLink
              to="/login"
              className={`px-4 py-2 rounded-full text-xs sm:text-sm border transition-all duration-500 ${styles.loginBtn}`}
            >
              Log In
            </NavLink>
            
            <div className="relative group">
               <NavLink
                to="/register"
                className={`relative inline-block px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-500 ${styles.signupBtn}`}
              >
                Sign Up
              </NavLink>
            </div>
          </div>

          {/* Mobile Hamburger (right) */}
          <div className="flex-1 flex md:hidden items-center justify-end">
            <button
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
              className={`p-2 rounded-md transition-colors duration-500 ${styles.hamburger}`}
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        <div
          className={`mx-auto mt-2 overflow-hidden rounded-xl md:hidden transition-all duration-500`}
          style={{ maxHeight: open ? 520 : 0 }}
        >
          <div className={`rounded-xl overflow-hidden shadow-lg border border-white/10 bg-white/95 backdrop-blur-md`}> 
            {/* panel header with logo + close */}
            <div className="px-4 py-3 flex items-center justify-between">
              <NavLink to="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
                <Activity className={`w-6 h-6 ${styles.logoIcon}`} />
                <span className={`font-semibold ${styles.logoText}`}>SmartCare</span>
              </NavLink>
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="p-2 rounded-md text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-4 pb-4">
              <div className="flex flex-col gap-3 py-2">
                {links.map((link) => (
                  <NavLink
                    key={link.label}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="px-3 py-3 rounded-md text-gray-800 hover:text-blue-600 transition-colors"
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4 flex gap-3">
                <NavLink
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center px-3 py-2 rounded-full border border-gray-200 text-gray-700 bg-white/60"
                >
                  Log In
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center px-3 py-2 rounded-full font-semibold bg-gradient-to-r from-emerald-400 to-cyan-500 text-black shadow-[0_8px_24px_rgba(57,224,121,0.12)]"
                >
                  Sign Up
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
