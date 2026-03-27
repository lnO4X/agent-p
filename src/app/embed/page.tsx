"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Code, Eye } from "lucide-react";

const BASE_URL = "https://gametan.ai";

const EMBED_SNIPPET = `<script src="${BASE_URL}/embed.js" data-width="400" data-height="500"></script>`;
const IFRAME_SNIPPET = `<iframe
  src="${BASE_URL}/embed/quiz"
  width="400"
  height="500"
  style="border:none;border-radius:12px;"
  allow="autoplay"
></iframe>`;

function detectZh(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.language.startsWith("zh");
}

export default function EmbedInfoPage() {
  const [isZh, setIsZh] = useState(true);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);

  useEffect(() => {
    setIsZh(detectZh());
  }, []);

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
            🎮 {isZh ? "嵌入 GameTan 测试" : "Embed GameTan Quiz"}
          </h1>
          <p className="text-gray-400">
            {isZh
              ? "在你的网站上嵌入玩家原型测试，让访客发现他们的游戏 DNA"
              : "Embed the gamer archetype quiz on your website and let visitors discover their gaming DNA"}
          </p>
        </div>

        {/* Method 1: Script tag */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Code size={18} className="text-blue-400" />
            <h2 className="text-lg font-semibold">
              {isZh ? "方式一：Script 标签（推荐）" : "Method 1: Script Tag (Recommended)"}
            </h2>
          </div>
          <p className="text-sm text-gray-400">
            {isZh
              ? "添加一行代码即可。支持自定义宽高。"
              : "Just one line of code. Supports custom width and height."}
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
              {isZh ? "宽度（默认 400px）" : "Width (default 400px)"}
            </div>
            <div>
              <code className="text-gray-400">data-height</code> —{" "}
              {isZh ? "高度（默认 500px）" : "Height (default 500px)"}
            </div>
          </div>
        </section>

        {/* Method 2: iframe */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Code size={18} className="text-primary" />
            <h2 className="text-lg font-semibold">
              {isZh ? "方式二：直接 iframe" : "Method 2: Direct iframe"}
            </h2>
          </div>
          <p className="text-sm text-gray-400">
            {isZh
              ? "如果你需要更多控制，直接使用 iframe。"
              : "For more control, use a direct iframe."}
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
              {isZh ? "预览" : "Preview"}
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
          — {isZh ? "发现你的游戏 DNA" : "Discover Your Gaming DNA"}
        </div>
      </div>
    </div>
  );
}
