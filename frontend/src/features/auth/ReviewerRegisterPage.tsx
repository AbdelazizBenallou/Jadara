import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/common/PasswordField";
import { PasswordStrength } from "@/components/common/PasswordStrength";
import { AuthShell } from "./AuthShell";
import { listDomains } from "@/api/domains";
import { submitRegistrationDemand } from "@/api/registration-demands";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/notify";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn, isStrongPassword } from "@/lib/utils";

export function ReviewerRegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const domainsQuery = useQuery({
    queryKey: queryKeys.domains.all,
    queryFn: () => listDomains({ limit: 100 }),
  });
  const domains = domainsQuery.data ?? [];
  const loadingDomains = domainsQuery.isLoading;
  const domainsError = domainsQuery.isError
    ? getErrorMessage(domainsQuery.error, "auth.domainsLoadingError")
    : "";

  const [selectedDomains, setSelectedDomains] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [domainOpen, setDomainOpen] = useState(false);

  const toggleDomain = (id: number) => {
    setSelectedDomains((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(
        t("auth.nameRequired", { defaultValue: "Full Name is required" }),
      );
      return;
    }

    if (!email.trim()) {
      toast.error(
        t("auth.invalidEmail", {
          defaultValue: "Please enter a valid email address",
        }),
      );
      return;
    }

    if (!phone.trim()) {
      toast.error(
        t("auth.phoneRequired", { defaultValue: "Phone number is required" }),
      );
      return;
    }

    if (!password) {
      toast.error(
        t("auth.passwordRequired", { defaultValue: "Password is required" }),
      );
      return;
    }

    if (password.length < 8) {
      toast.error(
        t("auth.passwordTooShort8", {
          defaultValue: "Password must be at least 8 characters",
        }),
      );
      return;
    }

    if (!isStrongPassword(password)) {
      toast.error(
        t("auth.passwordWeak", {
          defaultValue:
            "Password must contain an uppercase letter, a lowercase letter and a number",
        }),
      );
      return;
    }

    if (password !== confirm) {
      toast.error(
        t("auth.passwordMismatch", { defaultValue: "Passwords do not match" }),
      );
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedDomains.length === 0) {
      toast.error(
        t("auth.selectAtLeastOneDomain", {
          defaultValue: "Please select at least one domain.",
        }),
      );
      return;
    }

    if (!file) {
      toast.error(
        t("auth.documentRequired", {
          defaultValue: "A supporting document is required",
        }),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const names = name.trim().split(" ");
      const first_name = names[0] || "Unknown";
      const last_name = names.slice(1).join(" ") || "Unknown";

      const formData = new FormData();
      formData.append("role", "Reviewer");
      formData.append("email", email);
      formData.append("password", password);
      formData.append("first_name", first_name);
      formData.append("last_name", last_name);
      formData.append("phone", phone);

      selectedDomains.forEach((id) => {
        formData.append("domain_ids", String(id));
      });

      formData.append("files", file);

      await submitRegistrationDemand(formData);

      toast.success(
        t("auth.demandSubmitted", {
          defaultValue: "Request submitted successfully",
        }),
      );
      setIsSubmitted(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "auth.invalidCredentials"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthShell
        title={t("auth.reviewerSubmittedTitle", {
          defaultValue: "Application Submitted",
        })}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <span
            aria-hidden="true"
            className="material-icons-round mb-2 text-[56px] leading-none text-success"
          >
            check_circle
          </span>
          <p className="text-muted-foreground text-sm max-w-sm">
            {t("auth.reviewerSubmittedDesc", {
              defaultValue:
                "Thank you for applying to be a reviewer. We will review your application and contact you soon.",
            })}
          </p>
          <Button onClick={() => navigate({ to: "/" })} className="mt-6 w-full">
            {t("common.backToHome", { defaultValue: "Back to Home" })}
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      backToRoleSelection
      title={t("auth.reviewerRegTitle", { defaultValue: "Apply as Reviewer" })}
      subtitle={t("auth.reviewerRegSubtitle", {
        defaultValue: "Help verify talent and guide the next generation.",
      })}
    >
      <form
        className="space-y-4"
        onSubmit={step === 1 ? handleNext : handleSubmit}
      >
        {step === 1 ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="rev-name">
                {t("auth.fullName", { defaultValue: "Full Name" })}
              </Label>
              <Input
                id="rev-name"
                icon="person"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rev-email">
                {t("common.email", { defaultValue: "Email" })}
              </Label>
              <Input
                id="rev-email"
                icon="mail"
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rev-phone">
                {t("auth.phone", { defaultValue: "Phone" })}
              </Label>
              <Input
                id="rev-phone"
                icon="call"
                type="tel"
                required
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rev-password">
                {t("auth.password", { defaultValue: "Password" })}
              </Label>
              <PasswordField
                id="rev-password"
                icon="lock"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <PasswordStrength password={password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rev-confirm">
                {t("auth.confirmPassword", {
                  defaultValue: "Confirm Password",
                })}
              </Label>
              <PasswordField
                id="rev-confirm"
                icon="lock"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full mt-6">
              {t("common.next", { defaultValue: "Next" })}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>
                {t("auth.chooseDomains", {
                  defaultValue: "Choose your review domains",
                })}
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                {t("auth.selectDomains", {
                  defaultValue: "Select one or more domains you can review.",
                })}
              </p>

              <Popover open={domainOpen} onOpenChange={setDomainOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={domainOpen}
                    className="w-full justify-between h-auto min-h-10 py-2"
                  >
                    {selectedDomains.length === 0 ? (
                      <span className="text-muted-foreground font-normal">
                        {t("auth.searchDomains", {
                          defaultValue: "Search and select domains...",
                        })}
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1 items-center max-w-[90%]">
                        {selectedDomains.slice(0, 2).map((id) => {
                          const dom = domains.find((d) => d.id === id);
                          return (
                            <Badge
                              key={id}
                              variant="secondary"
                              className="px-2 py-0.5 rounded-md font-normal truncate max-w-[150px]"
                            >
                              {dom?.name}
                              <button
                                type="button"
                                className="ml-1.5 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") toggleDomain(id);
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleDomain(id);
                                }}
                              >
                                <span
                                  aria-hidden="true"
                                  className="material-icons-round text-[14px] leading-none text-muted-foreground hover:text-foreground"
                                >
                                  close
                                </span>
                              </button>
                            </Badge>
                          );
                        })}
                        {selectedDomains.length > 2 && (
                          <Badge
                            variant="secondary"
                            className="px-2 py-0.5 rounded-md font-normal"
                          >
                            {t("auth.domainsSelectedCompact", {
                              count: selectedDomains.length - 2,
                              defaultValue: `+${selectedDomains.length - 2} more`,
                            })}
                          </Badge>
                        )}
                      </div>
                    )}
                    <span
                      aria-hidden="true"
                      className="material-icons-round ms-2 shrink-0 text-[16px] leading-none text-primary/60"
                    >
                      unfold_more
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder={t("auth.searchDomains", {
                        defaultValue: "Search and select domains...",
                      })}
                    />
                    <CommandList>
                      {loadingDomains ? (
                        <div className="flex justify-center p-4">
                          <span
                            aria-hidden="true"
                            className="material-icons-round animate-spin text-[20px] leading-none text-primary"
                          >
                            progress_activity
                          </span>
                        </div>
                      ) : domainsError ? (
                        <div className="p-4 text-sm text-destructive text-center">
                          {domainsError}
                        </div>
                      ) : (
                        <CommandEmpty>
                          {t("auth.noDomainsFound", {
                            defaultValue: "No domains found.",
                          })}
                        </CommandEmpty>
                      )}

                      {!loadingDomains &&
                        !domainsError &&
                        domains.length > 0 && (
                          <CommandGroup>
                            {[...domains]
                              .sort((a, b) => {
                                const aSel = selectedDomains.includes(a.id);
                                const bSel = selectedDomains.includes(b.id);
                                if (aSel && !bSel) return -1;
                                if (!aSel && bSel) return 1;
                                return a.name.localeCompare(b.name);
                              })
                              .map((domain) => {
                                const isSelected = selectedDomains.includes(
                                  domain.id,
                                );
                                return (
                                  <CommandItem
                                    key={domain.id}
                                    value={domain.name}
                                    onSelect={() => toggleDomain(domain.id)}
                                    className={cn(
                                      "flex items-center justify-between gap-2",
                                      isSelected
                                        ? "bg-primary/5 font-medium"
                                        : "",
                                    )}
                                  >
                                    <span>{domain.name}</span>
                                    {isSelected && (
                                      <span
                                        aria-hidden="true"
                                        className="material-icons-round shrink-0 text-[16px] leading-none text-primary"
                                      >
                                        check
                                      </span>
                                    )}
                                  </CommandItem>
                                );
                              })}
                          </CommandGroup>
                        )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedDomains.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 px-1">
                  {t("auth.domainsSelected", {
                    count: selectedDomains.length,
                    defaultValue: `${selectedDomains.length} domains selected`,
                  })}
                </p>
              )}
            </div>

            <div className="space-y-2 mt-4">
              <Label>
                {t("auth.uploadSupportingDoc", {
                  defaultValue: "Upload your CV",
                })}{" "}
                <span className="text-muted-foreground font-normal">
                  ({t("auth.uploadRequired", { defaultValue: "Required" })})
                </span>
              </Label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center bg-transparent hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => document.getElementById("rev-file")?.click()}
              >
                <span
                  aria-hidden="true"
                  className="material-icons-round text-[32px] leading-none text-primary mb-2"
                >
                  upload_file
                </span>
                <p className="text-sm text-center text-muted-foreground">
                  {file
                    ? file.name
                    : t("auth.clickToUploadDoc", {
                        defaultValue: "Upload a PDF or supported document",
                      })}
                </p>
                <input
                  id="rev-file"
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-1/3"
                onClick={() => setStep(1)}
              >
                {t("common.back", { defaultValue: "Back" })}
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting
                  ? t("common.loading", { defaultValue: "Loading..." })
                  : t("auth.submitApplication", {
                      defaultValue: "Submit Application",
                    })}
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
