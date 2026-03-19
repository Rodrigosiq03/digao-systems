import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/presentation/stores/themeStore';

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const nextLabel = theme === 'dark' ? '☀ Modo claro' : '🌙 Modo escuro';
  const paletteClass =
    theme === 'dark'
      ? 'border border-[#c7a65a]/35 bg-[linear-gradient(135deg,rgba(199,166,90,0.14),rgba(84,120,180,0.12))] text-[#f2e7c7] hover:bg-[linear-gradient(135deg,rgba(199,166,90,0.2),rgba(84,120,180,0.16))]'
      : 'border border-[rgba(43,58,85,0.16)] bg-white/88 text-[#1e2a3d] hover:bg-white';

  return (
    <Button variant="ghost" onClick={toggleTheme} className={paletteClass}>
      {nextLabel}
    </Button>
  );
}
