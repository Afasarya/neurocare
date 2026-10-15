import { notFound } from "next/navigation";
import { CaregiverControlView } from "@/features/caregiver/components/caregiver-control-view";
import { isCaregiverFeatureEnabled } from "@/features/caregiver/caregiver.flags";

export default function CaregiverPage() {
  if (!isCaregiverFeatureEnabled()) notFound();
  return <CaregiverControlView />;
}
