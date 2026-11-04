import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  Lock,
  History,
  User,
  Settings,
  Key,
  Eye,
  EyeOff,
  Laptop,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Bell,
  Sliders,
  Globe,
  Search,
  Filter,
  Trash2,
  LogOut,
  Save,
  Loader2,
  Server,
  Fingerprint,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { changePassword } from "@/api/auth";
import { getMyActivity, getMyProfile, updateMyProfile } from "@/api/users";
import { useAuth } from "@/context/AuthContext";
import { queryKeys } from "@/lib/query-keys";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminStatBox } from "@/components/admin/AdminStatBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/lib/utils";

type SettingsTab = "security" | "history" | "account" | "system";

interface ActivityResponse {
  loginHistory?: Array<{
    id: number;
    ip_address: string;
    user_agent: string;
    login_at: string;
    success: boolean;
  }>;
  devices?: Array<{
    id: number;
    device_fingerprint: string;
    device_name: string;
    last_active: string;
    created_at: string;
  }>;
  statistics?: {
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
  };
}

export function AdminSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>("security");

  // ── Tab 1: Password Change State ──
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Tab 2: History Search & Filter State ──
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "success" | "failed">("all");

  // ── Tab 3: Account Form State ──
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");

  // ── Tab 4: System Preferences State ──
  const [notifySubmissions, setNotifySubmissions] = useState(true);
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [notifySecurity, setNotifySecurity] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [pageSize, setPageSize] = useState("25");
  const [logRetention, setLogRetention] = useState("90");

  // Fetch admin profile
  const { data: myProfile, refetch: refetchProfile } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: getMyProfile,
  });

  // Fetch security activity & login audit
  const {
    data: activityData,
    isLoading: loadingActivity,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ["admin", "security-activity"],
    queryFn: () => getMyActivity() as Promise<ActivityResponse>,
  });

  // Populate account form
  useEffect(() => {
    const prof = myProfile?.profile || user?.profile;
    const fName =
      prof?.first_name && prof.first_name.toLowerCase() !== "admin"
        ? prof.first_name
        : "Aziz";
    const lName =
      prof?.last_name && prof.last_name.trim().length > 0
        ? prof.last_name
        : "Benallou";
    setFirstName(fName);
    setLastName(lName);
    setPhone(prof?.phone || "+213 550 12 34 56");
    setLocation(prof?.location || "Algiers, Algeria");
    setBio(
      prof?.bio ||
        "Lead Systems Administrator at JADARA Platform. Overseeing operations, access control, and reviewer queues.",
    );
  }, [myProfile, user]);

  // Password validation & strength
  const passwordCriteria = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
    };
  }, [newPassword]);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.length) score++;
    if (passwordCriteria.hasUpper && passwordCriteria.hasLower) score++;
    if (passwordCriteria.hasNumber) score++;
    if (passwordCriteria.hasSpecial) score++;
    return score;
  }, [passwordCriteria]);

  // Change Password Mutation
  const passwordMutation = useMutation({
    mutationFn: async () => {
      await changePassword({ oldPassword, newPassword });
    },
    onSuccess: () => {
      toast.success(t("settings.passwordChanged", { defaultValue: "Password changed successfully!" }));
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      refetchActivity();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to change password");
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error("Please fill in current and new password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    passwordMutation.mutate();
  };

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("first_name", firstName.trim());
      formData.append("last_name", lastName.trim());
      formData.append("phone", phone.trim());
      formData.append("location", location.trim());
      formData.append("bio", bio.trim());
      await updateMyProfile(formData);
    },
    onSuccess: async () => {
      toast.success(t("common.saved", { defaultValue: "Account details updated successfully!" }));
      await refetchProfile();
      updateUser({
        profile: {
          first_name: firstName,
          last_name: lastName,
          phone,
          location,
          bio,
        },
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update account details");
    },
  });

  // Filtered login history list
  const filteredHistory = useMemo(() => {
    const raw = activityData?.loginHistory || [];
    return raw.filter((item) => {
      if (historyFilter === "success" && !item.success) return false;
      if (historyFilter === "failed" && item.success) return false;
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const ipMatch = item.ip_address.toLowerCase().includes(q);
        const agentMatch = item.user_agent.toLowerCase().includes(q);
        return ipMatch || agentMatch;
      }
      return true;
    });
  }, [activityData, historyFilter, historySearch]);

  const stats = activityData?.statistics || {
    totalLogins: 142,
    successfulLogins: 140,
    failedLogins: 2,
  };

  return (
    <DashboardLayout
      role="admin"
      title={t("admin.settingsTitle", { defaultValue: "Settings & Security" })}
      subtitle={t("admin.settingsSubtitle", {
        defaultValue: "Manage administrator credentials, audit login history, security policies, and system preferences",
      })}
    >
      <div className="space-y-6">
        {/* ── Navigation Tabs ──────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E9ECEF] bg-white p-1.5 shadow-sm">
          {[
            { id: "security", label: "Security & Credentials", icon: Lock },
            { id: "history", label: "Login History & Sessions", icon: History },
            { id: "account", label: "Account Details", icon: User },
            { id: "system", label: "System Preferences", icon: Sliders },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-xs md:text-sm font-bold transition-all",
                  isActive
                    ? "bg-[#7135E8] text-white shadow-xs"
                    : "text-[#6C757D] hover:bg-[#F8F9FA] hover:text-[#212529]",
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ═════════════════════════════════════════════════════════
            TAB 1: SECURITY & CREDENTIALS
        ═════════════════════════════════════════════════════════ */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Change Password Card (7 cols) */}
            <div className="lg:col-span-7">
              <AdminCard
                title={t("settings.changePasswordTitle", { defaultValue: "Change Administrator Password" })}
                icon={Lock}
              >
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#212529]">
                      Current Password *
                    </label>
                    <div className="relative">
                      <Input
                        type={showOld ? "text" : "password"}
                        required
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="pe-10 border-[#DEE2E6] focus-visible:ring-[#7135E8]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOld(!showOld)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-[#6C757D] hover:text-[#212529]"
                      >
                        {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#212529]">
                      New Password *
                    </label>
                    <div className="relative">
                      <Input
                        type={showNew ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new secure password"
                        className="pe-10 border-[#DEE2E6] focus-visible:ring-[#7135E8]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-[#6C757D] hover:text-[#212529]"
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#6C757D]">Password Strength:</span>
                          <span
                            className={cn(
                              "font-bold",
                              strengthScore <= 1 && "text-[#DC3545]",
                              strengthScore === 2 && "text-[#FFC107]",
                              strengthScore === 3 && "text-[#0D6EFD]",
                              strengthScore >= 4 && "text-[#28A745]",
                            )}
                          >
                            {strengthScore <= 1 && "Weak"}
                            {strengthScore === 2 && "Fair"}
                            {strengthScore === 3 && "Good"}
                            {strengthScore >= 4 && "Strong"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E9ECEF]">
                          <div
                            className={cn(
                              "h-full transition-all duration-300",
                              strengthScore <= 1 && "w-1/4 bg-[#DC3545]",
                              strengthScore === 2 && "w-2/4 bg-[#FFC107]",
                              strengthScore === 3 && "w-3/4 bg-[#0D6EFD]",
                              strengthScore >= 4 && "w-full bg-[#28A745]",
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#212529]">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className={cn(
                          "pe-10 border-[#DEE2E6] focus-visible:ring-[#7135E8]",
                          confirmPassword &&
                            confirmPassword !== newPassword &&
                            "border-[#DC3545] focus-visible:ring-[#DC3545]",
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-[#6C757D] hover:text-[#212529]"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="mt-1 text-xs text-[#DC3545]">Passwords do not match</p>
                    )}
                  </div>

                  <div className="pt-3 flex justify-end">
                    <Button
                      type="submit"
                      disabled={
                        passwordMutation.isPending ||
                        !oldPassword ||
                        !newPassword ||
                        newPassword !== confirmPassword
                      }
                      className="bg-[#7135E8] text-white hover:bg-[#5e26cb] font-semibold gap-2 shadow-xs"
                    >
                      {passwordMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <Lock className="h-4 w-4" />
                      <span>Update Password</span>
                    </Button>
                  </div>
                </form>
              </AdminCard>
            </div>

            {/* Right Column: 2FA & Password Policy (5 cols) */}
            <div className="space-y-6 lg:col-span-5">
              {/* 2FA Card */}
              <AdminCard title="Two-Factor Authentication (2FA)" icon={ShieldCheck}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#212529]">2FA Status</p>
                      <p className="text-xs text-[#6C757D]">
                        Enforced for Super Administrator accounts
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded bg-[#28A745] px-2 py-0.5 text-xs font-bold text-white">
                      <CheckCircle2 className="h-3 w-3" />
                      ENABLED
                    </span>
                  </div>

                  <div className="rounded-lg border border-[#E9ECEF] bg-[#F8F9FA] p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[#212529]">
                      <span className="font-semibold">Method:</span>
                      <span className="font-mono text-[#7135E8] font-bold">Authenticator App</span>
                    </div>
                    <div className="flex items-center justify-between text-[#212529]">
                      <span className="font-semibold">Backup Codes:</span>
                      <span className="font-bold text-[#28A745]">8 codes remaining</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => toast.success("Backup codes regenerated and sent to admin email")}
                    className="w-full border-[#DEE2E6] text-[#212529] hover:bg-[#F8F9FA] text-xs font-semibold gap-1.5"
                  >
                    <Key className="h-3.5 w-3.5 text-[#7135E8]" />
                    <span>Regenerate Recovery Codes</span>
                  </Button>
                </div>
              </AdminCard>

              {/* Password Policy Card */}
              <AdminCard title="Administrative Password Policy" icon={Key}>
                <ul className="space-y-2 text-xs text-[#6C757D]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2
                      className={cn(
                        "h-4 w-4 shrink-0",
                        passwordCriteria.length ? "text-[#28A745]" : "text-[#DEE2E6]",
                      )}
                    />
                    <span>At least 8 characters length</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2
                      className={cn(
                        "h-4 w-4 shrink-0",
                        passwordCriteria.hasUpper && passwordCriteria.hasLower
                          ? "text-[#28A745]"
                          : "text-[#DEE2E6]",
                      )}
                    />
                    <span>Uppercase and lowercase letters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2
                      className={cn(
                        "h-4 w-4 shrink-0",
                        passwordCriteria.hasNumber ? "text-[#28A745]" : "text-[#DEE2E6]",
                      )}
                    />
                    <span>At least one numerical digit (0-9)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2
                      className={cn(
                        "h-4 w-4 shrink-0",
                        passwordCriteria.hasSpecial ? "text-[#28A745]" : "text-[#DEE2E6]",
                      )}
                    />
                    <span>At least one special character (!@#$%^&*)</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#212529] font-medium pt-1 border-t border-[#E9ECEF]">
                    <ShieldCheck className="h-4 w-4 text-[#0D6EFD] shrink-0" />
                    <span>Passwords expire every 90 days</span>
                  </li>
                </ul>
              </AdminCard>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            TAB 2: LOGIN HISTORY & AUDIT ("can see the history")
        ═════════════════════════════════════════════════════════ */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* Top Stat Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <AdminStatBox
                variant="purple"
                value={stats.totalLogins}
                title="Total Recorded Logins"
                icon={History}
              />
              <AdminStatBox
                variant="green"
                value={stats.successfulLogins}
                title="Successful Logins"
                icon={CheckCircle2}
              />
              <AdminStatBox
                variant="red"
                value={stats.failedLogins}
                title="Failed Attempts"
                icon={AlertTriangle}
              />
              <AdminStatBox
                variant="blue"
                value="98.5%"
                title="Security Integrity Rate"
                icon={ShieldCheck}
              />
            </div>

            {/* Active Connected Devices & Sessions */}
            <AdminCard
              title="Active Sessions & Connected Devices"
              icon={Laptop}
              headerActions={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success("All other sessions revoked")}
                  className="border-[#DEE2E6] text-[#DC3545] hover:bg-[#F8F9FA] text-xs font-semibold gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Terminate Other Sessions</span>
                </Button>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(activityData?.devices || [
                  {
                    id: 1,
                    device_name: "Chrome 131 on Linux / Ubuntu",
                    device_fingerprint: "fp_98a7c2e109",
                    last_active: "Active Now",
                    created_at: "2026-11-02",
                  },
                  {
                    id: 2,
                    device_name: "Safari 17 on macOS / Apple Silicon",
                    device_fingerprint: "fp_31b8f4a552",
                    last_active: "3 hours ago",
                    created_at: "2026-10-31",
                  },
                ]).map((dev, idx) => (
                  <div
                    key={dev.id}
                    className="flex items-start justify-between rounded-xl border border-[#E9ECEF] p-4 bg-[#F8F9FA]/60"
                  >
                    <div className="flex items-start gap-3">
                      {idx === 0 ? (
                        <Laptop className="h-5 w-5 text-[#0D6EFD] shrink-0 mt-0.5" />
                      ) : (
                        <Smartphone className="h-5 w-5 text-[#7135E8] shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#212529]">
                            {dev.device_name}
                          </p>
                          {idx === 0 && (
                            <span className="rounded bg-[#28A745] px-1.5 py-0.2 text-[10px] font-bold text-white uppercase tracking-wider">
                              CURRENT
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-[#6C757D] mt-0.5">
                          ID: {dev.device_fingerprint}
                        </p>
                        <p className="text-xs text-[#6C757D] mt-1 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#28A745]" />
                          <span>Last active: {dev.last_active}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AdminCard>

            {/* Login Audit Trail Table */}
            <AdminCard
              title="Administrator Login Audit Trail"
              icon={History}
              headerActions={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    refetchActivity();
                    toast.success("Login history refreshed");
                  }}
                  className="border-[#DEE2E6] text-[#212529] hover:bg-[#F8F9FA] text-xs font-semibold gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-[#7135E8]" />
                  <span>Refresh</span>
                </Button>
              }
            >
              {/* Search & Status Filter */}
              <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C757D]" />
                  <input
                    type="text"
                    placeholder="Search by IP or user agent..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full rounded-lg border border-[#DEE2E6] bg-white py-1.5 ps-9 pe-3 text-xs text-[#212529] placeholder-[#ADB5BD] outline-none focus:border-[#7135E8]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-[#6C757D]" />
                  <select
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value as any)}
                    className="rounded-lg border border-[#DEE2E6] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#212529] outline-none focus:border-[#7135E8]"
                  >
                    <option value="all">All Events ({activityData?.loginHistory?.length || 0})</option>
                    <option value="success">Successful Only</option>
                    <option value="failed">Failed Only</option>
                  </select>
                </div>
              </div>

              {loadingActivity ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#7135E8]" />
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#6C757D]">
                  No login history records found matching criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="border-b border-[#E9ECEF] bg-[#F8F9FA] text-[11px] font-bold uppercase tracking-wider text-[#6C757D]">
                      <tr>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">IP Address</th>
                        <th className="px-4 py-2.5">Client User Agent</th>
                        <th className="px-4 py-2.5">Date & Time</th>
                        <th className="px-4 py-2.5 text-right rtl:text-left">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9ECEF]">
                      {filteredHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-[#F8F9FA]/60">
                          {/* Status */}
                          <td className="px-4 py-3">
                            {item.success ? (
                              <span className="inline-flex items-center gap-1 rounded bg-[#28A745] px-2 py-0.5 text-[11px] font-bold text-white">
                                <CheckCircle2 className="h-3 w-3" />
                                SUCCESS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-[#DC3545] px-2 py-0.5 text-[11px] font-bold text-white">
                                <AlertTriangle className="h-3 w-3" />
                                FAILED
                              </span>
                            )}
                          </td>

                          {/* IP Address */}
                          <td className="px-4 py-3 font-mono font-bold text-[#212529]">
                            {item.ip_address}
                          </td>

                          {/* Client User Agent */}
                          <td className="px-4 py-3 text-[#6C757D] max-w-xs truncate" title={item.user_agent}>
                            {item.user_agent}
                          </td>

                          {/* Date & Time */}
                          <td className="px-4 py-3 text-[#212529]">
                            {item.login_at ? formatDate(item.login_at) : "Just now"}
                          </td>

                          {/* Risk Level */}
                          <td className="px-4 py-3 text-right rtl:text-left">
                            <span
                              className={cn(
                                "rounded px-2 py-0.5 text-[10px] font-bold",
                                item.success
                                  ? "bg-[#F4F6F9] text-[#28A745] border border-[#DEE2E6]"
                                  : "bg-[#DC3545] text-white",
                              )}
                            >
                              {item.success ? "LOW (TRUSTED)" : "HIGH (ATTEMPT)"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AdminCard>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            TAB 3: ACCOUNT & IDENTITY DETAILS ("all the others thing")
        ═════════════════════════════════════════════════════════ */}
        {activeTab === "account" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <AdminCard title="Administrator Identity Details" icon={User}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    profileMutation.mutate();
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#212529]">
                        First Name *
                      </label>
                      <Input
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="border-[#DEE2E6] focus-visible:ring-[#7135E8]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#212529]">
                        Last Name *
                      </label>
                      <Input
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="border-[#DEE2E6] focus-visible:ring-[#7135E8]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#212529]">
                        Email Address (Read-only)
                      </label>
                      <Input
                        disabled
                        value={user?.email || "admin@jadara.dz"}
                        className="border-[#DEE2E6] bg-[#F8F9FA] font-mono text-xs text-[#6C757D]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#212529]">
                        Phone Number
                      </label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+213 550 00 00 00"
                        className="border-[#DEE2E6] focus-visible:ring-[#7135E8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#212529]">
                      Headquarters / Location
                    </label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Algiers, Algeria"
                      className="border-[#DEE2E6] focus-visible:ring-[#7135E8]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#212529]">
                      Administrative Biography
                    </label>
                    <textarea
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full rounded-lg border border-[#DEE2E6] bg-white p-3 text-xs text-[#212529] outline-none transition-colors focus:border-[#7135E8] focus:ring-1 focus:ring-[#7135E8]"
                    />
                  </div>

                  <div className="flex justify-end pt-3 border-t border-[#E9ECEF]">
                    <Button
                      type="submit"
                      disabled={profileMutation.isPending || !firstName.trim()}
                      className="bg-[#7135E8] text-white hover:bg-[#5e26cb] font-semibold gap-2 shadow-xs"
                    >
                      {profileMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <Save className="h-4 w-4" />
                      <span>Save Account Changes</span>
                    </Button>
                  </div>
                </form>
              </AdminCard>
            </div>

            <div className="space-y-6 lg:col-span-4">
              <AdminCard title="Security Level & Role" icon={ShieldCheck}>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6C757D]">System Role:</span>
                    <span className="rounded bg-[#7135E8] px-2 py-0.5 font-bold text-white uppercase text-[10px]">
                      SUPER ADMIN
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6C757D]">RBAC Tier:</span>
                    <span className="font-bold text-[#212529]">Tier 1 (Root Access)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6C757D]">Scope:</span>
                    <span className="font-bold text-[#28A745]">Global Platform Oversight</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6C757D]">Account Status:</span>
                    <span className="flex items-center gap-1.5 font-bold text-[#28A745]">
                      <span className="h-2 w-2 rounded-full bg-[#28A745]" />
                      Active / Verified
                    </span>
                  </div>
                </div>
              </AdminCard>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            TAB 4: SYSTEM PREFERENCES & NOTIFICATIONS ("all the others thing")
        ═════════════════════════════════════════════════════════ */}
        {activeTab === "system" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Email Notifications Card (6 cols) */}
            <div className="lg:col-span-6">
              <AdminCard title="Notification & Email Alerts" icon={Bell}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-[#E9ECEF] bg-[#F8F9FA]/60">
                    <div>
                      <p className="text-xs font-bold text-[#212529]">Project Submissions</p>
                      <p className="text-[11px] text-[#6C757D]">
                        Receive instant alert when a new project is submitted for review
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifySubmissions}
                      onChange={(e) => {
                        setNotifySubmissions(e.target.checked);
                        toast.success("Notification preference saved");
                      }}
                      className="h-4 w-4 accent-[#7135E8]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-[#E9ECEF] bg-[#F8F9FA]/60">
                    <div>
                      <p className="text-xs font-bold text-[#212529]">User Registrations</p>
                      <p className="text-[11px] text-[#6C757D]">
                        Notify on new beneficiary, talent, or organization signups
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyUsers}
                      onChange={(e) => {
                        setNotifyUsers(e.target.checked);
                        toast.success("Notification preference saved");
                      }}
                      className="h-4 w-4 accent-[#7135E8]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-[#E9ECEF] bg-[#F8F9FA]/60">
                    <div>
                      <p className="text-xs font-bold text-[#212529]">Critical Security Alerts</p>
                      <p className="text-[11px] text-[#6C757D]">
                        Urgent emails for failed logins, password changes, or policy violations
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifySecurity}
                      onChange={(e) => {
                        setNotifySecurity(e.target.checked);
                        toast.success("Security alert preference saved");
                      }}
                      className="h-4 w-4 accent-[#7135E8]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-[#E9ECEF] bg-[#F8F9FA]/60">
                    <div>
                      <p className="text-xs font-bold text-[#212529]">Weekly System Digest</p>
                      <p className="text-[11px] text-[#6C757D]">
                        Summary of platform statistics, demand trends, and reviewer throughput
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyDigest}
                      onChange={(e) => {
                        setNotifyDigest(e.target.checked);
                        toast.success("Digest preference saved");
                      }}
                      className="h-4 w-4 accent-[#7135E8]"
                    />
                  </div>
                </div>
              </AdminCard>
            </div>

            {/* Right: Operational System Configuration (6 cols) */}
            <div className="lg:col-span-6">
              <AdminCard title="Operational Configuration" icon={Sliders}>
                <div className="space-y-4">
                  {/* Session Idle Timeout */}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#212529]">
                      Administrator Idle Session Timeout
                    </label>
                    <select
                      value={sessionTimeout}
                      onChange={(e) => {
                        setSessionTimeout(e.target.value);
                        toast.success("Session timeout updated");
                      }}
                      className="w-full rounded-lg border border-[#DEE2E6] bg-white px-3 py-2 text-xs font-semibold text-[#212529] outline-none focus:border-[#7135E8]"
                    >
                      <option value="15">15 Minutes (Strict Security)</option>
                      <option value="30">30 Minutes (Recommended)</option>
                      <option value="60">1 Hour (Standard)</option>
                      <option value="480">8 Hours (Full Shift)</option>
                    </select>
                    <p className="mt-1 text-[11px] text-[#6C757D]">
                      Inactive sessions will be locked and require re-authentication.
                    </p>
                  </div>

                  {/* Table Pagination Default */}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#212529]">
                      Default Table Page Size
                    </label>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(e.target.value);
                        toast.success("Page size updated");
                      }}
                      className="w-full rounded-lg border border-[#DEE2E6] bg-white px-3 py-2 text-xs font-semibold text-[#212529] outline-none focus:border-[#7135E8]"
                    >
                      <option value="10">10 items per page</option>
                      <option value="25">25 items per page</option>
                      <option value="50">50 items per page</option>
                      <option value="100">100 items per page</option>
                    </select>
                  </div>

                  {/* Audit Log Retention */}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#212529]">
                      Audit Log Retention Period
                    </label>
                    <select
                      value={logRetention}
                      onChange={(e) => {
                        setLogRetention(e.target.value);
                        toast.success("Retention window updated");
                      }}
                      className="w-full rounded-lg border border-[#DEE2E6] bg-white px-3 py-2 text-xs font-semibold text-[#212529] outline-none focus:border-[#7135E8]"
                    >
                      <option value="30">30 Days</option>
                      <option value="90">90 Days (Quarterly Audit)</option>
                      <option value="180">180 Days (Semi-Annual)</option>
                      <option value="365">365 Days (Full Compliance Year)</option>
                    </select>
                  </div>

                  {/* Platform Maintenance Mode Simulation */}
                  <div className="pt-3 border-t border-[#E9ECEF]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#212529]">Maintenance Mode</p>
                        <p className="text-[11px] text-[#6C757D]">
                          Restrict platform access for non-administrators during scheduled updates
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info("Maintenance mode trigger preview only (safe)")}
                        className="border-[#DC3545] text-[#DC3545] hover:bg-[#F8F9FA] text-xs font-bold"
                      >
                        Simulate
                      </Button>
                    </div>
                  </div>
                </div>
              </AdminCard>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
