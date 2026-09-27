import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/unsupported")({
  component: UnsupportedPage,
});

function UnsupportedPage() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-900/50">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-500">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t("common.unsupportedRole", { defaultValue: "Access Unavailable" })}
        </h1>

        <p className="mb-8 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {t("common.unsupportedRoleDesc", {
            defaultValue:
              "The features for your role are not currently available in this version of the platform. Please check back later or contact support if you believe this is an error.",
          })}
        </p>

        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate({ to: "/" })} className="w-full h-11">
            <ArrowLeft className="mr-2 h-4 w-4 rtl:rotate-180 rtl:mr-0 rtl:ml-2" />
            {t("common.returnToHome", { defaultValue: "Return to Home" })}
          </Button>

          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              navigate({ to: "/login" });
            }}
            className="w-full h-11"
          >
            {t("nav.logout")}
          </Button>
        </div>
      </div>
    </div>
  );
}
