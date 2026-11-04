import { useState, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useTranslation } from "react-i18next";

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  icon?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ className, icon, ...props }, ref) => {
    const { t } = useTranslation();
    const [show, setShow] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          className={cn("pe-10", className)}
          icon={icon}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute end-0 top-0 h-full w-10 text-primary/70 hover:text-primary hover:bg-transparent"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
          aria-label={
            show
              ? t("common.hidePassword", { defaultValue: "Hide password" })
              : t("common.showPassword", { defaultValue: "Show password" })
          }
        >
          <span
            aria-hidden="true"
            className="material-icons-round text-[20px] leading-none"
          >
            {show ? "visibility_off" : "visibility"}
          </span>
        </Button>
      </div>
    );
  },
);

PasswordField.displayName = "PasswordField";
