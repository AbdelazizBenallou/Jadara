import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/constants/roles";

export function SettingsPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const userRole = (user?.role?.toLowerCase() as Role) || "beneficiary";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error(t("settings.currentPassword") + " is required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("auth.passwordMismatch", { defaultValue: "Passwords do not match." }));
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/auth/change-password", {
        oldPassword: currentPassword,
        newPassword,
      });

      toast.success(t("common.saved", { defaultValue: "Saved successfully." }));

      // Invalidate session on frontend and redirect
      setTimeout(() => {
        logout();
        navigate({ to: "/login" });
      }, 1000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password");
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role={userRole} title={t("sidebar.settings", { defaultValue: "Settings" })}>
      <div className="mx-auto max-w-xl space-y-6">
        <form
          className="space-y-6 rounded-2xl border bg-card p-6 shadow-soft"
          onSubmit={handleSubmit}
        >
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold">
              {t("settings.changePasswordTitle", { defaultValue: "Change Password" })}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("settings.currentPassword", { defaultValue: "Current Password" })}</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("settings.newPassword", { defaultValue: "New Password" })}</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                {t("settings.confirmNewPassword", { defaultValue: "Confirm New Password" })}
              </Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t("common.loading", { defaultValue: "Loading..." })
                : t("common.save", { defaultValue: "Save" })}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
