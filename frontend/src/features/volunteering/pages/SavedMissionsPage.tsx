import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Compass, Loader2 } from "lucide-react";
import { listPublishedActivities } from "@/api/activities";
import { queryKeys } from "@/lib/query-keys";
import { SocialLayout } from "../components/SocialLayout";
import { ActivityCard } from "../components/ActivityCard";

export function SavedMissionsPage() {
  const [savedIds, setSavedIds] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ids: number[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("saved_activity_")) {
        const val = localStorage.getItem(key);
        if (val === "true") {
          const actId = Number(key.replace("saved_activity_", ""));
          if (!isNaN(actId)) ids.push(actId);
        }
      }
    }
    setSavedIds(ids);
  }, []);

  const { data: feedResult, isLoading } = useQuery({
    queryKey: queryKeys.volunteering.feed({ limit: 50 }),
    queryFn: () => listPublishedActivities({ limit: 50 }),
  });

  const allActivities = feedResult?.items || [];
  const savedActivities = allActivities.filter((a) => savedIds.includes(a.id));

  return (
    <SocialLayout>
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#E9ECEF] bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[#7135E8] mb-1">
            <Bookmark className="h-4 w-4" />
            <span>Personal Bookmarks</span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-[#212529]">
            Saved Volunteering Missions
          </h1>
          <p className="text-xs text-[#6C757D] mt-1">
            Keep track of volunteering opportunities you are interested in applying to or following.
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#6C757D]">
            <Loader2 className="h-8 w-8 animate-spin text-[#7135E8] mb-2" />
            <p className="text-xs font-medium">Loading saved missions...</p>
          </div>
        ) : savedActivities.length === 0 ? (
          <div className="rounded-2xl border border-[#E9ECEF] bg-white p-12 text-center shadow-xs">
            <Bookmark className="mx-auto h-10 w-10 text-[#CED4DA] mb-2" />
            <h3 className="font-bold text-sm text-[#212529]">
              No saved missions yet
            </h3>
            <p className="text-xs text-[#6C757D] mt-1 max-w-sm mx-auto">
              Click the bookmark icon on any volunteering mission card to save it here for quick access later.
            </p>
            <div className="mt-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-[#7135E8] px-4 py-2 text-xs font-bold text-white hover:bg-[#5e26cb]"
              >
                <Compass className="h-4 w-4" />
                <span>Explore Community Feed</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {savedActivities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </SocialLayout>
  );
}
