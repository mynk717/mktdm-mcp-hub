import React from 'react';
import { cn } from "@/lib/utils";

export const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-glass-bg backdrop-blur-lg border border-glass-border rounded-xl p-6 shadow-xl", className)}>
    {children}
  </div>
);
