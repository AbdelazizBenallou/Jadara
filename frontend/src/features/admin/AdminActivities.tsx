import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Search,
  Check,
  X,
  Eye,
  Trash2,
  Building2,
  Layers,
  MapPin,
  Clock,
  Loader2,
  Filter,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/utils/formatDate";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  approveActivity,
  deleteActivity,
  getActivity,
  listActivitiesAdmin,
  rejectActivity,
  type Activity,
} from "@/api/activities";

export function AdminActivities() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>("pending_review");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Activity | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "activities", { status, search }],
    queryFn: () =>
      listActivitiesAdmin({
        status: status === "all" ? undefined : status,
        q: search || undefined,
        limit: 50,
      }),
  });

  const items = data?.items || [];

  const approveMut = useMutation({
    mutationFn: (id: number) => approveActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "activities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
      notifySuccess(t("common.success", { defaultValue: "Activity approved successfully" }));
    },
    onError: (err) => notifyError(err),
  });

  const rejectMut = useMutation({
    mutationFn: (id: number) => rejectActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "activities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
      notifySuccess(t("common.success", { defaultValue: "Activity rejected" }));
    },
    onError: (err) => notifyError(err),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "activities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
      notifySuccess(t("common.success", { defaultValue: "Activity deleted successfully" }));
    },
    onError: (err) => notifyError(err),
  });

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t("common.all", { defaultValue: "All Statuses" }) },
      { value: "pending_review", label: t("admin.pendingReview", { defaultValue: "Pending Review" }) },
      { value: "published", label: t("admin.published", { defaultValue: "Published" }) },
      { value: "rejected", label: t("admin.rejected", { defaultValue: "Rejected" }) },
      { value: "ongoing", label: t("admin.ongoing", { defaultValue: "Ongoing" }) },
      { value: "completed", label: t("admin.completed", { defaultValue: "Completed" }) },
      { value: "cancelled", label: t("admin.cancelled", { defaultValue: "Cancelled" }) },
    ],
    [t],
  );

  return (
    <DashboardLayout
      role="admin"
      title={t("admin.activitiesTitle", { defaultValue: "Activities & Events" })}
      subtitle={t("admin.activitiesSubtitle", {
        defaultValue: "Moderate, validate, and manage volunteering and training activities",
      })}
    >
      <div className="space-y-6">
        {/* Modern Filter Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute top-1/2 ltr:left-3 rtl:right-3 h-4 w-4 -translate-y-1/2 text-[#6C757D]" />
              <Input
                placeholder={t("common.search", { defaultValue: "Search activities or location..." })}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rtl:pr-9 rtl:pl-3 bg-white border-[#E9ECEF] focus-visible:border-[#0D6EFD]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-[#6C757D] hidden sm:inline" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 w-full sm:w-48 rounded-md border border-[#E9ECEF] bg-white px-3 py-1.5 text-xs font-semibold text-[#212529] shadow-xs outline-none focus:border-[#0D6EFD]"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6C757D]">
              Results: <strong className="text-[#212529]">{items.length}</strong>
            </span>
          </div>
        </div>

        {/* Activities Table inside AdminCard */}
        <AdminCard
          title={
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#0D6EFD]" />
              <span>{t("admin.activitiesList", { defaultValue: "Activities List" })}</span>
              <span className="rounded-full bg-[#0D6EFD] px-2 py-0.5 text-[11px] font-bold text-white ms-1">
                {items.length}
              </span>
            </div>
          }
          subtitle="All submitted volunteering activities across partner organizations"
          collapsible
          maximizable
          bodyClassName="p-0 overflow-x-auto"
        >
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th>{t("admin.activity", { defaultValue: "Activity" })}</th>
                <th>{t("admin.organization", { defaultValue: "Organization" })}</th>
                <th>{t("admin.category", { defaultValue: "Category" })}</th>
                <th>{t("common.date", { defaultValue: "Dates" })}</th>
                <th>{t("common.status", { defaultValue: "Status" })}</th>
                <th className="text-end">{t("common.actions", { defaultValue: "Actions" })}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0D6EFD]" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table-empty">
                    {t("admin.noActivities", { defaultValue: "No activities found matching criteria." })}
                  </td>
                </tr>
              ) : (
                items.map((activity) => (
                  <tr key={activity.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {/* Crisp icon without light background */}
                        <Calendar className="h-4 w-4 shrink-0 text-[#0D6EFD]" />
                        <div className="min-w-0">
                          <p className="font-bold text-[#212529] truncate max-w-xs">
                            {activity.title}
                          </p>
                          {activity.location && (
                            <p className="text-xs text-[#6C757D] flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-[#DC3545]" />
                              <span>{activity.location}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-[#28A745] shrink-0" />
                        <span className="font-semibold text-xs text-[#212529]">
                          {activity.organization?.name || "-"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-[#7135E8] shrink-0" />
                        <span className="rounded bg-[#F8F9FA] border border-[#DEE2E6] px-2 py-0.5 text-xs font-semibold text-[#212529]">
                          {activity.category?.name || "General"}
                        </span>
                      </div>
                    </td>
                    <td className="text-xs text-[#6C757D]">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#6C757D]" />
                        <span>
                          {activity.start_date ? formatDate(activity.start_date) : "-"}
                          {activity.end_date ? ` - ${formatDate(activity.end_date)}` : ""}
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={activity.status || "pending"} />
                    </td>
                    <td className="text-end">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {activity.status === "pending_review" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => approveMut.mutate(activity.id)}
                              disabled={approveMut.isPending}
                              className="h-8 bg-[#28A745] text-white hover:bg-[#218838] gap-1 text-xs font-semibold"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">
                                {t("admin.approve", { defaultValue: "Approve" })}
                              </span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectMut.mutate(activity.id)}
                              disabled={rejectMut.isPending}
                              className="h-8 bg-[#DC3545] text-white hover:bg-[#c82333] gap-1 text-xs font-semibold"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">
                                {t("admin.reject", { defaultValue: "Reject" })}
                              </span>
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const full = await getActivity(activity.id);
                              setSelected(full);
                            } catch {
                              setSelected(activity);
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
                            if (confirm(t("common.confirmDelete", { defaultValue: "Delete this activity?" }))) {
                              deleteMut.mutate(activity.id);
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
                  <Calendar className="h-4 w-4 text-[#0D6EFD]" />
                  <h3>{selected.title}</h3>
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
                    <span className="text-[#6C757D] block mb-0.5">Organization:</span>
                    <strong className="text-[#212529]">
                      {(selected as any).organization?.name || "-"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#6C757D] block mb-0.5">Category:</span>
                    <strong className="text-[#212529]">
                      {(selected as any).category?.name || "General"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#6C757D] block mb-0.5">Status:</span>
                    <StatusBadge status={selected.status || "pending"} />
                  </div>
                  {selected.location && (
                    <div>
                      <span className="text-[#6C757D] block mb-0.5">Location:</span>
                      <strong className="text-[#212529]">{selected.location}</strong>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#E9ECEF] pt-3">
                  <span className="text-xs font-bold text-[#212529] block mb-1">
                    {t("common.description", { defaultValue: "Description" })}
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
