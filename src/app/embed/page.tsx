"use client";

import { useState } from "react";
import { Copy, Check, Code, Eye } from "lucide-react";
import { useI18n } from "@/i18n/context";

const BASE_URL = "https://gametan.ai";

const EMBED_SNIPPET = `<script src="${BASE_URL}/embed.js" data-width="400" data-height="500"></script>`;
const IFRAME_SNIPPET = `<iframe
  src="${BASE_URL}/embed/quiz"
  width="400"
  height="500"
  style="border:none;border-radius:12px;"
  allow="autoplay"
></iframe>`;

export default function EmbedInfoPage() {
  const { t } = useI18n();
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);

  const copyToClipboard = (text: string, type: "script" | "iframe") => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "script") {
        setCopiedScript(true);
        setTimeout(() => setCopiedScript(false), 2000);
      } else {
        setCopiedIframe(true);
        setTimeout(() => setCopiedIframe(false), 2000);
      }
    });
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">
            {t("embed.embedTitle")}
          </h1>
          <p className="text-gray-400">
            {t("embed.embedDesc")}
          </p>
        </div>

        {/* Method 1: Script tag */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Code size={18} className="text-blue-400" />
            <h2 className="text-lg font-semibold">
              {t("embed.method1Title")}
            </h2>
          </div>
          <p className="text-sm text-gray-400">
            {t("embed.method1Desc")}
          </p>
          <div className="relative">
            <pre className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto font-mono text-green-400">
              {EMBED_SNIPPET}
            </pre>
            <button
              onClick={() => copyToClipboard(EMBED_SNIPPET, "script")}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {copiedScript ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <Copy size={16} className="text-gray-400" />
              )}
            </button>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>
              <code className="text-gray-400">data-width</code> —{" "}
              {t("embed.widthDefault")}
            </div>
            <div>
              <code className="text-gray-400">data-height</code> —{" "}
              {t("embed.heightDefault")}
            </div>
          </div>
        </section>

        {/* Method 2: iframe */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Code size={18} className="text-primary" />
            <h2 className="text-lg font-semibold">
              {t("embed.method2Title")}
            </h2>
          </div>
          <p className="text-sm text-gray-400">
            {t("embed.method2Desc")}
          </p>
          <div className="relative">
            <pre className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm overflow-x-auto font-mono text-primary whitespace-pre">
              {IFRAME_SNIPPET}
            </pre>
            <button
              onClick={() => copyToClipboard(IFRAME_SNIPPET, "iframe")}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {copiedIframe ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <Copy size={16} className="text-gray-400" />
              )}
            </button>
          </div>
        </section>

        {/* Preview */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-amber-400" />
            <h2 className="text-lg font-semibold">
              {t("embed.preview")}
            </h2>
          </div>
          <div className="flex justify-center">
            <iframe
              src="/embed/quiz"
              width="400"
              height="500"
              style={{ border: "none", borderRadius: 12 }}
              title="GameTan Quiz Embed Preview"
            />
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-4 border-t border-white/10">
          <a
            href={`${BASE_URL}?ref=embed`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            GameTan
          </a>{" "}
          — {t("embed.discoverDna")}
        </div>
      </div>
    </div>
  );
}
