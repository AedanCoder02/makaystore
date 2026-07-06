import { auth, currentUser } from "@clerk/nextjs/server";

export type UserRole = "customer" | "worker" | "supervisor" | "admin";

export async function getAuth() {
  return await auth();
}

export async function getCurrentUser() {
  return await currentUser();
}

export async function getUserRole(): Promise<UserRole> {
  const user = await currentUser();
  if (!user) return "customer";
  const role = user.publicMetadata?.role as UserRole | undefined;
  return role ?? "customer";
}

export function isAuthorized(role: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(role);
}
