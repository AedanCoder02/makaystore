"use client";

import { useEffect, useState } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import type { UserRole } from "@/lib/auth";

interface UseAuthReturn {
  userId: string | null | undefined;
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  role: UserRole;
  isAuthorized: (requiredRoles: UserRole[]) => boolean;
}

export function useAuth(): UseAuthReturn {
  const { userId, isLoaded, isSignedIn } = useClerkAuth();
  const { user } = useUser();
  const [role, setRole] = useState<UserRole>("customer");

  useEffect(() => {
    if (user?.publicMetadata?.role) {
      setRole(user.publicMetadata.role as UserRole);
    } else {
      setRole("customer");
    }
  }, [user]);

  const isAuthorized = (requiredRoles: UserRole[]): boolean => {
    return requiredRoles.includes(role);
  };

  return {
    userId,
    isLoaded,
    isSignedIn,
    role,
    isAuthorized,
  };
}
