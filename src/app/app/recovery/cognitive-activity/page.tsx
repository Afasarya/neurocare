import { notFound } from "next/navigation";
import { CognitiveActivityView } from "@/features/cognitive-activities/components/cognitive-activity-view";
import { isCognitiveActivityEnabled } from "@/features/cognitive-activities/cognitive-activity.flags";

export default function CognitiveActivityPage() {
  if (!isCognitiveActivityEnabled()) notFound();
  return <CognitiveActivityView />;
}
