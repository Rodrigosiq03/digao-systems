import { Button } from '@/components/ui/button';
import { accentActionButtonClass } from '@/presentation/components/accentActionButtonClass';
import { useThemeStore } from '@/presentation/stores/themeStore';

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const nextLabel = theme === 'dark' ? '☀ Modo claro' : '🌙 Modo escuro';

  return (
    <Button variant="ghost" onClick={toggleTheme} className={accentActionButtonClass}>
      {nextLabel}
    </Button>
  );
}
