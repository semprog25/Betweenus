"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

type ToasterComponentProps = ToasterProps & {
  theme?: "light" | "dark" | "system";
};

const Toaster = ({ theme = "system", ...props }: ToasterComponentProps) => {
  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };