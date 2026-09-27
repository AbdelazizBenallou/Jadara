import { cn } from "@/lib/utils";

export type PasswordStrengthLevel = "none" | "weak" | "fair" | "strong";

function getStrength(password: string): PasswordStrengthLevel {
  if (!password) return "none";
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return "weak";
  if (score <= 3) return "fair";
  return "strong";
}

const STRENGTH_CONFIG = {
  none: { width: "w-0", color: "", label: "" },
  weak: {
    width: "w-1/3",
    color: "bg-destructive",
    label: "ضعيفة",
    labelEn: "Weak",
  },
  fair: {
    width: "w-2/3",
    color: "bg-warning",
    label: "مقبولة",
    labelEn: "Fair",
  },
  strong: {
    width: "w-full",
    color: "bg-success",
    label: "قوية",
    labelEn: "Strong",
  },
} as const;

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const level = getStrength(password);
  const config = STRENGTH_CONFIG[level];

  if (level === "none") return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            config.color,
            config.width,
          )}
        />
      </div>
      <p
        className={cn(
          "text-xs font-medium",
          level === "weak" && "text-destructive",
          level === "fair" && "text-warning-foreground",
          level === "strong" && "text-success",
        )}
      >
        {config.label}
      </p>
    </div>
  );
}
