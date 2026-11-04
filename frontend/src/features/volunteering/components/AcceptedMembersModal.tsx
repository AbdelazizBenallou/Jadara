import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Search, Users, Sparkles, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { getActivityParticipants } from "@/api/activities";
import { queryKeys } from "@/lib/query-keys";

interface AcceptedMembersModalProps {
  activityId: number;
  activityTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AcceptedMembersModal({
  activityId,
  activityTitle,
  isOpen,
  onClose,
}: AcceptedMembersModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: participants = [], isLoading } = useQuery({
    queryKey: queryKeys.volunteering.participants(activityId),
    queryFn: () => getActivityParticipants(activityId),
    enabled: isOpen && !!activityId,
  });

  if (!isOpen) return null;

  const filtered = participants.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(term);
    const skillMatch = p.skills?.some((s) => s.toLowerCase().includes(term));
    const locMatch = p.location?.toLowerCase().includes(term);
    return nameMatch || skillMatch || locMatch;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-[#E9ECEF] overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9ECEF] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-[#7135E8]" />
            <div>
              <h3 className="text-base font-bold text-[#212529]">
                Accepted Volunteers
              </h3>
              <p className="text-xs text-[#6C757D] truncate max-w-xs">
                {activityTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6C757D] hover:bg-[#F4F6F9] hover:text-[#212529] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Count */}
        <div className="px-6 py-3 border-b border-[#E9ECEF] bg-[#F8F9FA]/60">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ADB5BD]" />
              <input
                type="text"
                placeholder="Search accepted volunteers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#DEE2E6] bg-white pl-9 pr-3 py-1.5 text-xs text-[#212529] placeholder:text-[#ADB5BD] focus:border-[#7135E8] focus:outline-hidden"
              />
            </div>
            <span className="text-xs font-semibold text-[#6C757D] shrink-0">
              <span className="font-bold text-[#7135E8]">{participants.length}</span> confirmed
            </span>
          </div>
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#6C757D]">
              <Loader2 className="h-8 w-8 animate-spin text-[#7135E8] mb-2" />
              <p className="text-xs font-medium">Loading accepted members...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-[#6C757D]">
              <Users className="mx-auto h-10 w-10 text-[#CED4DA] mb-2" />
              <p className="text-sm font-semibold text-[#212529]">
                {searchTerm ? "No volunteers match your search" : "No volunteers accepted yet"}
              </p>
              <p className="text-xs text-[#6C757D] mt-0.5">
                {searchTerm
                  ? "Try searching with a different name or skill tag."
                  : "Accepted volunteers for this activity will appear here."}
              </p>
            </div>
          ) : (
            filtered.map((member) => (
              <div
                key={member.id}
                className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-[#E9ECEF] bg-white hover:border-[#7135E8]/40 transition-colors shadow-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#E9ECEF] bg-[#26183D] text-white">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name || "Volunteer"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-bold text-sm bg-[#7135E8] text-white">
                        {member.name?.charAt(0).toUpperCase() || "V"}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-[#212529] truncate">
                        {member.name || "Anonymous Volunteer"}
                      </h4>
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
                    </div>

                    {member.location && (
                      <p className="flex items-center gap-1 text-[11px] text-[#6C757D] mt-0.5">
                        <MapPin className="h-3 w-3 text-[#DC3545]" />
                        <span className="truncate">{member.location}</span>
                      </p>
                    )}

                    {member.bio && (
                      <p className="text-[11px] text-[#6C757D] mt-1 line-clamp-1">
                        {member.bio}
                      </p>
                    )}

                    {member.skills && member.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded bg-[#F4F6F9] px-2 py-0.5 text-[10px] font-semibold text-[#7135E8] border border-[#E9ECEF]"
                          >
                            <Sparkles className="h-2.5 w-2.5 text-[#16A34A]" />
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <span className="shrink-0 text-[10px] font-bold text-[#16A34A] bg-white border border-[#16A34A] rounded-full px-2 py-0.5">
                  Accepted
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E9ECEF] bg-[#F8F9FA] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#7135E8] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5e26cb] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
