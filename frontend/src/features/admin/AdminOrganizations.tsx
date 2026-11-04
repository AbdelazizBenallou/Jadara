import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Search,
  Eye,
  Trash2,
  Mail,
  MapPin,
  Calendar,
  Loader2,
  X,
  Globe,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/utils/formatDate";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  deleteOrganization,
  getOrganization,
  listOrganizations,
  type Organization,
} from "@/api/organizations";

export function AdminOrganizations() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Organization | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "organizations", search],
    queryFn: () => listOrganizations({ q: search || undefined, limit: 50 }),
  });

  const items = data?.items || [];

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
      notifySuccess(t("common.success", { defaultValue: "Organization deleted successfully" }));
    },
    onError: (err) => notifyError(err),
  });

  return (
    <DashboardLayout
      role="admin"
      title={t("admin.organizationsTitle", { defaultValue: "Organizations" })}
      subtitle={t("admin.organizationsSubtitle", {
        defaultValue: "Manage registered companies, NGOs, and partner institutions",
      })}
    >
      <div className="space-y-6">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute top-1/2 ltr:left-3 rtl:right-3 h-4 w-4 -translate-y-1/2 text-[#6C757D]" />
            <Input
              placeholder={t("common.search", { defaultValue: "Search by organization name or email..." })}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rtl:pr-9 rtl:pl-3 bg-white border-[#E9ECEF] focus-visible:border-[#0D6EFD]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6C757D]">
              Total: <strong className="text-[#212529]">{items.length}</strong>
            </span>
          </div>
        </div>

        {/* Organizations Table inside AdminCard */}
        <AdminCard
          title={
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#28A745]" />
              <span>{t("admin.organizationsList", { defaultValue: "Registered Organizations" })}</span>
              <span className="rounded-full bg-[#28A745] px-2 py-0.5 text-[11px] font-bold text-white ms-1">
                {items.length}
              </span>
            </div>
          }
          subtitle="Enterprise partners and verified institutions"
          collapsible
          maximizable
          bodyClassName="p-0 overflow-x-auto"
        >
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th>{t("admin.organization", { defaultValue: "Organization" })}</th>
                <th>{t("common.email", { defaultValue: "Contact Email" })}</th>
                <th>{t("admin.location", { defaultValue: "Location" })}</th>
                <th>{t("common.date", { defaultValue: "Registered" })}</th>
                <th className="text-end">{t("common.actions", { defaultValue: "Actions" })}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0D6EFD]" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    {t("admin.noOrganizations", { defaultValue: "No organizations found." })}
                  </td>
                </tr>
              ) : (
                items.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {/* Crisp icon without light background */}
                        <Building2 className="h-4 w-4 shrink-0 text-[#28A745]" />
                        <span className="font-bold text-[#212529]">
                          {org.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-[#6C757D]">
                        <Mail className="h-3.5 w-3.5 text-[#6C757D] shrink-0" />
                        <span>{(org as any).email || org.contact_email || "-"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-[#6C757D]">
                        <MapPin className="h-3.5 w-3.5 text-[#DC3545] shrink-0" />
                        <span>{(org as any).location || org.address || "-"}</span>
                      </div>
                    </td>
                    <td className="text-xs text-[#6C757D]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#6C757D] shrink-0" />
                        <span>{org.created_at ? formatDate(org.created_at) : "-"}</span>
                      </div>
                    </td>
                    <td className="text-end">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const full = await getOrganization(org.id);
                              setSelected(full);
                            } catch {
                              setSelected(org);
                            }
                          }}
                          className="h-8 border-[#DEE2E6] text-xs font-semibold hover:border-[#0D6EFD] hover:text-[#0D6EFD] gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{t("common.view", { defaultValue: "View" })}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(t("common.confirmDelete", { defaultValue: `Delete organization "${org.name}"?` }))) {
                              deleteMut.mutate(org.id);
                            }
                          }}
                          disabled={deleteMut.isPending}
                          className="h-8 text-[#DC3545] hover:bg-[#DC3545] hover:text-white transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </AdminCard>

        {/* ── Details Modal ────────────────────────────────────── */}
        {selected && (
          <div
            className="admin-modal-backdrop"
            onClick={() => setSelected(null)}
          >
            <div
              className="admin-modal max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-head">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#28A745]" />
                  <h3>{selected.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="admin-modal-body space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#6C757D] block mb-0.5">Contact Email:</span>
                    <strong className="text-[#212529]">
                      {(selected as any).email || selected.contact_email || "-"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#6C757D] block mb-0.5">Location:</span>
                    <strong className="text-[#212529]">
                      {(selected as any).location || selected.address || "-"}
                    </strong>
                  </div>
                  {selected.website && (
                    <div className="col-span-2">
                      <span className="text-[#6C757D] block mb-0.5">Website:</span>
                      <a
                        href={selected.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0D6EFD] hover:underline font-semibold"
                      >
                        {selected.website}
                      </a>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#E9ECEF] pt-3">
                  <span className="text-xs font-bold text-[#212529] block mb-1">
                    {t("common.description", { defaultValue: "About Organization" })}
                  </span>
                  <p className="text-xs text-[#6C757D] whitespace-pre-wrap leading-relaxed rounded bg-[#F8F9FA] p-3 border border-[#E9ECEF]">
                    {selected.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="admin-modal-foot">
                <Button
                  variant="outline"
                  onClick={() => setSelected(null)}
                  className="border-[#DEE2E6]"
                >
                  {t("common.close", { defaultValue: "Close" })}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
