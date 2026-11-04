import { useState, useRef, useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Compass,
  Filter,
  X,
  Search,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  HeartHandshake,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { listPublishedActivities } from "@/api/activities";
import { listActivityCategories } from "@/api/activity-categories";
import { queryKeys } from "@/lib/query-keys";
import { SocialLayout } from "../components/SocialLayout";
import { ActivityCard } from "../components/ActivityCard";
import { FeedSkeleton } from "../components/FeedSkeleton";
import { CreateActivityModal } from "../components/CreateActivityModal";

export function SocialHomePage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const observerRef = useRef<HTMLDivElement>(null);

  const isOrganization = user?.role?.toLowerCase() === "organization";

  // Categories for the top filter pills
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.volunteering.categories,
    queryFn: listActivityCategories,
    staleTime: 1000 * 60 * 10,
  });

  // Infinite Query for the activity feed with limit 4 for smooth scrolling
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.volunteering.feed({
      q: searchTerm || undefined,
      category_id: selectedCategoryId || undefined,
    }),
    queryFn: ({ pageParam = 1 }) =>
      listPublishedActivities({
        page: pageParam,
        limit: 4,
        q: searchTerm.trim() || undefined,
        category_id: selectedCategoryId || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2,
  });

  // Dual Infinite Scroll Mechanism:
  // 1. Intersection Observer
  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "300px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 2. Window Scroll Event Listener fallback for 100% reliable continuous scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!hasNextPage || isFetchingNextPage) return;
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 500;
      if (scrollPosition >= threshold) {
        fetchNextPage();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten pages
  const activities = data?.pages.flatMap((page) => page.items) || [];

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategoryId(null);
  };

  const hasActiveFilters = Boolean(searchTerm.trim() || selectedCategoryId);

  return (
    <SocialLayout
      onSearchChange={(term) => setSearchTerm(term)}
      onCategorySelect={(catId) => setSelectedCategoryId(catId)}
      selectedCategoryId={selectedCategoryId}
    >
      <div className="space-y-4">
        {/* ── Community Welcome / Publish Prompt ──────────── */}
        <div className="rounded-2xl border border-[#E9ECEF] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-[#7135E8] bg-[#26183D] text-white">
                {user?.profile?.avatar_url ? (
                  <img
                    src={user.profile.avatar_url}
                    alt={user.name || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold text-xs bg-[#7135E8]">
                    {user?.profile?.first_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-sm font-extrabold text-[#212529]">
                  Welcome back, {user?.profile?.first_name || user?.name || "Friend"}!
                </h1>
                <p className="text-xs text-[#6C757D]">
                  Explore volunteer opportunities, learn skills, and drive positive impact.
                </p>
              </div>
            </div>

            {isOrganization && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#7135E8] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#5e26cb] transition-colors shadow-xs shrink-0"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Post Mission</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Filter Pills Bar ────────────────────────────── */}
        <div className="rounded-2xl border border-[#E9ECEF] bg-white p-3 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#212529]">
              <Compass className="h-4 w-4 text-[#7135E8]" />
              <span>Explore Missions</span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#DC3545] hover:underline"
              >
                <X className="h-3.5 w-3.5" />
                <span>Clear filters</span>
              </button>
            )}
          </div>

          {/* Horizontally scrollable category pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategoryId(null)}
              className={`rounded-full px-3 py-1 font-semibold transition-colors shrink-0 ${
                selectedCategoryId === null
                  ? "bg-[#7135E8] text-white shadow-xs"
                  : "bg-[#F4F6F9] text-[#495057] hover:bg-[#E9ECEF]"
              }`}
            >
              All Categories
            </button>

            {categories.map((c) => {
              const isSelected = selectedCategoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={`rounded-full px-3 py-1 font-semibold transition-colors shrink-0 ${
                    isSelected
                      ? "bg-[#7135E8] text-white shadow-xs"
                      : "bg-[#F4F6F9] text-[#495057] hover:bg-[#E9ECEF]"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Feed Content / Infinite Scroll ──────────────── */}
        {isLoading ? (
          <FeedSkeleton />
        ) : isError ? (
          <div className="rounded-2xl border border-[#E9ECEF] bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-[#DC3545] mb-3">
              <X className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-[#212529]">
              Failed to load volunteering feed
            </h3>
            <p className="text-xs text-[#6C757D] mt-1 max-w-sm mx-auto">
              We encountered a network error while connecting to the volunteering service.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#7135E8] px-4 py-2 text-xs font-bold text-white hover:bg-[#5e26cb]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-2xl border border-[#E9ECEF] bg-white p-12 text-center shadow-xs space-y-3">
            <HeartHandshake className="mx-auto h-12 w-12 text-[#ADB5BD]" />
            <h3 className="font-bold text-base text-[#212529]">
              No volunteering activities found
            </h3>
            <p className="text-xs text-[#6C757D] max-w-sm mx-auto">
              {hasActiveFilters
                ? "No activities match your current search or category filters. Try clearing them to see all available missions."
                : "There are currently no active published volunteering missions. Check back soon for new community initiatives!"}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-xl bg-[#7135E8] px-4 py-2 text-xs font-bold text-white hover:bg-[#5e26cb]"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}

            {/* Bottom infinite scroll trigger */}
            <div ref={observerRef} className="py-6 text-center">
              {isFetchingNextPage ? (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#7135E8]">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading more activities...</span>
                </div>
              ) : hasNextPage ? (
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  className="rounded-xl border border-[#DEE2E6] bg-white px-5 py-2.5 text-xs font-bold text-[#7135E8] hover:bg-[#F8F9FA] transition-colors shadow-xs"
                >
                  Load More Missions
                </button>
              ) : (
                <div className="py-4 flex flex-col items-center justify-center text-[#6C757D]">
                  <CheckCircle2 className="h-5 w-5 text-[#16A34A] mb-1" />
                  <p className="text-xs font-semibold">
                    You've reached the end of the volunteering feed.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Activity Modal */}
      <CreateActivityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </SocialLayout>
  );
}
