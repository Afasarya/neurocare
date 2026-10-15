export const CAREGIVER_FEATURE_FLAG = "FEATURE_F11_CAREGIVER_REMINDERS" as const;

export function isCaregiverFeatureEnabled(value = process.env.FEATURE_F11_CAREGIVER_REMINDERS) {
  return value?.trim().toLowerCase() === "true";
}

export function getCaregiverNavigationItem(value = process.env.FEATURE_F11_CAREGIVER_REMINDERS) {
  return isCaregiverFeatureEnabled(value)
    ? { href: "/app/caregiver" as const, label: "Caregiver & pengingat" as const }
    : null;
}
