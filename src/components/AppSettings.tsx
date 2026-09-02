import { Languages, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { LANGUAGES, useI18n, type Language } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppSettings() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const current = LANGUAGES.find((l) => l.value === language) ?? LANGUAGES[0];

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`${t("nav.theme")}: ${theme === "dark" ? t("nav.dark") : t("nav.light")}`}
        title={theme === "dark" ? t("nav.light") : t("nav.dark")}
        className="icon-bubble inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/60 text-muted-foreground hover:text-signal"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("nav.language")}
            title={t("nav.language")}
            className="icon-bubble inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 text-xs text-muted-foreground hover:text-signal"
          >
            <Languages className="h-4 w-4" />
            {current.short}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {LANGUAGES.map((l) => (
            <DropdownMenuItem
              key={l.value}
              onSelect={() => setLanguage(l.value as Language)}
              className={l.value === language ? "font-semibold text-signal" : undefined}
            >
              {l.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
