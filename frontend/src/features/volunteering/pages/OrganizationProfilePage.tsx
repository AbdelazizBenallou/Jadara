import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  ShieldCheck,
  Calendar,
  Users,
  Sparkles,
  ExternalLink,
  Loader2,
  HeartHandshake,
} from "lucide-react";
import { getOrganization } from "@/api/organizations";
import { queryKeys } from "@/lib/query-keys";
import { SocialIcon } from "@/components/common/SocialIcon";
import { SocialLayout } from "../components/SocialLayout";
import { ActivityCard } from "../components/ActivityCard";

export function OrganizationProfilePage() {
  const { organizationId } = useParams({ strict: false });
  const id = Number(organizationId);

  const [activeTab, setActiveTab] = useState<"missions" | "about">("missions");

  const { data: organization, isLoading, isError } = useQuery({
    queryKey: queryKeys.organizations.detail(id),
    queryFn: () => getOrganization(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SocialLayout>
        <div className="flex min-h-[450px] flex-col items-center justify-center rounded-2xl border border-[#E9ECEF] bg-white p-12">
          <Loader2 className="h-10 w-10 animate-spin text-[#7135E8]" />
          <p className="mt-3 text-xs font-semibold text-[#6C757D]">
            Loading organization profile...
          </p>
        </div>
      </SocialLayout>
    );
  }

  if (isError || !organization) {
    return (
      <SocialLayout>
        <div className="rounded-2xl border border-[#E9ECEF] bg-white p-12 text-center shadow-xs">
          <Building2 className="mx-auto h-12 w-12 text-[#ADB5BD] mb-3" />
          <h2 className="text-lg font-bold text-[#212529]">
            Organization Not Found
          </h2>
          <p className="mt-1 text-xs text-[#6C757D]">
            The requested organization does not exist or has been removed.
          </p>
          <div className="mt-4">
            <Link
              to="/organizations"
              className="inline-flex items-center gap-2 rounded-xl bg-[#7135E8] px-4 py-2 text-xs font-bold text-white hover:bg-[#5e26cb]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Organizations Directory</span>
            </Link>
          </div>
        </div>
      </SocialLayout>
    );
  }

  const activities = organization.activities || [];
  const coverUrl =
    organization.cover_url ||
    "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=80";

  return (
    <SocialLayout>
      <div className="space-y-5">
        {/* Breadcrumb Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/organizations"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7135E8] hover:text-[#5a2ab8] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Organizations</span>
          </Link>

          <span className="text-xs font-mono font-bold text-[#6C757D] bg-white px-2.5 py-1 rounded-lg border border-[#E9ECEF]">
            Partner #{organization.id}
          </span>
        </div>

        {/* ── Facebook-Inspired Header Dossier ──────────────── */}
        <div className="overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-xs">
          {/* Cover Banner */}
          <div className="relative h-48 sm:h-60 w-full overflow-hidden bg-gradient-to-r from-[#26183D] to-[#7135E8]">
            <img
              src={coverUrl}
              alt="Organization Cover"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          </div>

          {/* Details & Avatar Bar */}
          <div className="relative px-6 pb-6 pt-2">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Overlapping Avatar Logo */}
                <div className="relative -mt-16 sm:-mt-20">
                  <div className="h-28 w-28 sm:h-32 sm:w-32 overflow-hidden rounded-full border-4 border-white bg-[#26183D] shadow-xl ring-1 ring-black/5">
                    {organization.logo_url ? (
                      <img
                        src={organization.logo_url}
                        alt={organization.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-bold text-3xl bg-[#7135E8] text-white">
                        {organization.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center sm:text-left pt-2 sm:pt-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-[#212529]">
                      {organization.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white border border-[#16A34A] px-2.5 py-0.5 text-xs font-bold text-[#16A34A]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Verified NGO</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#6C757D] mt-1">
                    {organization.location || "Algeria"} • Registered Partner
                  </p>
                </div>
              </div>

              {/* Stats highlights */}
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] px-4 py-2 text-center">
                  <span className="font-black text-base text-[#7135E8] block">
                    {activities.length}
                  </span>
                  <span className="text-[10px] font-bold text-[#6C757D] uppercase">
                    Missions
                  </span>
                </div>
                <div className="rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] px-4 py-2 text-center">
                  <span className="font-black text-base text-[#16A34A] block">
                    {organization.stats?.completed_volunteers ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-[#6C757D] uppercase">
                    Volunteers
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-6 flex items-center gap-2 border-t border-[#E9ECEF] pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("missions")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                  activeTab === "missions"
                    ? "bg-[#7135E8] text-white shadow-xs"
                    : "text-[#6C757D] hover:bg-[#F4F6F9] hover:text-[#212529]"
                }`}
              >
                Published Missions ({activities.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("about")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                  activeTab === "about"
                    ? "bg-[#7135E8] text-white shadow-xs"
                    : "text-[#6C757D] hover:bg-[#F4F6F9] hover:text-[#212529]"
                }`}
              >
                About & Contact
              </button>
            </div>
          </div>
        </div>

        {/* ── Tab Content: Missions Grid ────────────────────── */}
        {activeTab === "missions" && (
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="rounded-2xl border border-[#E9ECEF] bg-white p-12 text-center shadow-xs">
                <HeartHandshake className="mx-auto h-10 w-10 text-[#CED4DA] mb-2" />
                <h3 className="font-bold text-sm text-[#212529]">
                  No active volunteering missions published
                </h3>
                <p className="text-xs text-[#6C757D] mt-0.5">
                  This organization currently has no open volunteering campaigns.
                </p>
              </div>
            ) : (
              activities.map((act) => (
                <ActivityCard key={act.id} activity={act} />
              ))
            )}
          </div>
        )}

        {/* ── Tab Content: About & Contact ──────────────────── */}
        {activeTab === "about" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#212529] uppercase tracking-wider">
                Organization Overview
              </h3>
              <p className="text-sm text-[#495057] leading-relaxed whitespace-pre-line">
                {organization.description ||
                  "No detailed organization biography provided yet."}
              </p>

              <div className="pt-4 border-t border-[#E9ECEF] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {organization.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-[#7135E8] shrink-0" />
                    <div>
                      <span className="text-[#6C757D] block text-[11px]">Email</span>
                      <a
                        href={`mailto:${organization.email}`}
                        className="font-bold text-[#212529] hover:text-[#7135E8]"
                      >
                        {organization.email}
                      </a>
                    </div>
                  </div>
                )}

                {organization.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-[#16A34A] shrink-0" />
                    <div>
                      <span className="text-[#6C757D] block text-[11px]">Phone</span>
                      <span className="font-bold text-[#212529]">
                        {organization.phone}
                      </span>
                    </div>
                  </div>
                )}

                {organization.location && (
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-[#DC3545] shrink-0" />
                    <div>
                      <span className="text-[#6C757D] block text-[11px]">Location</span>
                      <span className="font-bold text-[#212529]">
                        {organization.location}
                      </span>
                    </div>
                  </div>
                )}

                {organization.website && (
                  <div className="flex items-center gap-2.5">
                    <Globe className="h-4 w-4 text-[#0D6EFD] shrink-0" />
                    <div>
                      <span className="text-[#6C757D] block text-[11px]">Website</span>
                      <a
                        href={organization.website}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-[#0D6EFD] hover:underline flex items-center gap-1"
                      >
                        <span>{organization.website}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Social Media Links Card */}
            {organization.socials && organization.socials.length > 0 && (
              <div className="rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-[#212529] uppercase tracking-wider">
                  Connected Social Ecosystem
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {organization.socials.map((social) => (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl border border-[#E9ECEF] hover:border-[#7135E8] transition-colors group text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <SocialIcon
                          platform={social.platform || "globe"}
                          className="h-4 w-4"
                        />
                        <span className="font-bold text-[#212529] capitalize">
                          {social.platform || "Website"}
                        </span>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-[#6C757D] group-hover:text-[#7135E8]" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SocialLayout>
  );
}
