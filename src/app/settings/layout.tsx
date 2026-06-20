import SettingsSidebar from "@/components/layout/SettingsSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900/50 flex">
      {/* Settings sidebar fixed on the left */}
      <SettingsSidebar />
      
      {/* Main content area, pushed to the right by the sidebar width */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen overflow-hidden">
        {/* Top navbar */}
        <header className="h-16 border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-end px-6">
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
