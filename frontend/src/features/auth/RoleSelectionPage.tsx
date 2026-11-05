import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { listRoles } from "@/api/roles";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/notify";
import { AuthShell } from "./AuthShell";

type RoleRoute =
  | "/register/beneficiary"
  | "/register/reviewer"
  | "/register/company"
  | "/register/organization";

type RoleMeta = {
  icon: string;
  to: RoleRoute;
  labelKey: string;
  descKey: string;
};

const ROLE_META: Record<string, RoleMeta> = {
  beneficiary: {
    icon: "person",
    to: "/register/beneficiary",
    labelKey: "roles.beneficiary",
    descKey: "auth.roleBenDesc",
  },
  reviewer: {
    icon: "verified_user",
    to: "/register/reviewer",
    labelKey: "roles.reviewer",
    descKey: "auth.roleRevDesc",
  },
  company: {
    icon: "business",
    to: "/register/company",
    labelKey: "roles.company",
    descKey: "auth.roleCompDesc",
  },
  organization: {
    icon: "volunteer_activism",
    to: "/register/organization",
    labelKey: "roles.organization",
    descKey: "auth.roleOrgDesc",
  },
};

function RoleButton({
  name,
  label,
  description,
  icon,
  to,
  isRtl,
}: {
  name: string;
  label: string;
  description: string;
  icon: string;
  to?: RoleRoute;
  isRtl: boolean;
}) {
  const content = (
    <>
      <span
        aria-hidden="true"
        className="material-icons-round shrink-0 text-[26px] leading-none text-primary"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-start">
        <span className="block text-sm font-semibold text-foreground">
          {label}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="material-icons-round shrink-0 text-[18px] leading-none text-primary/60 transition-colors group-hover:text-primary"
      >
        {isRtl ? "chevron_left" : "chevron_right"}
      </span>
    </>
  );

  const className =
    "group flex items-center gap-4 rounded-xl border border-border bg-transparent px-4 py-3.5 text-start transition-colors hover:border-primary/45 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  if (!to) {
    return (
      <div
        key={name}
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-4 rounded-xl border border-border bg-transparent px-4 py-3.5 opacity-60"
      >
        {content}
      </div>
    );
  }

  return (
    <Link key={name} to={to} className={className}>
      {content}
    </Link>
  );
}

export function RoleSelectionPage() {
  const { t } = useTranslation();
  const { direction } = useLanguage();
  const rolesQuery = useQuery({
    queryKey: queryKeys.roles.all,
    queryFn: listRoles,
    staleTime: 5 * 60 * 1000,
  });

  const roles = rolesQuery.data ?? [];

  return (
    <AuthShell
      title={t("auth.selectRoleTitle", { defaultValue: "Choose your role" })}
      subtitle={t("auth.selectRoleSubtitle", {
        defaultValue: "Select how you want to use JADARA",
      })}
    >
      <div className="mt-2 flex flex-col gap-3">
        {rolesQuery.isLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse items-center gap-4 rounded-xl border border-border bg-transparent px-4 py-3.5"
            >
              <span className="h-11 w-11 shrink-0 rounded-lg bg-muted" />
              <span className="flex-1 space-y-2">
                <span className="block h-3.5 w-28 rounded bg-muted" />
                <span className="block h-3 w-48 max-w-full rounded bg-muted/70" />
              </span>
            </div>
          ))}

        {rolesQuery.isError && (
          <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-4 text-sm">
            <p className="font-medium text-foreground">
              {t("auth.rolesLoadError", {
                defaultValue: "Unable to load roles",
              })}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {getErrorMessage(rolesQuery.error, "auth.rolesLoadError")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => rolesQuery.refetch()}
              disabled={rolesQuery.isFetching}
            >
              {t("common.retry", { defaultValue: "Retry" })}
            </Button>
          </div>
        )}

        {!rolesQuery.isLoading && !rolesQuery.isError && roles.length === 0 && (
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            {t("auth.rolesEmpty", {
              defaultValue: "No registration roles are available right now.",
            })}
          </div>
        )}

        {!rolesQuery.isLoading &&
          !rolesQuery.isError &&
          roles.map((role) => {
            const key = role.name.toLowerCase();
            const meta = ROLE_META[key];

            return (
              <RoleButton
                key={role.id}
                name={role.name}
                label={meta ? t(meta.labelKey) : role.name}
                description={
                  meta
                    ? t(meta.descKey)
                    : t("auth.roleUnavailableDesc", {
                        defaultValue:
                          "Registration for this role is not available yet.",
                      })
                }
                icon={meta?.icon ?? "groups"}
                to={meta?.to}
                isRtl={direction === "rtl"}
              />
            );
          })}
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        {t("auth.haveAccount", { defaultValue: "Already have an account?" })}{" "}
        <Link to="/login" className="font-bold text-primary hover:underline">
          {t("auth.loginBtn", { defaultValue: "Log in" })}
        </Link>
      </div>
    </AuthShell>
  );
}
