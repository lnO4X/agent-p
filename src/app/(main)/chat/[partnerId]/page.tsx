"use client";

import { use } from "react";
import { PartnerConversation } from "@/components/chat/partner-conversation";
import { ErrorBoundary } from "@/components/error-boundary";

export default function PartnerChatPage({
  params,
}: {
  params: Promise<{ partnerId: string }>;
}) {
  const { partnerId } = use(params);
  return (
    <ErrorBoundary
      fallbackTitle="对话加载失败"
      fallbackTitleEn="Chat failed to load"
    >
      <div className="-mx-4 -mt-4 -mb-20 md:-mx-6 md:-mt-6 md:-mb-6">
        <PartnerConversation partnerId={partnerId} />
      </div>
    </ErrorBoundary>
  );
}
