import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useTranslation } from "react-i18next";

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ className, ...props }, ref) => {
    const { t } = useTranslation();
    const [show, setShow] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          className={cn("pe-10", className)}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute end-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground hover:bg-transparent"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
          aria-label={
            show
              ? t("common.hidePassword", { defaultValue: "Hide password" })
              : t("common.showPassword", { defaultValue: "Show password" })
          }
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    );
  },
);

PasswordField.displayName = "PasswordField";
