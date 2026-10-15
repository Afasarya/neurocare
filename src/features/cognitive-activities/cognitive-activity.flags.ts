export const COGNITIVE_ACTIVITY_FEATURE_FLAG = "FEATURE_F10_COGNITIVE_ACTIVITIES" as const;

export function isCognitiveActivityEnabled(value = process.env.FEATURE_F10_COGNITIVE_ACTIVITIES) {
  return value?.trim().toLowerCase() === "true";
}

export function getCognitiveActivityNavigationItem(value = process.env.FEATURE_F10_COGNITIVE_ACTIVITIES) {
  return isCognitiveActivityEnabled(value)
    ? { href: "/app/recovery/cognitive-activity" as const, label: "Aktivitas kognitif" as const }
    : null;
}
