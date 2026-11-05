import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
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
  ShieldCheck,
  Send,
  Loader2,
  Building,
  User,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getActivity, applyToActivity, getActivityParticipants } from "@/api/activities";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/utils/formatDate";
import { SocialLayout } from "../components/SocialLayout";
import { AcceptedMembersModal } from "../components/AcceptedMembersModal";

const CATEGORY_COVERS: Record<string, string> = {
  "Environment & Nature":
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1400&q=80",
  "Education & Youth":
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=80",
  "Community & Social Care":
    "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1400&q=80",
  "Health & Well-being":
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1400&q=80",
  "Digital & Technology":
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1400&q=80",
  default:
    "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1400&q=80",
};

interface LocalComment {
  id: string;
  userName: string;
  userRole: string;
  content: string;
  createdAt: string;
}

export function ActivityDetailsPage() {
  const { activityId } = useParams({ strict: false });
  const id = Number(activityId);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<LocalComment[]>(() => [
    {
      id: "1",
      userName: "Karim B.",
      userRole: "Beneficiary",
      content: "Looking forward to participating! Is transportation organized from the central station?",
      createdAt: "Yesterday at 14:30",
    },
    {
      id: "2",
      userName: "Jadara Team",
      userRole: "Organizer",
      content: "Hello Karim! Yes, a shuttle bus will depart from the main square at 08:00 AM.",
      createdAt: "Yesterday at 16:15",
    },
  ]);

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(19);
  const [isSaved, setIsSaved] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`saved_activity_${id}`) === "true";
    }
    return false;
  });

  const { data: activity, isLoading, isError } = useQuery({
    queryKey: queryKeys.volunteering.activity(id),
    queryFn: () => getActivity(id),
    enabled: !!id,
  });

  const { data: participants = [] } = useQuery({
    queryKey: queryKeys.volunteering.participants(id),
    queryFn: () => getActivityParticipants(id),
    enabled: !!id,
  });

  const applyMutation = useMutation({
    mutationFn: () => applyToActivity(id),
    onSuccess: () => {
      toast.success("Volunteer application submitted successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.volunteering.activity(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.volunteering.all });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to submit application",
      );
    },
  });

  if (isLoading) {
    return (
      <SocialLayout>
        <div className="flex min-h-[450px] flex-col items-center justify-center rounded-2xl border border-[#E9ECEF] bg-white p-12">
          <Loader2 className="h-10 w-10 animate-spin text-[#7135E8]" />
          <p className="mt-3 text-xs font-semibold text-[#6C757D]">
            Loading mission dossier...
          </p>
        </div>
      </SocialLayout>
    );
  }

  if (isError || !activity) {
    return (
      <SocialLayout>
        <div className="rounded-2xl border border-[#E9ECEF] bg-white p-12 text-center shadow-xs">
          <AlertCircle className="mx-auto h-12 w-12 text-[#ADB5BD] mb-3" />
          <h2 className="text-lg font-bold text-[#212529]">
            Activity Not Found
          </h2>
          <p className="mt-1 text-xs text-[#6C757D]">
            The requested volunteering activity could not be found or has concluded.
          </p>
          <div className="mt-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-[#7135E8] px-4 py-2 text-xs font-bold text-white hover:bg-[#5e26cb]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Volunteering Feed</span>
            </Link>
          </div>
        </div>
      </SocialLayout>
    );
  }

  const isBeneficiary = user?.role?.toLowerCase() === "beneficiary";
  const orgId = activity.organization_id || activity.organization?.id;
  const categoryName = activity.category?.name || "Community Volunteering";
  const coverImage = CATEGORY_COVERS[categoryName] || CATEGORY_COVERS.default;

  const capacity = activity.required_volunteers || activity.capacity || 20;
  const acceptedCount = activity.accepted_count ?? participants.length;
  const availablePositions = Math.max(0, capacity - acceptedCount);
  const progressPercent = Math.min(
    100,
    Math.round((acceptedCount / (capacity || 1)) * 100),
  );

  const applicationStatus = activity.my_application?.status;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newC: LocalComment = {
      id: String(Date.now()),
      userName: user?.profile?.first_name || user?.name || "Volunteer",
      userRole: user?.role || "Beneficiary",
      content: commentText.trim(),
      createdAt: "Just now",
    };

    setComments((prev) => [newC, ...prev]);
    setCommentText("");
    toast.success("Comment posted");
  };

  const handleToggleSave = () => {
    const nextState = !isSaved;
    setIsSaved(nextState);
    if (typeof window !== "undefined") {
      localStorage.setItem(`saved_activity_${id}`, String(nextState));
    }
    toast.success(nextState ? "Activity saved to your bookmarks" : "Activity removed from bookmarks");
  };

  const handleToggleLike = () => {
    setIsLiked((prev) => !prev);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Activity link copied to clipboard!");
    }
  };

  return (
    <SocialLayout>
      <div className="space-y-5">
        {/* Breadcrumb Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7135E8] hover:text-[#5a2ab8] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Community Feed</span>
          </Link>

          <span className="text-xs font-mono font-bold text-[#6C757D] bg-white px-2.5 py-1 rounded-lg border border-[#E9ECEF]">
            Mission #{activity.id}
          </span>
        </div>

        {/* ── Main Activity Dossier Card ────────────────────── */}
        <article className="overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-xs">
          {/* Organization Banner Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9ECEF]">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/organizations/$organizationId"
                params={{ organizationId: String(orgId || 1) }}
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#E9ECEF] bg-[#26183D] text-white"
              >
                {activity.organization?.logo_url ? (
                  <img
                    src={activity.organization.logo_url}
                    alt={activity.organization.name || "Organization"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold text-base bg-[#7135E8] text-white">
                    {activity.organization?.name?.charAt(0).toUpperCase() || "O"}
                  </div>
                )}
              </Link>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/organizations/$organizationId"
                    params={{ organizationId: String(orgId || 1) }}
                    className="font-bold text-sm text-[#212529] hover:text-[#7135E8] transition-colors truncate"
                  >
                    {activity.organization?.name || "Verified NGO Partner"}
                  </Link>
                  <ShieldCheck className="h-4 w-4 text-[#7135E8] shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-xs text-[#6C757D] mt-0.5">
                  <span>{activity.location || "Algeria"}</span>
                  <span>•</span>
                  <span>
                    Posted{" "}
                    {activity.created_at
                      ? formatDate(activity.created_at)
                      : "Recently"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSave}
                className={`rounded-lg p-2 transition-colors border border-[#DEE2E6] ${
                  isSaved ? "text-[#7135E8] bg-[#F4F6F9]" : "text-[#6C757D] hover:bg-[#F8F9FA]"
                }`}
                title={isSaved ? "Saved" : "Save activity"}
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="rounded-lg p-2 text-[#6C757D] hover:bg-[#F8F9FA] transition-colors border border-[#DEE2E6]"
                title="Share Mission"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-slate-900">
            <img
              src={coverImage}
              alt={activity.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-[#7135E8] shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-[#16A34A]" />
                {categoryName}
              </span>
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight">
                {activity.title}
              </h1>
            </div>
          </div>

          {/* Activity Metadata Quick Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E9ECEF] border-b border-[#E9ECEF] bg-[#F8F9FA] text-xs">
            <div className="p-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-[#7135E8] shrink-0" />
              <div>
                <span className="text-[#6C757D] block font-semibold text-[11px]">
                  Mission Timeline
                </span>
                <span className="font-bold text-[#212529]">
                  {formatDate(activity.start_date)} - {formatDate(activity.end_date)}
                </span>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-[#DC3545] shrink-0" />
              <div>
                <span className="text-[#6C757D] block font-semibold text-[11px]">
                  Deployment Zone
                </span>
                <span className="font-bold text-[#212529] truncate block">
                  {activity.location || "Flexible / Hybrid"}
                </span>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-[#F5B51B] shrink-0" />
              <div>
                <span className="text-[#6C757D] block font-semibold text-[11px]">
                  Registration Closes
                </span>
                <span className="font-bold text-[#212529]">
                  {activity.registration_deadline
                    ? formatDate(activity.registration_deadline)
                    : "Open until full"}
                </span>
              </div>
            </div>
          </div>

          {/* Body Sections */}
          <div className="p-6 space-y-6">
            {/* Description & Objectives */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#212529] uppercase tracking-wider">
                About this Mission
              </h3>
              <p className="text-sm text-[#495057] leading-relaxed whitespace-pre-line">
                {activity.description ||
                  "No extended mission briefing provided. Please refer to participation requirements or contact the organizing partner."}
              </p>
            </div>

            {/* Participation Requirements */}
            {activity.requirements && (
              <div className="rounded-xl border border-[#E9ECEF] p-4 bg-[#F8F9FA]/60 space-y-2">
                <h4 className="text-xs font-bold text-[#212529] flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-[#7135E8]" />
                  <span>Conditions & Requirements</span>
                </h4>
                <p className="text-xs text-[#495057] leading-relaxed">
                  {activity.requirements}
                </p>
              </div>
            )}

            {/* Required Skills */}
            {activity.required_skills && activity.required_skills.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold text-[#212529] uppercase tracking-wider">
                  Target Competencies & Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activity.required_skills.map((s) => (
                    <div
                      key={s.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#E9ECEF] bg-white px-3.5 py-2 text-xs shadow-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#16A34A]" />
                      <span className="font-bold text-[#212529]">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Capacity & Progress */}
            <div className="rounded-xl border border-[#E9ECEF] p-5 bg-[#F8F9FA] space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-bold text-[#212529]">
                  <Users className="h-5 w-5 text-[#7135E8]" />
                  <span>
                    Volunteer Cohort: {acceptedCount} of {capacity} Confirmed
                  </span>
                </div>
                <span className="font-bold text-[#16A34A]">
                  {availablePositions} spots available
                </span>
              </div>

              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E9ECEF]">
                <div
                  className="h-full rounded-full bg-[#7135E8] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[#6C757D]">
                <span>Status: {activity.status}</span>
                <span>{progressPercent}% of target capacity</span>
              </div>
            </div>

            {/* ── Accepted Members Section ──────────────────── */}
            <div className="rounded-xl border border-[#E9ECEF] p-5 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#212529]">
                    Confirmed Volunteer Members ({participants.length})
                  </h3>
                  <p className="text-xs text-[#6C757D]">
                    Volunteers accepted by the organization to participate in this mission
                  </p>
                </div>

                {participants.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsMembersModalOpen(true)}
                    className="text-xs font-bold text-[#7135E8] hover:underline"
                  >
                    View All Roster
                  </button>
                )}
              </div>

              {participants.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#6C757D]">
                  <Users className="mx-auto h-8 w-8 text-[#CED4DA] mb-2" />
                  <p className="font-semibold text-[#212529]">
                    No volunteers accepted yet
                  </p>
                  <p className="text-[11px] mt-0.5">
                    Applications are currently being reviewed by the organizing team.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {participants.slice(0, 4).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-[#E9ECEF] bg-[#F8F9FA]/60"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white bg-[#26183D] text-white">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name || "Volunteer"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-bold text-xs bg-[#7135E8] text-white">
                            {member.name?.charAt(0).toUpperCase() || "V"}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-bold text-xs text-[#212529] truncate">
                            {member.name || "Volunteer"}
                          </p>
                          <CheckCircle2 className="h-3 w-3 text-[#16A34A] shrink-0" />
                        </div>
                        <p className="text-[11px] text-[#6C757D] truncate">
                          {member.skills?.[0] || member.location || "Confirmed Member"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Application Call to Action Section ───────── */}
            <div className="rounded-xl border border-[#7135E8]/30 bg-gradient-to-r from-[#26183D] to-[#382451] p-6 text-white shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold">
                    Ready to Make an Impact?
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-md">
                    Join this volunteering mission to contribute your skills, earn certified community hours, and connect with like-minded changemakers.
                  </p>
                </div>

                <div>
                  {isBeneficiary ? (
                    <>
                      {applicationStatus === "accepted" ? (
                        <div className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-[#16A34A] shadow-xs">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Application Accepted!</span>
                        </div>
                      ) : applicationStatus === "pending" ? (
                        <div className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-[#D97706] shadow-xs">
                          <Clock className="h-4 w-4" />
                          <span>Application Pending Review</span>
                        </div>
                      ) : availablePositions === 0 ? (
                        <div className="rounded-xl bg-white/20 px-5 py-2.5 text-xs font-bold text-white">
                          Mission Fully Booked
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={applyMutation.isPending}
                          onClick={() => applyMutation.mutate()}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#7135E8] px-6 py-3 text-xs font-bold text-white hover:bg-[#5e26cb] disabled:opacity-50 transition-all shadow-md"
                        >
                          {applyMutation.isPending && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          <span>Apply as Volunteer</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-xs font-semibold text-slate-300">
                      Applications are open to registered Beneficiaries
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Social Interactions & Comments ────────────── */}
            <div className="border-t border-[#E9ECEF] pt-6 space-y-5">
              <div className="flex items-center justify-between text-xs text-[#6C757D]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleLike}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-colors ${
                      isLiked ? "text-[#DC3545] bg-red-50" : "hover:bg-[#F4F6F9] hover:text-[#212529]"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                    <span>{likesCount} Likes</span>
                  </button>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 font-bold text-[#212529]">
                    <MessageCircle className="h-4 w-4 text-[#7135E8]" />
                    <span>{comments.length} Discussion Notes</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold hover:bg-[#F4F6F9] text-[#212529]"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>

              {/* Add Comment Input Form */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question or share a note about this mission..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 rounded-xl border border-[#DEE2E6] px-4 py-2 text-xs text-[#212529] focus:border-[#7135E8] focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#7135E8] px-4 py-2 text-xs font-bold text-white hover:bg-[#5e26cb] disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Post</span>
                </button>
              </form>

              {/* Comments Thread */}
              <div className="space-y-3">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E9ECEF] bg-[#F8F9FA]/50 text-xs"
                  >
                    <div className="h-8 w-8 rounded-full bg-[#7135E8] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {c.userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#212529]">{c.userName}</span>
                          <span className="text-[10px] rounded bg-[#E9ECEF] px-1.5 py-0.2 font-semibold text-[#6C757D]">
                            {c.userRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#ADB5BD]">{c.createdAt}</span>
                      </div>
                      <p className="mt-1 text-[#495057] leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Complete Accepted Members Modal */}
      <AcceptedMembersModal
        activityId={activity.id}
        activityTitle={activity.title}
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
      />
    </SocialLayout>
  );
}
