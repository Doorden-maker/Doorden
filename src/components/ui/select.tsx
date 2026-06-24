import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2044] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-shadow appearance-none cursor-pointer",
        className
      )}
      {...props}
    />
  );
}
