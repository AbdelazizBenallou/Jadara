import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Search,
  MapPin,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Loader2,
  X,
  ExternalLink,
} from "lucide-react";
import { listOrganizations } from "@/api/organizations";
import { queryKeys } from "@/lib/query-keys";
import { SocialLayout } from "../components/SocialLayout";

export function OrganizationsDirectoryPage() {
  const [search, setSearch] = useState("");

  const { data: result, isLoading } = useQuery({
    queryKey: queryKeys.organizations.list({ q: search }),
    queryFn: () => listOrganizations({ q: search || undefined, limit: 30 }),
  });

  const organizations = result?.items || [];

  return (
    <SocialLayout>
      <div className="space-y-4">
        {/* Header Bar */}
        <div className="rounded-2xl border border-[#E9ECEF] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[#7135E8] mb-1">
            <Building2 className="h-4 w-4" />
            <span>Partner Ecosystem</span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-[#212529]">
            Verified Partner Organizations
          </h1>
          <p className="text-xs text-[#6C757D] mt-1">
            Browse non-profits, associations, and civic foundations organizing impactful volunteering missions across Algeria.
          </p>

          {/* Search */}
          <div className="mt-4 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ADB5BD]" />
            <input
              type="text"
              placeholder="Search by organization name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#DEE2E6] bg-[#F8F9FA] pl-9 pr-9 py-2 text-xs text-[#212529] focus:bg-white focus:border-[#7135E8] focus:outline-hidden"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ADB5BD] hover:text-[#212529]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* List Grid */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#6C757D]">
            <Loader2 className="h-8 w-8 animate-spin text-[#7135E8] mb-2" />
            <p className="text-xs font-medium">Loading partner directory...</p>
          </div>
        ) : organizations.length === 0 ? (
          <div className="rounded-2xl border border-[#E9ECEF] bg-white p-12 text-center shadow-xs">
            <Building2 className="mx-auto h-10 w-10 text-[#CED4DA] mb-2" />
            <h3 className="font-bold text-sm text-[#212529]">
              No organizations found
            </h3>
            <p className="text-xs text-[#6C757D] mt-1">
              {search
                ? `No organizations matched "${search}". Try searching for another city or name.`
                : "No organizations have registered yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="rounded-2xl border border-[#E9ECEF] bg-white p-5 shadow-xs hover:shadow-md hover:border-[#7135E8]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#E9ECEF] bg-[#26183D] text-white">
                      {org.logo_url ? (
                        <img
                          src={org.logo_url}
                          alt={org.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-sm bg-[#7135E8] text-white">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-[#212529] truncate">
                          {org.name}
                        </h3>
                        <ShieldCheck className="h-4 w-4 text-[#7135E8] shrink-0" />
                      </div>
                      <p className="flex items-center gap-1 text-xs text-[#6C757D] mt-0.5">
                        <MapPin className="h-3 w-3 text-[#DC3545]" />
                        <span>{org.location || "Algeria"}</span>
                      </p>
                    </div>
                  </div>

                  {org.description && (
                    <p className="mt-3 text-xs text-[#495057] line-clamp-2 leading-relaxed">
                      {org.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#E9ECEF] flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#6C757D]">
                    {org.total_published_activities || 0} active missions
                  </span>

                  <Link
                    to="/organizations/$organizationId"
                    params={{ organizationId: String(org.id) }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#7135E8] hover:underline"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SocialLayout>
  );
}
