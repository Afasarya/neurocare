export function getMostSpecificActiveHref(pathname: string, hrefs: readonly string[]) {
  return hrefs
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((left, right) => right.length - left.length)[0] ?? null;
}

export type MobilePrimaryKey = "home" | "prevent" | "recovery" | "timeline" | "menu";

export function getMobilePrimaryActiveKey(pathname: string): MobilePrimaryKey {
  if (pathname === "/app/dashboard") return "home";
  if (
    pathname === "/app/screening" ||
    pathname.startsWith("/app/screening/") ||
    pathname === "/app/pulse-monitor" ||
    pathname === "/app/insights"
  ) return "prevent";
  if (pathname === "/app/recovery" || pathname.startsWith("/app/recovery/")) return "recovery";
  if (pathname === "/app/timeline") return "timeline";
  return "menu";
}
