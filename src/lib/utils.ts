import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  // New statuses
  lead_created: "Lead Created",
  code_sent: "Code Sent",
  homeowner_verified: "Homeowner Verified",
  awaiting_business: "Under Review",
  more_info_requested: "More Info Needed",
  accepted: "Accepted",
  rejected: "Rejected",
  awaiting_deposit: "Awaiting Deposit",
  confirmed: "Deposit Paid",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  commission_payable: "Commission Payable",
  commission_paid: "Commission Paid",
  disputed: "Disputed",
  cancelled: "Cancelled",
  // Legacy
  pending_review: "Pending Review",
  declined: "Declined",
};

export const JOB_STATUS_COLORS: Record<string, string> = {
  lead_created: "bg-slate-100 text-slate-700",
  code_sent: "bg-purple-100 text-purple-700",
  homeowner_verified: "bg-indigo-100 text-indigo-700",
  awaiting_business: "bg-amber-100 text-amber-800",
  more_info_requested: "bg-orange-100 text-orange-700",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  awaiting_deposit: "bg-blue-100 text-blue-800",
  confirmed: "bg-teal-100 text-teal-800",
  scheduled: "bg-cyan-100 text-cyan-800",
  in_progress: "bg-violet-100 text-violet-800",
  completed: "bg-slate-100 text-slate-700",
  commission_payable: "bg-green-100 text-green-800",
  commission_paid: "bg-green-200 text-green-900",
  disputed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
  pending_review: "bg-amber-100 text-amber-800",
  declined: "bg-red-100 text-red-800",
};
