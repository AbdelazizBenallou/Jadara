import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGES } from "@/i18n";
import { ChevronDown } from "lucide-react";
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

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-sm font-medium text-home-muted-text transition-colors hover:text-home-brand hover:bg-transparent focus-visible:ring-1 focus-visible:ring-home-muted-text/30 focus-visible:ring-offset-0 outline-none border-none ring-0"
        >
          {language.toUpperCase()}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem key={lang} onClick={() => setLanguage(lang)} className="cursor-pointer">
            {languageNames[lang]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
