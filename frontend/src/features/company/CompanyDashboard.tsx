import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getPublicProfile, listUsers } from "@/api/users";
import { getDomainSkills, listSkills } from "@/api/skills";
import { listDomains } from "@/api/domains";
import { queryKeys } from "@/lib/query-keys";
import type { Domain } from "@/types/domain";
import type { Skill } from "@/types/skill";
import type { PublicUserProfile } from "@/types/user";

export function CompanyDashboard() {
  const { t } = useTranslation();

  const [domainFilter, setDomainFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data: domains = [], isLoading: domainsLoading } = useQuery({
    queryKey: queryKeys.domains.list({ limit: 100 }),
    queryFn: () => listDomains({ limit: 100 }),
  });

  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: domainFilter
      ? queryKeys.domains.skills(domainFilter)
      : queryKeys.skills.list({ limit: 1000 }),
    queryFn: () =>
      domainFilter
        ? getDomainSkills(domainFilter)
        : listSkills({ limit: 1000 }),
  });

  const {
    data: talents = [],
    isLoading: talentLoading,
    isError: talentError,
  } = useQuery({
    queryKey: queryKeys.users.list({ scope: "talent" }),
    queryFn: async () => {
      const users = (await listUsers({ limit: 50 })).items.filter(
        (user) => user.role === "beneficiary",
      );
      const profiles = await Promise.all(
        users.map((user) => getPublicProfile(user.id).catch(() => null)),
      );
      return profiles.filter(
        (profile): profile is PublicUserProfile => profile !== null,
      );
    },
  });

  const filteredTalents = useMemo(() => {
    const query = search.trim().toLowerCase();
    const domainSkillIds = new Set(skills.map((skill) => skill.id));

    return talents.filter((talent) => {
      const profile = talent.profiles;
      const name =
        `${profile?.first_name || ""} ${profile?.last_name || ""}`.toLowerCase();
      const headline = (profile?.headline || "").toLowerCase();
      const talentSkills = talent.user_skills ?? [];
      const skillNames = talentSkills
        .map((item) => item.skills?.name || "")
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        headline.includes(query) ||
        skillNames.includes(query);
      const matchesDomain =
        !domainFilter ||
        talentSkills.some(
          (item) => item.skills?.id && domainSkillIds.has(item.skills.id),
        );
      const matchesSkill =
        !skillFilter ||
        talentSkills.some(
          (item) => item.skills?.id === Number(skillFilter),
        );

      return matchesSearch && matchesDomain && matchesSkill;
    });
  }, [domainFilter, talents, search, skillFilter, skills]);

  return (
    <DashboardLayout
      role="company"
      title={t("company.discoverTalent", {
        defaultValue: "Discover Talent",
      })}
      subtitle={t("company.discoverSubtitle", {
        defaultValue:
          "Find verified JADARA talent by skills, domain, and experience.",
      })}
    >
      <div className="space-y-6">
        {/* Intro */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="relative p-6 sm:p-8">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified JADARA Talent
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Find the right talent for your team.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Search professionals with verified skills and verified
                projects. Open their profile to review their experience and
                decide who you want to hire.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
              <MiniStat
                icon={<Users className="h-4 w-4" />}
                value={talents.length}
                label="Talent available"
              />

              <MiniStat
                icon={<CheckCircle2 className="h-4 w-4" />}
                value="Verified"
                label="Skills & projects"
              />
            </div>
          </div>
        </section>

        {/* Search + filters */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />

            <h2 className="text-sm font-semibold text-foreground">
              Find talent
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr_1fr]">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or skill..."
                className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            {/* Domain */}
            <select
              value={domainFilter}
              onChange={(event) => {
                setDomainFilter(event.target.value);
                setSkillFilter("");
              }}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option value="">
                {domainsLoading ? "Loading domains..." : "All domains"}
              </option>

              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>

            {/* Skill */}
            <select
              value={skillFilter}
              onChange={(event) => setSkillFilter(event.target.value)}
              disabled={skillsLoading}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option value="">
                {skillsLoading ? "Loading skills..." : "All skills"}
              </option>

              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Results */}
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Talent
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {filteredTalents.length} professional
                {filteredTalents.length === 1 ? "" : "s"} found
              </p>
            </div>
          </div>

          {talentLoading ? (
            <TalentLoading />
          ) : talentError ? (
            <TalentError />
          ) : filteredTalents.length === 0 ? (
            <TalentEmpty />
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filteredTalents.map((talent) => (
                <TalentCard
                  key={talent.id}
                  talent={talent}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function TalentCard({ talent }: { talent: PublicUserProfile }) {
  const profile = talent.profiles;

  const firstName = profile?.first_name || "";
  const lastName = profile?.last_name || "";

  const fullName =
    `${firstName} ${lastName}`.trim() || "JADARA Professional";

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "J";

  const headline =
    profile?.headline ||
    talent.work_experiences?.[0]?.job_title ||
    "Verified professional";

  const skills = talent.user_skills || [];
  const projects = talent.projects || [];

  return (
    <Link
      to="/company/talent/$id"
      params={{ id: String(talent.id) }}
      className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-border bg-primary/10">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary">
              {initials}
            </div>
          )}
        </div>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-foreground group-hover:text-primary">
                {fullName}
              </h3>

              <p className="mt-1 truncate text-sm text-primary">
                {headline}
              </p>
            </div>

            <div className="shrink-0 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
              Verified
            </div>
          </div>

          {profile?.location && (
            <p className="mt-2 text-xs text-muted-foreground">
              {profile.location}
            </p>
          )}

          {/* Skills */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {skills.slice(0, 5).map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center gap-1 rounded-lg border border-success/20 bg-success/5 px-2 py-1 text-xs font-medium text-foreground"
              >
                <CheckCircle2 className="h-3 w-3 text-success" />

                {skill.skills?.name}
              </span>
            ))}

            {skills.length > 5 && (
              <span className="rounded-lg bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                +{skills.length - 5}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                {projects.length} verified project
                {projects.length === 1 ? "" : "s"}
              </span>
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              View profile
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/70 p-3">
      <div className="flex items-center gap-2 text-primary">
        {icon}

        <span className="text-sm font-bold text-foreground">
          {value}
        </span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function TalentLoading() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-48 animate-pulse rounded-2xl bg-muted"
        />
      ))}
    </div>
  );
}

function TalentError() {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-10 text-center">
      <h3 className="font-semibold text-foreground">
        Unable to load talent
      </h3>

      <p className="mt-2 text-sm text-muted-foreground">
        Please try again in a moment.
      </p>
    </div>
  );
}

function TalentEmpty() {
  return (
    <div className="rounded-2xl border border-border bg-card p-14 text-center shadow-soft">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Search className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-foreground">
        No talent found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Try changing your search, domain, or skill filters.
      </p>
    </div>
  );
}