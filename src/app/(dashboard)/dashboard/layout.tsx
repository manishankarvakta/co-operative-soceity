import Sidebar from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import RouteGuard from "@/components/layout/RouteGuard";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-gray-50 dark:bg-zinc-900/50 flex overflow-hidden">
      {/* Sidebar fixed on the left */}
      <Sidebar />
      
      {/* Main content area, pushed to the right by the sidebar width */}
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        {/* Optional top navbar could go here */}
        <header className="h-16 border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
          <Breadcrumbs />
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <ThemeToggle />
            <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            <RouteGuard>
              {children}
            </RouteGuard>
          </div>
        </main>
      </div>
    </div>
  );
}
