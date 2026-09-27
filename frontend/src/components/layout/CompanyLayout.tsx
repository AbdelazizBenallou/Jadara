import type { ReactNode } from "react";
import { CompanyNavbar } from "./CompanyNavbar";

export function CompanyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CompanyNavbar />
      <main className="flex-1 py-8 px-4 lg:px-8">{children}</main>
    </div>
  );
}
