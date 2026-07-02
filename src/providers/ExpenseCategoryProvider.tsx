"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface ExpenseCategory {
  id: string;
  nameBN: string;
  nameEN: string;
}

interface ExpenseCategoryContextType {
  categories: ExpenseCategory[];
  addCategory: (category: Omit<ExpenseCategory, "id">) => void;
  updateCategory: (id: string, category: Omit<ExpenseCategory, "id">) => void;
  deleteCategory: (id: string) => void;
  isLoaded: boolean;
}

const defaultCategories: ExpenseCategory[] = [
  { id: "OFFICE_RENT", nameBN: "অফিস ভাড়া", nameEN: "Office Rent" },
  { id: "TRANSPORT", nameBN: "যাতায়াত খরচ", nameEN: "Transport" },
  { id: "ENTERTAINMENT", nameBN: "আপ্যায়ন খরচ", nameEN: "Entertainment" },
  { id: "LAND_PURCHASE", nameBN: "ভূমি ও সম্পত্তি ক্রয়", nameEN: "Land Purchase" },
  { id: "SALARY", nameBN: "বেতন (৫ বছরের জন্য লকড)", nameEN: "Salary (Locked for 5 Years)" },
  { id: "OTHER", nameBN: "অন্যান্য খরচ", nameEN: "Other Expense" },
];

const ExpenseCategoryContext = createContext<ExpenseCategoryContextType | undefined>(undefined);

export function ExpenseCategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<ExpenseCategory[]>(defaultCategories);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedCategories = localStorage.getItem("expenseCategories");
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch (err) {
        console.error("Failed to parse saved expense categories", err);
      }
    }
    setIsLoaded(true);
  }, []);

  const addCategory = (category: Omit<ExpenseCategory, "id">) => {
    const newCategory: ExpenseCategory = {
      ...category,
      id: `CAT_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    };
    const newCategories = [...categories, newCategory];
    setCategories(newCategories);
    localStorage.setItem("expenseCategories", JSON.stringify(newCategories));
  };

  const updateCategory = (id: string, updatedData: Omit<ExpenseCategory, "id">) => {
    const newCategories = categories.map((cat) =>
      cat.id === id ? { ...cat, ...updatedData } : cat
    );
    setCategories(newCategories);
    localStorage.setItem("expenseCategories", JSON.stringify(newCategories));
  };

  const deleteCategory = (id: string) => {
    const newCategories = categories.filter((cat) => cat.id !== id);
    setCategories(newCategories);
    localStorage.setItem("expenseCategories", JSON.stringify(newCategories));
  };

  return (
    <ExpenseCategoryContext.Provider
      value={{ categories, addCategory, updateCategory, deleteCategory, isLoaded }}
    >
      {children}
    </ExpenseCategoryContext.Provider>
  );
}

export function useExpenseCategory() {
  const context = useContext(ExpenseCategoryContext);
  if (context === undefined) {
    throw new Error("useExpenseCategory must be used within an ExpenseCategoryProvider");
  }
  return context;
}
