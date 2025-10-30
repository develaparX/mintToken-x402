"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "purple" | "green" | "blue";
  text?: string;
}

export function LoadingSpinner({
  size = "md",
  color = "purple",
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorClasses = {
    purple: "border-purple-500",
    green: "border-green-500",
    blue: "border-blue-500",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`animate-spin ${sizeClasses[size]} border-2 ${colorClasses[color]} border-t-transparent rounded-full`}
      />
      {text && <div className="text-white text-sm font-medium">{text}</div>}
    </div>
  );
}
