"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/providers/LanguageProvider";
import ProjectForm from "@/components/forms/ProjectForm";

export default function NewProjectPage() {
  const { lang } = useLanguage();
  const router = useRouter();

  const labels = {
    BN: {
      title: "নতুন প্রজেক্ট তৈরি ও বিনিয়োগ",
      subtitle: "নতুন প্রজেক্ট তৈরি করুন বা বিদ্যমান প্রজেক্টে বিনিয়োগ এন্ট্রি করুন",
      back: "ফিরে যান"
    },
    EN: {
      title: "New Project & Investment",
      subtitle: "Setup a new project or record an investment",
      back: "Go Back"
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4 border-gray-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{labels[lang].title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{labels[lang].subtitle}</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/projects")}
          className="px-4 py-2 border rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
        >
          {labels[lang].back}
        </button>
      </div>

      <div className="flex justify-center pt-4">
        <ProjectForm onSuccess={() => {
          setTimeout(() => {
            router.push("/dashboard/projects");
          }, 1000);
        }} />
      </div>
    </div>
  );
}
