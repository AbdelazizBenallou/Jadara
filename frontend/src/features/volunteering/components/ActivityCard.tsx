import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MoreHorizontal,
  Loader2,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { Activity } from "@/api/activities";
import { applyToActivity } from "@/api/activities";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/utils/formatDate";
import { AcceptedMembersModal } from "./AcceptedMembersModal";

const CATEGORY_COVERS: Record<string, string> = {
  "Environment & Nature":
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
  "Education & Youth":
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
  "Community & Social Care":
    "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80",
  "Health & Well-being":
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
  "Digital & Technology":
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
  default:
    "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80",
};

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`saved_activity_${activity.id}`);
      return saved === "true";
    }
    return false;
  });
  const [likesCount, setLikesCount] = useState(() => 12 + (activity.id % 17));
  const [isLiked, setIsLiked] = useState(false);

  const isBeneficiary = user?.role?.toLowerCase() === "beneficiary";
  const orgId = activity.organization_id || activity.organization?.id;

  const categoryName = activity.category?.name || "Community Volunteering";
  const coverImage =
    CATEGORY_COVERS[categoryName] || CATEGORY_COVERS.default;

  const acceptedCount = activity.accepted_count ?? 0;
  const capacity = activity.required_volunteers || activity.capacity || 20;
  const availablePositions = Math.max(0, capacity - acceptedCount);
  const progressPercent = Math.min(
    100,
    Math.round((acceptedCount / (capacity || 1)) * 100),
  );

  const applicationStatus = activity.my_application?.status;

  const applyMutation = useMutation({
    mutationFn: () => applyToActivity(activity.id),
    onSuccess: () => {
      toast.success("Application submitted successfully! The organization has received your request.");
      queryClient.invalidateQueries({ queryKey: queryKeys.volunteering.all });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to submit application",
      );
    },
  });

  const handleToggleSave = () => {
    const nextState = !isSaved;
    setIsSaved(nextState);
    if (typeof window !== "undefined") {
      localStorage.setItem(`saved_activity_${activity.id}`, String(nextState));
    }
    toast.success(nextState ? "Activity saved to your bookmarks" : "Activity removed from bookmarks");
  };

  const handleToggleLike = () => {
    setIsLiked((prev) => !prev);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/volunteering/activities/${activity.id}`;
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const acceptedVolunteers = activity.accepted_volunteers || [];

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-xs hover:shadow-md transition-all duration-200">
      {/* ── 1. Organization Header ───────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/organizations/$organizationId"
            params={{ organizationId: String(orgId || 1) }}
            className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#E9ECEF] bg-[#26183D] text-white hover:opacity-90 transition-opacity"
          >
            {activity.organization?.logo_url ? (
              <img
                src={activity.organization.logo_url}
                alt={activity.organization.name || "Organization"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-sm bg-[#7135E8] text-white">
                {activity.organization?.name?.charAt(0).toUpperCase() || "O"}
              </div>
            )}
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                to="/organizations/$organizationId"
                params={{ organizationId: String(orgId || 1) }}
                className="font-bold text-xs sm:text-sm text-[#212529] hover:text-[#7135E8] transition-colors truncate"
              >
                {activity.organization?.name || "JADARA Verified Organization"}
              </Link>
              <span title="Verified NGO Partner" className="inline-flex">
                <ShieldCheck className="h-4 w-4 text-[#7135E8] shrink-0" />
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#6C757D] mt-0.5">
              <span>{activity.location || "Algeria"}</span>
              <span>•</span>
              <span>
                {activity.created_at
                  ? formatDate(activity.created_at)
                  : "Recently posted"}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="rounded-lg p-1.5 text-[#6C757D] hover:bg-[#F4F6F9] hover:text-[#212529] transition-colors"
          title="Share Activity"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* ── 2. Activity Cover Image ───────────────────────── */}
      <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900 group">
        <img
          src={coverImage}
          alt={activity.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

        {/* Category Badge Pill */}
        <div className="absolute top-3.5 left-3.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-[#7135E8] shadow-xs">
            <Sparkles className="h-3 w-3 text-[#16A34A]" />
            {categoryName}
          </span>
        </div>

        {/* Registration Deadline Pill */}
        {activity.registration_deadline && (
          <div className="absolute bottom-3.5 left-3.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white">
              <Clock className="h-3 w-3 text-[#F5B51B]" />
              <span>Deadline: {formatDate(activity.registration_deadline)}</span>
            </span>
          </div>
        )}
      </div>

      {/* ── 3. Content & Meta ─────────────────────────────── */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <div>
          <Link
            to="/volunteering/activities/$activityId"
            params={{ activityId: String(activity.id) }}
            className="block"
          >
            <h2 className="text-base sm:text-lg font-bold text-[#212529] hover:text-[#7135E8] transition-colors line-clamp-2">
              {activity.title}
            </h2>
          </Link>

          {/* Location & Dates */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#6C757D]">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#7135E8]" />
              <span>
                {formatDate(activity.start_date)} - {formatDate(activity.end_date)}
              </span>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#DC3545]" />
              <span>{activity.location || "Online / Flexible"}</span>
            </span>
          </div>
        </div>

        {/* Description */}
        {activity.description && (
          <p className="text-xs sm:text-sm text-[#495057] line-clamp-3 leading-relaxed">
            {activity.description}
          </p>
        )}

        {/* Requirements / Skills Tags */}
        {activity.required_skills && activity.required_skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-[#6C757D] uppercase tracking-wider mr-1">
              Skills:
            </span>
            {activity.required_skills.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-md bg-[#F4F6F9] px-2.5 py-1 text-[11px] font-semibold text-[#7135E8] border border-[#E9ECEF]"
              >
                {s.name}
              </span>
            ))}
          </div>
        )}

        {/* Participation Stats & Progress */}
        <div className="rounded-xl border border-[#E9ECEF] bg-[#F8F9FA]/70 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#212529]">
              <Users className="h-4 w-4 text-[#7135E8]" />
              <span>
                {acceptedCount} / {capacity} Volunteers Confirmed
              </span>
            </div>
            <span className="font-bold text-[#16A34A] text-xs">
              {availablePositions} spots remaining
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#E9ECEF]">
            <div
              className="h-full rounded-full bg-[#7135E8] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Accepted Volunteers Avatars Stack */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setIsMembersModalOpen(true)}
              className="flex items-center gap-2 group cursor-pointer text-left"
              title="Click to view all confirmed members"
            >
              {acceptedVolunteers.length > 0 ? (
                <div className="flex items-center -space-x-2 overflow-hidden">
                  {acceptedVolunteers.slice(0, 4).map((m, idx) => (
                    <div
                      key={idx}
                      className="relative h-7 w-7 rounded-full border-2 border-white bg-[#26183D] overflow-hidden shadow-xs ring-1 ring-black/5"
                    >
                      {m.avatar ? (
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-[10px] text-white bg-[#7135E8]">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                  {acceptedCount > 4 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#212529] text-[10px] font-bold text-white shadow-xs">
                      +{acceptedCount - 4}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-[#6C757D]">
                  <Users className="h-3.5 w-3.5 text-[#ADB5BD]" />
                  <span>Be the first volunteer to join</span>
                </div>
              )}

              {acceptedVolunteers.length > 0 && (
                <span className="text-[11px] font-bold text-[#7135E8] group-hover:underline">
                  View Accepted Roster
                </span>
              )}
            </button>

            <span className="text-[11px] text-[#6C757D] font-medium">
              {progressPercent}% filled
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Card Action Buttons ───────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-[#E9ECEF] bg-white">
        {/* Social interactions */}
        <div className="flex items-center gap-1 text-[#6C757D]">
          <button
            type="button"
            onClick={handleToggleLike}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              isLiked
                ? "text-[#DC3545]"
                : "hover:bg-[#F4F6F9] hover:text-[#212529]"
            }`}
            title="Like activity"
          >
            <Heart
              className={`h-4 w-4 ${isLiked ? "fill-current text-[#DC3545]" : ""}`}
            />
            <span>{likesCount}</span>
          </button>

          <Link
            to="/volunteering/activities/$activityId"
            params={{ activityId: String(activity.id) }}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-[#F4F6F9] hover:text-[#212529] transition-colors"
            title="Comments & Discussion"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Comments</span>
          </Link>

          <button
            type="button"
            onClick={handleToggleSave}
            className={`rounded-lg p-1.5 transition-colors ${
              isSaved
                ? "text-[#7135E8]"
                : "hover:bg-[#F4F6F9] hover:text-[#212529]"
            }`}
            title={isSaved ? "Saved" : "Save activity"}
          >
            <Bookmark
              className={`h-4 w-4 ${isSaved ? "fill-current text-[#7135E8]" : ""}`}
            />
          </button>
        </div>

        {/* CTA Actions */}
        <div className="flex items-center gap-2">
          <Link
            to="/volunteering/activities/$activityId"
            params={{ activityId: String(activity.id) }}
            className="inline-flex items-center gap-1 rounded-lg border border-[#DEE2E6] bg-white px-3 py-1.5 text-xs font-bold text-[#212529] hover:bg-[#F8F9FA] transition-colors"
          >
            <span>Details</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#7135E8]" />
          </Link>

          {/* Role-Specific Apply CTA */}
          {isBeneficiary && (
            <>
              {applicationStatus === "accepted" ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#16A34A] px-3 py-1.5 text-xs font-bold text-[#16A34A]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Accepted</span>
                </span>
              ) : applicationStatus === "pending" ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#F5B51B] px-3 py-1.5 text-xs font-bold text-[#D97706]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Pending</span>
                </span>
              ) : availablePositions === 0 ? (
                <span className="rounded-lg bg-[#F4F6F9] px-3 py-1.5 text-xs font-bold text-[#6C757D] border border-[#E9ECEF]">
                  Full
                </span>
              ) : (
                <button
                  type="button"
                  disabled={applyMutation.isPending}
                  onClick={() => applyMutation.mutate()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#7135E8] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5e26cb] disabled:opacity-50 transition-colors shadow-xs"
                >
                  {applyMutation.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>Apply Now</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Accepted Members Modal */}
      <AcceptedMembersModal
        activityId={activity.id}
        activityTitle={activity.title}
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
      />
    </article>
  );
}
