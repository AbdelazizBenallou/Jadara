import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/common/PasswordField";
import { apiClient } from "@/api/client";
import { AuthShell } from "./AuthShell";
import { CheckCircle2, UploadCloud } from "lucide-react";

export function CompanyRegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Step 2: Info
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");

  // Step 3: Verification
  const [justificationType, setJustificationType] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && password !== confirm) {
      setError(t("auth.passwordMismatch", { defaultValue: "Passwords do not match" }));
      return;
    }
    setError("");
    setStep((s) => (s + 1) as 1 | 2 | 3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const rolesRes = await apiClient.get("/roles");
      const companyRole = rolesRes.data.data.find(
        (r: any) => r.name === "Company" || r.name === "company",
      );
      if (!companyRole) throw new Error("Company role not found");

      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("first_name", name);
      formData.append("last_name", sector || "N/A");
      formData.append("role_id", companyRole.id.toString());
      if (file) {
        formData.append("files", file);
      }

      await apiClient.post("/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setIsSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthShell title={t("company.pendingTitle")}>
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="text-muted-foreground text-sm max-w-sm">{t("company.pendingDesc")}</p>
          <Button onClick={() => navigate({ to: "/" })} className="mt-6 w-full">
            {t("common.backToHome", { defaultValue: "Back to Home" })}
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("company.regTitle")} subtitle={t("company.regSubtitle")}>
      <div className="mb-6 flex items-center justify-between text-xs text-muted-foreground">
        <span className={step >= 1 ? "font-bold text-primary" : ""}>
          1. {t("company.stepAccount")}
        </span>
        <div className={`h-px flex-1 mx-2 ${step >= 2 ? "bg-primary" : "bg-border"}`} />
        <span className={step >= 2 ? "font-bold text-primary" : ""}>
          2. {t("company.stepDetails")}
        </span>
        <div className={`h-px flex-1 mx-2 ${step >= 3 ? "bg-primary" : "bg-border"}`} />
        <span className={step >= 3 ? "font-bold text-primary" : ""}>
          3. {t("company.stepVerify")}
        </span>
      </div>

      <form className="space-y-4" onSubmit={step === 3 ? handleSubmit : handleNext}>
        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="comp-email">{t("company.profEmail")}</Label>
              <Input
                id="comp-email"
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@company.dz"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comp-password">{t("company.password")}</Label>
              <PasswordField
                id="comp-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comp-confirm">{t("company.confirmPassword")}</Label>
              <PasswordField
                id="comp-confirm"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full mt-6">
              {t("company.nextBtn")}
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="comp-name">{t("company.compName")}</Label>
              <Input
                id="comp-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comp-sector">{t("company.compType")}</Label>
              <Input
                id="comp-sector"
                required
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" className="w-1/3" onClick={() => setStep(1)}>
                {t("common.back", { defaultValue: "Back" })}
              </Button>
              <Button type="submit" className="flex-1">
                {t("company.nextBtn")}
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="comp-justification">{t("company.verifyDocType")}</Label>
              <select
                id="comp-justification"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={justificationType}
                onChange={(e) => setJustificationType(e.target.value)}
              >
                <option value="" disabled>
                  {t("auth.selectJustification", { defaultValue: "Select document type..." })}
                </option>
                <option value="rc">
                  {t("auth.rc", { defaultValue: "Registre de Commerce (RC)" })}
                </option>
                <option value="nif">{t("auth.nif", { defaultValue: "NIF" })}</option>
                <option value="other">
                  {t("auth.otherDoc", { defaultValue: "Other official document" })}
                </option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("company.uploadDoc")}</Label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById("comp-file")?.click()}
              >
                <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-center text-muted-foreground">
                  {file ? file.name : t("company.uploadHelper")}
                </p>
                <input
                  id="comp-file"
                  type="file"
                  required
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" className="w-1/3" onClick={() => setStep(2)}>
                {t("common.back", { defaultValue: "Back" })}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || !file || !justificationType}
              >
                {isSubmitting ? t("common.loading") : t("company.submitReg")}
              </Button>
            </div>
          </>
        )}
      </form>

      {!isSubmitted && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          {t("auth.haveAccount", { defaultValue: "Already have an account?" })}{" "}
          <Link to="/login" className="font-bold text-primary hover:underline">
            {t("auth.loginBtn", { defaultValue: "Log in" })}
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
