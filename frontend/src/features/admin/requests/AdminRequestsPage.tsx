import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, Loader2, FileText } from "lucide-react";
import { apiClient } from "@/api/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RequestDetailsModal } from "./RequestDetailsModal";

type DemandType = {
  id: number;
  status: string;
  created_at: string;
  role?: {
    id: number;
    name: string;
  };
  applicant?: {
    id: number;
    email: string;
    profiles?: {
      first_name: string;
      last_name: string;
    };
  };
};

export function AdminRequestsPage() {
  const { t } = useTranslation();
  const [demands, setDemands] = useState<DemandType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedDemandId, setSelectedDemandId] = useState<number | null>(null);
  const [selectedDemandData, setSelectedDemandData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDemands = async () => {
    setLoading(true);
    try {
      const statusQuery = statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const res = await apiClient.get(`/demands?limit=100${statusQuery}`);
      const list = res.data.data?.data || res.data.data || [];
      setDemands(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to fetch demands:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemands();
  }, [statusFilter]);

  const handleRowClick = async (demandId: number) => {
    try {
      const res = await apiClient.get(`/demands/${demandId}`);
      setSelectedDemandData(res.data.data);
      setSelectedDemandId(demandId);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch demand details:", error);
    }
  };

  const filteredDemands = demands.filter((demand) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name =
      `${demand.applicant?.profiles?.first_name || ""} ${demand.applicant?.profiles?.last_name || ""}`.toLowerCase();
    return (
      demand.applicant?.email.toLowerCase().includes(s) ||
      name.includes(s) ||
      (demand.role?.name || "").toLowerCase().includes(s)
    );
  });

  return (
    <DashboardLayout
      role="admin"
      title={t("admin.requestsTitle", { defaultValue: "Registration Requests" })}
      subtitle={t("admin.requestsSubtitle", {
        defaultValue: "Manage incoming partner and reviewer applications.",
      })}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.searchUsers", {
                defaultValue: "Search by email, name or role...",
              })}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t("common.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all", { defaultValue: "All" })}</SelectItem>
              <SelectItem value="pending">
                {t("admin.pending", { defaultValue: "Pending" })}
              </SelectItem>
              <SelectItem value="approved">
                {t("admin.approved", { defaultValue: "Approved" })}
              </SelectItem>
              <SelectItem value="rejected">
                {t("admin.rejected", { defaultValue: "Rejected" })}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">
                    {t("admin.applicant", { defaultValue: "Applicant" })}
                  </th>
                  <th className="px-6 py-4 font-medium">
                    {t("common.email", { defaultValue: "Email" })}
                  </th>
                  <th className="px-6 py-4 font-medium">
                    {t("admin.requestedRole", { defaultValue: "Requested Role" })}
                  </th>
                  <th className="px-6 py-4 font-medium">
                    {t("admin.submitted", { defaultValue: "Submitted" })}
                  </th>
                  <th className="px-6 py-4 font-medium">
                    {t("common.status", { defaultValue: "Status" })}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : filteredDemands.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      {t("admin.noRequests", { defaultValue: "No registration requests found." })}
                    </td>
                  </tr>
                ) : (
                  filteredDemands.map((demand) => (
                    <tr
                      key={demand.id}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => handleRowClick(demand.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="font-medium">
                            {demand.applicant?.profiles?.first_name ||
                            demand.applicant?.profiles?.last_name
                              ? `${demand.applicant.profiles.first_name || ""} ${demand.applicant.profiles.last_name || ""}`
                              : "No Name"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{demand.applicant?.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                          {demand.role?.name || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(demand.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            demand.status === "approved"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : demand.status === "rejected"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {t(`admin.${demand.status}`, { defaultValue: demand.status })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RequestDetailsModal
        demandId={selectedDemandId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        demandData={selectedDemandData}
        onStatusChange={fetchDemands}
      />
    </DashboardLayout>
  );
}
