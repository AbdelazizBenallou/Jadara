import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { apiClient } from "@/api/client";

export function TalentProfile() {
  const { id } = useParams({ strict: false });
  const { t } = useTranslation();

  const [hireOpen, setHireOpen] = useState(false);
  const [message, setMessage] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["talent", id],
    queryFn: () =>
      apiClient
        .get(`/users/${id}/profile`)
        .then((res: any) => res.data),
    enabled: !!id,
  });

  const talent = data?.data;

  if (isLoading) {
    return (
      <DashboardLayout
        role="company"
        title="Talent Profile"
        backLink="/company"
      >
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !talent) {
    return (
      <DashboardLayout
        role="company"
        title="Talent Profile"
        backLink="/company"
      >
        <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <X className="h-7 w-7" />
          </div>

          <h2 className="mt-4 text-xl font-bold text-foreground">
            Profile not found
          </h2>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            The talent profile you are looking for does not exist or is no
            longer available.
          </p>

          <Link
            to="/company"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to talent
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const profile = talent.profiles;

  const firstName = profile?.first_name || "";
  const lastName = profile?.last_name || "";

  const fullName =
    `${firstName} ${lastName}`.trim() || "JADARA Professional";

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "J";

  const avatar = profile?.avatar_url;

  const title =
    profile?.headline ||
    talent.work_experiences?.[0]?.job_title ||
    "Verified professional";

  const skills = talent.user_skills || [];
  const projects = talent.projects || [];
  const languages = talent.user_languages || [];

  return (
    <DashboardLayout
      role="company"
      title="Talent Profile"
      backLink="/company"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Breadcrumb */}
        <Link
          to="/company"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to talent discovery
        </Link>

        {/* Profile hero */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="h-32 bg-primary/10 sm:h-40" />

          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-primary shadow-sm sm:h-28 sm:w-28">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-primary-foreground">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {fullName}
                    </h1>

                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  </div>

                  <p className="mt-1 text-base font-medium text-primary">
                    {title}
                  </p>

                  {profile?.location && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Hire */}
              <button
                type="button"
                onClick={() => setHireOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 lg:mb-1"
              >
                <BriefcaseBusiness className="h-4 w-4" />
                Hire Talent
              </button>
            </div>
          </div>
        </section>

        {/* Verification summary */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={<ShieldCheck className="h-5 w-5" />}
            value={skills.length}
            label="Verified skills"
          />

          <SummaryCard
            icon={<BriefcaseBusiness className="h-5 w-5" />}
            value={projects.length}
            label="Verified projects"
          />

          <SummaryCard
            icon={<Award className="h-5 w-5" />}
            value="JADARA"
            label="Verification platform"
          />
        </section>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left */}
          <div className="space-y-6">
            {/* About */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-bold text-foreground">
                About
              </h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {profile?.bio ||
                  t("company.noBio", {
                    defaultValue: "No biography provided.",
                  })}
              </p>
            </section>

            {/* Verified Projects */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="h-5 w-5 text-primary" />

                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Verified Projects
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Projects reviewed and verified through JADARA.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {projects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <FileText className="mx-auto h-7 w-7 text-muted-foreground" />

                    <p className="mt-3 text-sm text-muted-foreground">
                      No verified projects yet.
                    </p>
                  </div>
                ) : (
                  projects.map(
                    (project: {
                      id: number;
                      title: string;
                      description?: string;
                      created_at?: string;
                    }) => (
                      <article
                        key={project.id}
                        className="rounded-xl border border-border p-5 transition hover:border-primary/20"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {project.title}
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {project.description ||
                                "No project description provided."}
                            </p>
                          </div>

                          {project.created_at && (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {new Date(
                                project.created_at,
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-xs font-semibold text-success">
                          <CheckCircle2 className="h-4 w-4" />
                          Verified by JADARA
                        </div>
                      </article>
                    ),
                  )
                )}
              </div>
            </section>
          </div>

          {/* Right */}
          <aside className="space-y-6">
            {/* Skills */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-bold text-foreground">
                Verified Skills
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {skills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No verified skills.
                  </p>
                ) : (
                  skills.map(
                    (userSkill: {
                      id: number;
                      skills?: {
                        name?: string;
                      };
                    }) => (
                      <span
                        key={userSkill.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-sm font-medium text-foreground"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />

                        {userSkill.skills?.name}
                      </span>
                    ),
                  )
                )}
              </div>
            </section>

            {/* Languages */}
            {languages.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h2 className="text-lg font-bold text-foreground">
                  Languages
                </h2>

                <div className="mt-4 space-y-2">
                  {languages.map(
                    (language: {
                      id: number;
                      proficiency?: string;
                      languages?: {
                        name?: string;
                      };
                    }) => (
                      <div
                        key={language.id}
                        className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {language.languages?.name}
                        </span>

                        {language.proficiency && (
                          <span className="text-xs text-muted-foreground">
                            {language.proficiency}
                          </span>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </section>
            )}

            {/* Hire card */}
            <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>

              <h2 className="mt-4 text-base font-bold text-foreground">
                Interested in working together?
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                You can express your interest in hiring this verified
                professional.
              </p>

              <button
                type="button"
                onClick={() => setHireOpen(true)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Hire Talent
                <Send className="h-4 w-4" />
              </button>
            </section>
          </aside>
        </div>
      </div>

      {/* Hire modal */}
      {hireOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hire-talent-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="hire-talent-title"
                  className="text-xl font-bold text-foreground"
                >
                  Hire {fullName}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Tell this professional what you are looking for.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHireOpen(false)}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5">
              <label
                htmlFor="hire-message"
                className="text-sm font-semibold text-foreground"
              >
                Message
              </label>

              <textarea
                id="hire-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={`Hi ${firstName || "there"}, we'd like to discuss an opportunity with you...`}
                rows={5}
                className="mt-2 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setHireOpen(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setHireOpen(false);
                  setMessage("");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <Mail className="h-4 w-4" />
                Send Interest
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              This V1 action is a UI contact intent. A full hiring workflow
              can be connected when the backend hiring endpoint exists.
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function SummaryCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>

        <div>
          <p className="text-xl font-bold text-foreground">
            {value}
          </p>

          <p className="text-xs text-muted-foreground">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}