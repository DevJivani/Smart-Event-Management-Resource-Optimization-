import React from "react";

const variants = {
  paid: "bg-emerald-100 text-emerald-800",
  success: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-700",
  error: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-indigo-100 text-indigo-800",
  refunded: "bg-purple-100 text-purple-800",
};

const sizes = {
  sm: "text-xs px-3 py-1 rounded-full",
  xs: "text-[11px] px-2 py-0.5 rounded",
  md: "text-sm px-3 py-1.5 rounded-full",
};

const normalize = (v) => (v || "").toString().toLowerCase().trim();

export default function StatusBadge({ value, size = "sm", className = "" }) {
  const v = normalize(value) || "pending";
  const style = variants[v] || variants.pending;
  const sz = sizes[size] || sizes.sm;
  return (
    <span className={`${sz} font-semibold ${style} ${className}`}>
      {value || "pending"}
    </span>
  );
}