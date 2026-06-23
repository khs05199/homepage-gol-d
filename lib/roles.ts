export const LEADERSHIP = ["회장", "부회장", "관리자"] as const;
export const isLeadership = (role?: string | null) =>
  !!role && (LEADERSHIP as readonly string[]).includes(role);
