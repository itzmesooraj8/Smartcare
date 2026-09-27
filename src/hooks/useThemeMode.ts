import { useEffect, useState } from 'react';

type ThemeMode = 'dark' | 'light';

const prefersDark = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

const resolveIsDark = () => {
  if (typeof document === 'undefined') {
    return false;
  }

  const classList = document.documentElement.classList;
  if (classList.contains('dark')) {
    return true;
  }

  if (classList.contains('light')) {
    return false;
  }

  return prefersDark();
};

export function useThemeMode() {
  const [isDark, setIsDark] = useState<boolean>(() => resolveIsDark());

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      setIsDark(resolveIsDark());
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    mediaQuery.addEventListener('change', updateTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, []);

  return {
    isDark,
    mode: (isDark ? 'dark' : 'light') as ThemeMode,
  };
}
