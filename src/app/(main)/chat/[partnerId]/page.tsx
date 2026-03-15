"use client";

import { use } from "react";
import { PartnerConversation } from "@/components/chat/partner-conversation";

export default function PartnerChatPage({
  params,
}: {
  params: Promise<{ partnerId: string }>;
}) {
  const { partnerId } = use(params);
  return (
    <div className="-mx-4 -mt-4 -mb-20 md:-mx-6 md:-mt-6 md:-mb-6">
      <PartnerConversation partnerId={partnerId} />
    </div>
  );
}
