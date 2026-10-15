export const COMMUNICATION_REHAB_FEATURE_FLAG = "FEATURE_F09_COMMUNICATION_REHAB" as const;

export function isCommunicationRehabEnabled(value = process.env.FEATURE_F09_COMMUNICATION_REHAB) {
  return value?.trim().toLowerCase() === "true";
}

export function getCommunicationRehabNavigationItem(value = process.env.FEATURE_F09_COMMUNICATION_REHAB) {
  return isCommunicationRehabEnabled(value)
    ? { href: "/app/recovery/communication" as const, label: "Kartu komunikasi" as const }
    : null;
}
