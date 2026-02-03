import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/presentation/stores/themeStore';

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <Button variant="outline" onClick={toggleTheme}>
      {theme === 'dark' ? '☀ Modo claro' : '🌙 Modo escuro'}
    </Button>
  );
}
