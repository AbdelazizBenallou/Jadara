import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MapPin,
  TrendingUp,
  HeartHandshake,
} from "lucide-react";
import { listOrganizations } from "@/api/organizations";
import { listActivityCategories } from "@/api/activity-categories";
import { listPublishedActivities } from "@/api/activities";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/lib/utils";

interface SocialRightSidebarProps {
  onSearchChange?: (term: string) => void;
  onCategorySelect?: (categoryId: number | null) => void;
  selectedCategoryId?: number | null;
  className?: string;
}

export function SocialRightSidebar({
  onSearchChange,
  onCategorySelect,
  selectedCategoryId,
  className,
}: SocialRightSidebarProps) {
  const [localSearch, setLocalSearch] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    onSearchChange?.(val);
  };

  const { data: orgsResult } = useQuery({
    queryKey: queryKeys.organizations.list({ limit: 4 }),
    queryFn: () => listOrganizations({ limit: 4 }),
    staleTime: 1000 * 60 * 5,
  });

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.volunteering.categories,
    queryFn: listActivityCategories,
    staleTime: 1000 * 60 * 10,
  });

  const { data: upcomingResult } = useQuery({
    queryKey: queryKeys.volunteering.feed({ limit: 3 }),
    queryFn: () => listPublishedActivities({ limit: 3 }),
    staleTime: 1000 * 60 * 3,
  });

  const organizations = orgsResult?.items || [];
  const upcomingActivities = upcomingResult?.items || [];

  return (
    <aside className={cn("space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto pr-1 scrollbar-thin", className)}>
      {/* ── 1. Search Box Widget ────────────────────────── */}
      <div className="rounded-2xl border border-[#E9ECEF] bg-white p-3.5 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ADB5BD]" />
          <input
            type="text"
            placeholder="Search missions, orgs, skills..."
            value={localSearch}
            onChange={handleSearch}
            className="w-full rounded-xl border border-[#DEE2E6] bg-[#F8F9FA] pl-9 pr-3 py-2 text-xs text-[#212529] placeholder:text-[#ADB5BD] focus:bg-white focus:border-[#7135E8] focus:outline-hidden transition-all"
          />
        </div>
      </div>

      {/* ── 2. Suggested Organizations ─────────────────── */}
      <div className="rounded-2xl border border-[#E9ECEF] bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#7135E8]" />
            <h3 className="font-bold text-xs text-[#212529]">
              Verified Organizations
            </h3>
          </div>
          <Link
            to="/organizations"
            className="text-[11px] font-bold text-[#7135E8] hover:underline"
          >
            See all
          </Link>
        </div>

        <div className="space-y-2.5">
          {organizations.length === 0 ? (
            <p className="text-xs text-[#6C757D]">No organizations listed yet.</p>
          ) : (
            organizations.slice(0, 3).map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-[#F8F9FA] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#E9ECEF] bg-[#26183D] text-white">
                    {org.logo_url ? (
                      <img
                        src={org.logo_url}
                        alt={org.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-bold text-xs bg-[#7135E8] text-white">
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-bold text-xs text-[#212529] truncate">
                        {org.name}
                      </p>
                      <ShieldCheck className="h-3 w-3 text-[#7135E8] shrink-0" />
                    </div>
                    <p className="text-[11px] text-[#6C757D] truncate">
                      {org.location || "Algeria"}
                    </p>
                  </div>
                </div>

                <Link
                  to="/organizations/$organizationId"
                  params={{ organizationId: String(org.id) }}
                  className="rounded-lg border border-[#DEE2E6] bg-white px-2.5 py-1 text-[11px] font-bold text-[#7135E8] hover:bg-[#7135E8] hover:text-white transition-colors shrink-0"
                >
                  View
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── 3. Upcoming Activities ──────────────────────── */}
      <div className="rounded-2xl border border-[#E9ECEF] bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#7135E8]" />
            <h3 className="font-bold text-xs text-[#212529]">
              Upcoming Missions
            </h3>
          </div>
        </div>

        <div className="space-y-2.5">
          {upcomingActivities.length === 0 ? (
            <p className="text-xs text-[#6C757D]">No upcoming missions scheduled.</p>
          ) : (
            upcomingActivities.map((act) => (
              <Link
                key={act.id}
                to="/volunteering/activities/$activityId"
                params={{ activityId: String(act.id) }}
                className="block p-2.5 rounded-xl border border-[#E9ECEF] hover:border-[#7135E8] transition-colors group"
              >
                <h4 className="font-bold text-xs text-[#212529] group-hover:text-[#7135E8] transition-colors line-clamp-1">
                  {act.title}
                </h4>

                <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#6C757D]">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#7135E8]" />
                    <span>{formatDate(act.start_date)}</span>
                  </span>

                  {act.location && (
                    <span className="flex items-center gap-0.5 truncate max-w-[90px]">
                      <MapPin className="h-3 w-3 text-[#DC3545]" />
                      <span className="truncate">{act.location}</span>
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* ── 4. Popular Categories ───────────────────────── */}
      <div className="rounded-2xl border border-[#E9ECEF] bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#16A34A]" />
          <h3 className="font-bold text-xs text-[#212529]">
            Popular Categories
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onCategorySelect?.(null)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
              selectedCategoryId === null
                ? "bg-[#7135E8] text-white"
                : "bg-[#F4F6F9] text-[#495057] hover:bg-[#E9ECEF]",
            )}
          >
            All Missions
          </button>

          {categories.map((c) => {
            const isSelected = selectedCategoryId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onCategorySelect?.(c.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  isSelected
                    ? "bg-[#7135E8] text-white"
                    : "bg-[#F4F6F9] text-[#495057] hover:bg-[#E9ECEF]",
                )}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. Platform Impact Highlight ────────────────── */}
      <div className="rounded-2xl border border-[#E9ECEF] bg-gradient-to-br from-[#26183D] to-[#382451] p-4 text-white shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <HeartHandshake className="h-5 w-5 text-[#7135E8]" />
          <h3 className="font-bold text-xs">Community Impact</h3>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Over 100+ youth volunteers mobilized across Algeria for environmental,
          educational, and healthcare development.
        </p>
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="font-bold text-[#F5B51B]">Active Missions</span>
          <span className="font-mono font-bold text-sm">6 ongoing</span>
        </div>
      </div>
    </aside>
  );
}
