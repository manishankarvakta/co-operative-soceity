"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { ExpenseCategoryProvider } from "@/providers/ExpenseCategoryProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <ExpenseCategoryProvider>
          {children}
        </ExpenseCategoryProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
