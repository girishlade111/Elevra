import * as React from "react";
import { cn } from "@/lib/utils";

interface DenseRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function DenseRow({
  label,
  description,
  action,
  className,
  children,
  ...props
}: DenseRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-3 px-4 border-b border-border transition-colors hover:bg-surface-secondary/40 last:border-b-0",
        className
      )}
      {...props}
    >
      <div className="flex flex-col pr-4">
        <div className="text-[13.5px] font-medium text-text-primary">{label}</div>
        {description && (
          <div className="text-[12.5px] text-text-secondary mt-0.5">{description}</div>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {action}
        {children}
      </div>
    </div>
  );
}
