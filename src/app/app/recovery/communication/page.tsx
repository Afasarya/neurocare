import { notFound } from "next/navigation";
import { CommunicationRehabView } from "@/features/communication-rehab/components/communication-rehab-view";
import { isCommunicationRehabEnabled } from "@/features/communication-rehab/communication-rehab.flags";

export default function CommunicationRehabPage() {
  if (!isCommunicationRehabEnabled()) notFound();
  return <CommunicationRehabView />;
}
