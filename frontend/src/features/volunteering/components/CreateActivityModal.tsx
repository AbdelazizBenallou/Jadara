import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Calendar, MapPin, Users, Upload, Sparkles, Loader2, PlusCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { createActivity } from "@/api/activities";
import { listActivityCategories } from "@/api/activity-categories";
import { listSkills } from "@/api/skills";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/notify";

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateActivityModal({ isOpen, onClose }: CreateActivityModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [capacity, setCapacity] = useState<number>(20);
  const [requirements, setRequirements] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [authFile, setAuthFile] = useState<File | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.volunteering.categories,
    queryFn: listActivityCategories,
    enabled: isOpen,
  });

  const { data: allSkills = [] } = useQuery({
    queryKey: queryKeys.skills.list({ limit: 100 }),
    queryFn: () => listSkills({ limit: 100 }),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required");
      if (!startDate) throw new Error("Start date is required");
      if (!endDate) throw new Error("End date is required");
      if (!authFile) throw new Error("Authorization document is required by policy");

      const fd = new FormData();
      fd.append("title", title);
      if (description) fd.append("description", description);
      if (categoryId) fd.append("category_id", categoryId);
      if (location) fd.append("location", location);
      fd.append("start_date", new Date(startDate).toISOString());
      fd.append("end_date", new Date(endDate).toISOString());
      if (registrationDeadline) {
        fd.append("registration_deadline", new Date(registrationDeadline).toISOString());
      }
      fd.append("capacity", String(capacity));
      if (requirements) fd.append("requirements", requirements);
      selectedSkills.forEach((id) => {
        fd.append("required_skill_ids[]", String(id));
      });
      fd.append("authorization_file", authFile);

      return createActivity(fd);
    },
    onSuccess: () => {
      toast.success("Activity submitted for admin review successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.volunteering.all });
      onClose();
      // Reset form
      setTitle("");
      setDescription("");
      setCategoryId("");
      setLocation("");
      setStartDate("");
      setEndDate("");
      setRegistrationDeadline("");
      setCapacity(20);
      setRequirements("");
      setSelectedSkills([]);
      setAuthFile(null);
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to create activity"));
    },
  });

  if (!isOpen) return null;

  const toggleSkill = (id: number) => {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-[#E9ECEF] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9ECEF] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="h-5 w-5 text-[#7135E8]" />
            <div>
              <h3 className="text-base font-bold text-[#212529]">
                Create Volunteering Activity
              </h3>
              <p className="text-xs text-[#6C757D]">
                Publish a mission for beneficiaries across JADARA community
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6C757D] hover:bg-[#F4F6F9] hover:text-[#212529]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="flex-1 overflow-y-auto p-6 space-y-4 text-xs"
        >
          {/* Title */}
          <div>
            <label className="block font-bold text-[#212529] mb-1">
              Activity Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Coastal Conservation & Marine Protection"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[#DEE2E6] p-2.5 text-xs text-[#212529] focus:border-[#7135E8] focus:outline-hidden"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-[#212529] mb-1">
              Description & Objectives
            </label>
            <textarea
              rows={3}
              placeholder="Describe the mission, tasks, and community impact..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-[#DEE2E6] p-2.5 text-xs text-[#212529] focus:border-[#7135E8] focus:outline-hidden"
            />
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#212529] mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-[#DEE2E6] p-2.5 text-xs bg-white text-[#212529] focus:border-[#7135E8] focus:outline-hidden"
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#212529] mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ADB5BD]" />
                <input
                  type="text"
                  placeholder="e.g. Algiers, Algeria"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-[#DEE2E6] pl-9 pr-3 py-2.5 text-xs text-[#212529] focus:border-[#7135E8] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Dates & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#212529] mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-[#DEE2E6] p-2 text-xs text-[#212529]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#212529] mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-[#DEE2E6] p-2 text-xs text-[#212529]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#212529] mb-1">
                Capacity (Volunteers)
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full rounded-lg border border-[#DEE2E6] p-2 text-xs text-[#212529]"
              />
            </div>
          </div>

          {/* Registration Deadline */}
          <div>
            <label className="block font-bold text-[#212529] mb-1">
              Registration Deadline (Optional)
            </label>
            <input
              type="date"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className="w-full sm:w-1/2 rounded-lg border border-[#DEE2E6] p-2 text-xs text-[#212529]"
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block font-bold text-[#212529] mb-1">
              Participation Conditions & Requirements
            </label>
            <input
              type="text"
              placeholder="e.g. Field clothing, team spirit, basic computer literacy"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full rounded-lg border border-[#DEE2E6] p-2.5 text-xs text-[#212529]"
            />
          </div>

          {/* Required Skills Selection */}
          <div>
            <label className="block font-bold text-[#212529] mb-1.5">
              Required Skills (Optional)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-lg border border-[#E9ECEF] bg-[#F8F9FA]/50">
              {allSkills.slice(0, 30).map((s) => {
                const selected = selectedSkills.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSkill(s.id)}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                      selected
                        ? "bg-[#7135E8] text-white"
                        : "bg-white text-[#495057] border border-[#DEE2E6] hover:border-[#7135E8]"
                    }`}
                  >
                    {selected && <Check className="h-3 w-3" />}
                    <span>{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mandatory Authorization Document */}
          <div className="rounded-xl border border-dashed border-[#CED4DA] p-4 bg-[#F8F9FA] text-center">
            <Upload className="mx-auto h-7 w-7 text-[#7135E8] mb-1.5" />
            <p className="font-bold text-xs text-[#212529]">
              Official Authorization Document *
            </p>
            <p className="text-[11px] text-[#6C757D] mt-0.5">
              Upload institutional authorization or permit (PDF, DOCX, PNG, JPG)
            </p>

            <input
              ref={fileInputRef}
              type="file"
              required
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(e) => {
                if (e.target.files?.[0]) setAuthFile(e.target.files[0]);
              }}
              className="hidden"
            />

            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-white border border-[#DEE2E6] px-3 py-1.5 text-xs font-bold text-[#212529] hover:border-[#7135E8] transition-colors"
              >
                Choose Document
              </button>
              {authFile && (
                <span className="text-xs font-semibold text-[#16A34A] truncate max-w-xs">
                  {authFile.name} ({(authFile.size / 1024).toFixed(0)} KB)
                </span>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[#E9ECEF]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#DEE2E6] px-4 py-2 text-xs font-bold text-[#6C757D] hover:bg-[#F4F6F9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-[#7135E8] px-5 py-2 text-xs font-bold text-white hover:bg-[#5e26cb] disabled:opacity-50 shadow-xs"
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span>Submit for Moderation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
