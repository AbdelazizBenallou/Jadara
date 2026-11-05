import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, HeartHandshake, PlusCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SocialSidebar } from "./SocialSidebar";
import { SocialRightSidebar } from "./SocialRightSidebar";
import { CreateActivityModal } from "./CreateActivityModal";

interface SocialLayoutProps {
  children: ReactNode;
  rightSidebar?: ReactNode;
  onSearchChange?: (term: string) => void;
  onCategorySelect?: (categoryId: number | null) => void;
  selectedCategoryId?: number | null;
}

export function SocialLayout({
  children,
  rightSidebar,
  onSearchChange,
  onCategorySelect,
  selectedCategoryId,
}: SocialLayoutProps) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isOrganization = user?.role?.toLowerCase() === "organization";

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#212529]">
      {/* ── Mobile Top Navigation Bar ─────────────────────── */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-[#382451] bg-[#26183D] px-4 py-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-lg p-1.5 text-[#c2c7d0] hover:bg-[#382451]"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7135E8] text-white shadow-xs">
              <span className="font-black text-sm">J</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-sm tracking-tight text-white">
                JADARA
              </span>
              <span className="text-[9px] font-semibold text-[#ADB5BD] uppercase tracking-wider">
                Volunteering
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {isOrganization && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#7135E8] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#5e26cb]"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Create</span>
            </button>
          )}

          <Link to="/dashboard/profile">
            <div className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-[#7135E8] bg-[#26183D] text-white">
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
          </Link>
        </div>
      </header>

      {/* ── Mobile Drawer Backdrop & Sidebar ─────────────── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-[#26183D] text-white shadow-2xl flex flex-col border-r border-[#382451] animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#382451]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7135E8] text-white font-bold text-xs">
                  J
                </span>
                <span className="font-bold text-sm text-white">JADARA Menu</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-[#ADB5BD] rounded-lg hover:bg-[#382451] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <SocialSidebar
                onCreateActivityClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsCreateModalOpen(true);
                }}
                className="border-0 shadow-none h-full rounded-none static"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── 3-Column Social Container ─────────────────────── */}
      <div className="mx-auto max-w-7xl px-2 sm:px-4 py-4 lg:py-6">
        <div className="flex gap-6 items-start justify-center">
          {/* Column 1: Left Persistent Sidebar (Desktop) */}
          <div className="hidden lg:block w-64 shrink-0 sticky top-4">
            <SocialSidebar
              onCreateActivityClick={() => setIsCreateModalOpen(true)}
            />
          </div>

          {/* Column 2: Center Main Feed Column (Scrolls naturally) */}
          <main className="flex-1 max-w-2xl w-full min-w-0">
            {children}
          </main>

          {/* Column 3: Right Discovery Widgets Column (Desktop) */}
          <div className="hidden xl:block w-80 shrink-0 sticky top-4">
            {rightSidebar ?? (
              <SocialRightSidebar
                onSearchChange={onSearchChange}
                onCategorySelect={onCategorySelect}
                selectedCategoryId={selectedCategoryId}
              />
            )}
          </div>
        </div>
      </div>

      {/* Create Activity Modal */}
      <CreateActivityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
