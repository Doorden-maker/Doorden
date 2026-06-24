import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg";
}

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide",
        {
          "bg-[#0f2044] text-white hover:bg-[#1a3360] focus-visible:ring-[#0f2044] shadow-sm": variant === "default",
          "border-2 border-[#0f2044] text-[#0f2044] bg-white hover:bg-[#f0f4ff]": variant === "outline",
          "hover:bg-slate-100 text-slate-700": variant === "ghost",
          "bg-red-600 text-white hover:bg-red-700 shadow-sm": variant === "destructive",
          "bg-slate-100 text-slate-800 hover:bg-slate-200": variant === "secondary",
        },
        {
          "h-10 px-5 py-2 text-sm": size === "default",
          "h-8 px-3 text-xs": size === "sm",
          "h-12 px-7 text-base": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}
