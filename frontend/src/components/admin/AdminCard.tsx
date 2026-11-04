import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminCardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  headerActions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  maximizable?: boolean;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
}

export function AdminCard({
  title,
  subtitle,
  icon: Icon,
  headerActions,
  children,
  footer,
  collapsible = false,
  defaultCollapsed = false,
  maximizable = false,
  className,
  bodyClassName,
  headerClassName,
  footerClassName,
}: AdminCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [maximized, setMaximized] = useState(false);

  const hasHeader = !!(title || subtitle || Icon || headerActions || collapsible || maximizable);

  return (
    <div
      className={cn(
        "admin-card rounded-lg border border-[#E9ECEF] bg-white text-[#212529] shadow-[0_0_1px_rgba(0,0,0,0.125),0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-200",
        maximized &&
          "fixed inset-4 z-50 overflow-auto border-2 border-[#0D6EFD] shadow-2xl md:inset-8",
        className,
      )}
    >
      {/* Header */}
      {hasHeader && (
        <div
          className={cn(
            "admin-card-header flex items-center justify-between border-b border-[#E9ECEF] px-5 py-3.5",
            headerClassName,
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <span className="text-[#0D6EFD] shrink-0">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-[15px] font-bold text-[#212529] leading-tight truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-[#6C757D] mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Actions & Tools */}
          <div className="flex items-center gap-1.5 shrink-0 ms-3">
            {headerActions}

            {collapsible && (
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="inline-flex h-7 w-7 items-center justify-center rounded text-[#6C757D] hover:bg-[#F4F6F9] hover:text-[#212529] transition-colors"
                title={collapsed ? "Expand" : "Collapse"}
                aria-label={collapsed ? "Expand" : "Collapse"}
              >
                {collapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
            )}

            {maximizable && (
              <button
                type="button"
                onClick={() => setMaximized(!maximized)}
                className="inline-flex h-7 w-7 items-center justify-center rounded text-[#6C757D] hover:bg-[#F4F6F9] hover:text-[#212529] transition-colors"
                title={maximized ? "Minimize" : "Maximize"}
                aria-label={maximized ? "Minimize" : "Maximize"}
              >
                {maximized ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      {!collapsed && (
        <div className={cn("admin-card-body p-5", bodyClassName)}>
          {children}
        </div>
      )}

      {/* Footer */}
      {!collapsed && footer && (
        <div
          className={cn(
            "admin-card-footer border-t border-[#E9ECEF] bg-[#F8F9FA] px-5 py-3 rounded-b-lg text-sm",
            footerClassName,
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
