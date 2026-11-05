import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGES } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languageNames: Record<string, string> = {
  ar: "العربية",
  en: "English",
  fr: "Français",
};

export function LanguageSwitcher({ inverted = false }: { inverted?: boolean }) {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-10 gap-1.5 rounded-full border-none px-4 text-sm font-semibold outline-none ring-0 transition-colors focus-visible:ring-1 focus-visible:ring-offset-0 ${
            inverted
              ? "text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-white/30"
              : "text-home-muted-text hover:bg-home-soft-purple hover:text-home-brand focus-visible:ring-home-muted-text/30"
          }`}
        >
          {language.toUpperCase()}
          <span
            aria-hidden="true"
            className="material-icons-round text-[18px] leading-none"
          >
            expand_more
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className="cursor-pointer"
          >
            {languageNames[lang]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
