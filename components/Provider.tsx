import { ClerkProvider } from "@clerk/nextjs";
import React, { ReactNode } from "react";

export default function Provider({ children }: { children: ReactNode }) {
  return (
    <>
      <ClerkProvider>{children}</ClerkProvider>
    </>
  );
}
