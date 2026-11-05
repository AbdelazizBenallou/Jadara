import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getMyReviewDomains } from "@/api/reviews";
import { queryKeys } from "@/lib/query-keys";
import { notifyError } from "@/lib/notify";
import { Briefcase, Loader2, AlertCircle } from "lucide-react";

export default function AssignedDomains() {
  const { t } = useTranslation();

  const domainsQuery = useQuery({
    queryKey: queryKeys.reviews.domains,
    queryFn: getMyReviewDomains,
  });
  const domains = domainsQuery.data ?? [];
  const loading = domainsQuery.isLoading;

  useEffect(() => {
    if (domainsQuery.error) {
      notifyError(domainsQuery.error, "reviewer.fetchDomainsError");
    }
  }, [domainsQuery.error]);

  return (
    <DashboardLayout
      role="reviewer"
      title={t("reviewer.assignedDomains", { defaultValue: "Assigned Domains" })}
      backLink="/reviewer"
    >
      <div className="space-y-6">
        <div className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl font-display flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            {t("reviewer.assignedDomains", { defaultValue: "Assigned Domains" })}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("reviewer.domainsSub", {
              defaultValue: "You are authorized to review projects in these domains.",
            })}
          </p>
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          {loading ? (
            <div className="px-6 py-16 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : domains.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">
                {t("reviewer.noDomains", { defaultValue: "No domains assigned" })}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("reviewer.noDomainsDesc", {
                  defaultValue: "Please contact an administrator if you believe this is a mistake.",
                })}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex flex-col rounded-xl border border-border p-4 transition-all hover:border-primary/50 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{domain.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("reviewer.domainID", { defaultValue: "Domain ID" })}: {domain.id}
                      </p>
                    </div>
                  </div>
                  {domain.description && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                      {domain.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
