"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, RefreshCw, Cpu, Check, Key, Plus, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_MODELS = [
  { id: "deepseek/deepseek-chat-v3-0324:free", label: "DeepSeek V3 (Free)", tag: "Free", tier: "free" },
] as const;

const TIER_COLORS: Record<string, string> = {
  premium: "bg-amber-500/15 text-amber-600",
  smart: "bg-blue-500/15 text-blue-600",
  fast: "bg-green-500/15 text-green-600",
  free: "bg-gray-500/15 text-gray-600",
  custom: "bg-purple-500/15 text-purple-600",
};

interface Settings {
  ai_model?: string;
  openrouter_api_key?: string;
  custom_models?: string;
  [key: string]: string | undefined;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [selectedModel, setSelectedModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [savedCustomModels, setSavedCustomModels] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyMasked, setApiKeyMasked] = useState("");
  const [savingModel, setSavingModel] = useState(false);
  const [savedModel, setSavedModel] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [savedKey, setSavedKey] = useState(false);
  const [loading, setLoading] = useState(true);

  const parseCustomModels = useCallback((raw?: string): string[] => {
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter((s: unknown) => typeof s === "string" && s.length > 0) : [];
    } catch { return []; }
  }, []);

  function maskKey(key: string): string {
    if (key.length <= 8) return "****" + key.slice(-4);
    return key.slice(0, 4) + "****" + key.slice(-4);
  }

  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "include" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setSettings(res.data);
          const model = res.data.ai_model || "";
          const customs = parseCustomModels(res.data.custom_models);
          setSavedCustomModels(customs);
          const allPresetIds: string[] = PRESET_MODELS.map((m) => m.id);
          if (model && !allPresetIds.includes(model) && !customs.includes(model)) {
            setCustomModel(model); setSelectedModel("__custom__");
          } else { setSelectedModel(model); }
          if (res.data.openrouter_api_key) { setApiKeyMasked(maskKey(res.data.openrouter_api_key)); }
          else { setApiKeyMasked("(env: OPENROUTER_API_KEY)"); }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [parseCustomModels]);

  const saveSetting = useCallback(async (key: string, value: string) => {
    const res = await fetch("/api/admin/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ key, value }),
    });
    const data = await res.json();
    return data.success;
  }, []);

  async function handleSaveModel() {
    setSavingModel(true); setSavedModel(false);
    const modelValue = selectedModel === "__custom__" ? customModel.trim() : selectedModel;
    if (!modelValue) { setSavingModel(false); return; }
    try {
      const ok = await saveSetting("ai_model", modelValue);
      if (ok) {
        const allPresetIds: string[] = PRESET_MODELS.map((m) => m.id);
        if (!allPresetIds.includes(modelValue) && !savedCustomModels.includes(modelValue)) {
          const newCustoms = [...savedCustomModels, modelValue];
          await saveSetting("custom_models", JSON.stringify(newCustoms));
          setSavedCustomModels(newCustoms);
        }
        setSettings((prev) => ({ ...prev, ai_model: modelValue }));
        if (selectedModel === "__custom__") { setSelectedModel(modelValue); setCustomModel(""); }
        setSavedModel(true); setTimeout(() => setSavedModel(false), 2000);
      }
    } catch { /* silent */ } finally { setSavingModel(false); }
  }

  async function handleRemoveCustomModel(modelId: string) {
    const newCustoms = savedCustomModels.filter((m) => m !== modelId);
    await saveSetting("custom_models", JSON.stringify(newCustoms));
    setSavedCustomModels(newCustoms);
    if (selectedModel === modelId) setSelectedModel(PRESET_MODELS[0]?.id || "");
  }

  async function handleSaveApiKey() {
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    setSavingKey(true); setSavedKey(false);
    try {
      const ok = await saveSetting("openrouter_api_key", trimmed);
      if (ok) {
        setApiKeyMasked(maskKey(trimmed)); setApiKey("");
        setSettings((prev) => ({ ...prev, openrouter_api_key: trimmed }));
        setSavedKey(true); setTimeout(() => setSavedKey(false), 2000);
      }
    } catch { /* silent */ } finally { setSavingKey(false); }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-40 bg-muted rounded" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  const allModels = [
    ...PRESET_MODELS.map((m) => ({ ...m })),
    ...savedCustomModels.map((id) => ({ id, label: id.split("/").pop() || id, tag: "Custom", tier: "custom" as const })),
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold flex items-center gap-2">
        <Cpu className="w-5 h-5 text-primary" /> Settings
      </h1>

      {/* API Key Section */}
      <div className="rounded-2xl border border-foreground/5 bg-muted/10 p-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <Key className="w-4 h-4" /> OpenRouter API Key
          </h2>
          <p className="text-xs text-muted-foreground">
            AI 服务密钥，支持热更换无需重启 Hot-swap without container restart
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">当前 Current:</span>
          <code className="px-2 py-0.5 bg-muted rounded text-foreground font-mono text-xs">{apiKeyMasked}</code>
        </div>
        {!settings.openrouter_api_key && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>使用环境变量 Key — 如需更换请在此输入 Using env key — enter new key to hot-swap</span>
          </div>
        )}
        <div className="flex gap-2">
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-or-v1-..."
            className="flex-1 bg-background border border-foreground/10 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
          <button type="button" onClick={handleSaveApiKey} disabled={savingKey || !apiKey.trim()}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0",
              savedKey ? "bg-green-500 text-white" : "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]",
              (savingKey || !apiKey.trim()) && "opacity-50 cursor-not-allowed")}>
            {savingKey ? <RefreshCw className="w-4 h-4 animate-spin" /> : savedKey ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {savedKey ? "OK" : "Save"}
          </button>
        </div>
      </div>

      {/* AI Model Selection */}
      <div className="rounded-2xl border border-foreground/5 bg-muted/10 p-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold mb-1">AI 模型 AI Model</h2>
          <p className="text-xs text-muted-foreground">全局默认对话模型 · 自定义输入保存后成为选项 Custom models are saved as options</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>当前 Current:</span>
          <code className="px-2 py-0.5 bg-muted rounded text-foreground font-mono text-xs">{settings.ai_model || "(env: AI_MODEL)"}</code>
        </div>
        <div className="grid gap-2">
          {allModels.map((m) => {
            const active = selectedModel === m.id;
            return (
              <div key={m.id} className="flex items-center gap-1">
                <button type="button" onClick={() => { setSelectedModel(m.id); setCustomModel(""); }}
                  className={cn("flex-1 flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border",
                    active ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-foreground/5 bg-muted/20 hover:bg-muted/40")}>
                  {active && <Check className="w-4 h-4 text-primary shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{m.label}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">{m.id}</div>
                  </div>
                  <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap", TIER_COLORS[m.tier])}>{m.tag}</span>
                </button>
                {m.tier === "custom" && (
                  <button type="button" onClick={() => handleRemoveCustomModel(m.id)}
                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors" title="Remove">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
          <button type="button" onClick={() => setSelectedModel("__custom__")}
            className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border",
              selectedModel === "__custom__" ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-foreground/5 bg-muted/20 hover:bg-muted/40")}>
            {selectedModel === "__custom__" ? <Check className="w-4 h-4 text-primary shrink-0" /> : <Plus className="w-4 h-4 text-muted-foreground shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">添加自定义 Add Custom</div>
              {selectedModel === "__custom__" && (
                <input type="text" value={customModel} onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="provider/model-name (e.g. openai/gpt-5.4-mini)"
                  className="mt-1 w-full bg-background border border-foreground/10 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  onClick={(e) => e.stopPropagation()} />
              )}
            </div>
          </button>
        </div>
        <button type="button" onClick={handleSaveModel}
          disabled={savingModel || (!selectedModel || (selectedModel === "__custom__" && !customModel.trim()))}
          className={cn("flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all",
            savedModel ? "bg-green-500 text-white" : "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]",
            (savingModel || (!selectedModel || (selectedModel === "__custom__" && !customModel.trim()))) && "opacity-50 cursor-not-allowed")}>
          {savingModel ? <RefreshCw className="w-4 h-4 animate-spin" /> : savedModel ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {savedModel ? "已保存 Saved" : savingModel ? "保存中..." : "保存模型 Save Model"}
        </button>
      </div>
    </div>
  );
}
