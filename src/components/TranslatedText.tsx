"use client";

import { ReactNode } from "react";

interface TranslatedTextProps {
  children: ReactNode;
  className?: string;
}

export const TranslatedText = ({ children, className }: TranslatedTextProps) => {
  return (
    <span className={className} suppressHydrationWarning>
      {children}
    </span>
  );
};
