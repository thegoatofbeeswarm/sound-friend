import { Languages } from "lucide-react";
import { LANGUAGES, useI18n, type Language } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppSettings() {
  const { language, setLanguage, t } = useI18n();
  const current = LANGUAGES.find((l) => l.value === language) ?? { value: "en" as Language, label: "English", short: "EN" };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        aria-label={`${t("nav.theme")}: ${theme === "dark" ? t("nav.dark") : t("nav.light")}`}
        title={theme === "dark" ? t("nav.light") : t("nav.dark")}
        className="icon-bubble rounded-full bg-card/60 text-muted-foreground hover:text-signal"
      >
        {theme === "dark" ? <Sun /> : <Moon />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            aria-label={t("nav.language")}
            title={t("nav.language")}
            className="icon-bubble h-9 rounded-full bg-card/60 px-3 text-xs text-muted-foreground hover:text-signal"
          >
            <Languages />
            {current.short}
          </Button>
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
