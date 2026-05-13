"use client";

import type {
  CSSProperties,
  FormEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import { memo } from "react";
import { Check, ChevronDown, RefreshCw, Sparkles, Wand2, X } from "lucide-react";
import { ratios, qualityOptions, type ImageRatio } from "../../lib/image-options";
import { imageModels, isGptModel, type ImageModel } from "../../lib/models";
import type { NodePosition } from "../../lib/types";

const promptTemplates = ["电商海报", "IP角色", "表情包", "产品图", "国潮风"];

const iconButton: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.64)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 12px 34px rgba(0,0,0,0.35)",
};

function getModelChips(modelValue: string) {
  if (modelValue === "gpt-image-2-plus") {
    return ["实验", "可能较慢"];
  }

  return ["默认", "主力"];
}

function getRatioIconStyle(value: string, active: boolean): CSSProperties {
  const sizeMap: Record<string, { width: number; height: number }> = {
    auto: { width: 22, height: 22 },
    "1:1": { width: 21, height: 21 },
    "9:16": { width: 12, height: 25 },
    "16:9": { width: 28, height: 10 },
    "3:4": { width: 16, height: 24 },
    "4:3": { width: 25, height: 15 },
    "3:2": { width: 26, height: 14 },
    "2:3": { width: 14, height: 24 },
    "5:4": { width: 23, height: 17 },
    "4:5": { width: 17, height: 23 },
    "21:9": { width: 30, height: 10 },
  };
  const size = sizeMap[value] || sizeMap["1:1"];

  return {
    width: size.width,
    height: size.height,
    borderRadius: value === "auto" ? 6 : 3,
    border: value === "auto" ? "2px dashed currentColor" : "2px solid currentColor",
    color: active ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.42)",
    boxSizing: "border-box",
    display: "block",
  };
}

type PromptBarProps = {
  promptPanelOpen: boolean;
  promptNodePosition: NodePosition | null;
  canvasRenderScale: number;
  promptInputRef: RefObject<HTMLTextAreaElement>;
  prompt: string;
  promptHistoryOpen: boolean;
  promptHistoryItems: string[];
  model: ImageModel;
  ratio: ImageRatio;
  quality: string;
  loading: boolean;
  modelPanelOpen: boolean;
  ratioPanelOpen: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLFormElement>) => void;
  onPromptDraftChange: (value: string) => void;
  onGenerate: () => void;
  onAppendPrompt: (text: string) => void;
  onTogglePromptHistory: () => void;
  onFillPrompt: (text: string, message?: string) => void;
  onClearPrompt: () => void;
  onToggleModelPanel: () => void;
  onToggleRatioPanel: () => void;
  onSelectModel: (model: ImageModel) => void;
  onSelectRatio: (ratio: ImageRatio) => void;
  onSetQuality: (quality: string) => void;
};

export const PromptBar = memo(function PromptBar({
  promptPanelOpen,
  promptNodePosition,
  canvasRenderScale,
  promptInputRef,
  prompt,
  promptHistoryOpen,
  promptHistoryItems,
  model,
  ratio,
  quality,
  loading,
  modelPanelOpen,
  ratioPanelOpen,
  onSubmit,
  onPointerDown,
  onPromptDraftChange,
  onGenerate,
  onAppendPrompt,
  onTogglePromptHistory,
  onFillPrompt,
  onClearPrompt,
  onToggleModelPanel,
  onToggleRatioPanel,
  onSelectModel,
  onSelectRatio,
  onSetQuality,
}: PromptBarProps) {
  return (
    <form
      onSubmit={onSubmit}
      onPointerDown={onPointerDown}
      style={{
        position: "absolute",
        display: promptPanelOpen ? "block" : "none",
        left: promptNodePosition ? promptNodePosition.x * canvasRenderScale : "50%",
        top: promptNodePosition ? promptNodePosition.y * canvasRenderScale : "78%",
        transform: `translate3d(-50%, -50%, 0) scale(${canvasRenderScale})`,
        transformOrigin: "center",
        willChange: "transform",
        width: "min(860px, calc(100% - 64px))",
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(32,32,33,0.98)",
        borderRadius: 24,
        padding: 14,
        boxShadow: "0 24px 86px rgba(0,0,0,0.62)",
        boxSizing: "border-box",
        cursor: "grab",
        touchAction: "none",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 54,
          height: 5,
          borderRadius: 999,
          background: "rgba(255,255,255,0.18)",
          margin: "0 auto 10px",
        }}
      />

      <div
        data-no-drag="true"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 7,
          marginBottom: 10,
        }}
      >
        {promptTemplates.map((template) => (
          <button
            key={template}
            type="button"
            onClick={() => onAppendPrompt(template)}
            style={{
              height: 30,
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.74)",
              padding: "0 12px",
              fontSize: 12,
              fontWeight: 750,
              cursor: "pointer",
            }}
          >
            {template}
          </button>
        ))}
        <button
          type="button"
          onClick={onTogglePromptHistory}
          style={{
            height: 34,
            border: "1px solid rgba(134,239,172,0.22)",
            borderRadius: 999,
            background: "rgba(134,239,172,0.08)",
            color: "#bbf7d0",
            padding: "0 12px",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          最近使用
        </button>
      </div>

      {promptHistoryOpen ? (
        <div
          data-no-drag="true"
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(12,12,13,0.72)",
            borderRadius: 18,
            padding: 10,
            marginBottom: 12,
            display: "grid",
            gap: 8,
            maxHeight: 180,
            overflowY: "auto",
          }}
        >
          {promptHistoryItems.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.42)", fontSize: 13 }}>
              还没有最近使用的 prompt
            </div>
          ) : (
            promptHistoryItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onFillPrompt(item, "已恢复最近使用")}
                style={{
                  border: "none",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.055)",
                  color: "rgba(255,255,255,0.78)",
                  padding: "9px 10px",
                  textAlign: "left",
                  fontSize: 13,
                  lineHeight: 1.45,
                  cursor: "pointer",
                }}
              >
                {item.length > 120 ? `${item.slice(0, 120)}...` : item}
              </button>
            ))
          )}
        </div>
      ) : null}

      <div data-no-drag="true" style={{ position: "relative" }}>
        <textarea
          ref={promptInputRef}
          defaultValue={prompt}
          onChange={(event) => onPromptDraftChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              onGenerate();
            }
          }}
          placeholder="描述任何你想要生成的内容"
          style={{
            width: "100%",
            minHeight: 78,
            resize: "none",
            background: "transparent",
            color: "white",
            border: "none",
            outline: "none",
            padding: "0 46px 0 2px",
            boxSizing: "border-box",
            fontSize: 16,
            lineHeight: 1.42,
            fontFamily: "inherit",
          }}
        />
        {true ? (
          <button
            type="button"
            onClick={onClearPrompt}
            style={{
              ...iconButton,
              position: "absolute",
              right: 2,
              top: 0,
              width: 34,
              height: 34,
              background: "rgba(255,255,255,0.08)",
            }}
            aria-label="清空输入"
          >
            <X size={15} />
          </button>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          paddingTop: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={onToggleModelPanel}
              style={{
                height: 38,
                minWidth: 190,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.22)",
                color: "white",
                padding: "0 14px",
                fontSize: 15,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                cursor: "pointer",
              }}
              aria-haspopup="listbox"
              aria-expanded={modelPanelOpen}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <Sparkles size={17} color="rgba(255,255,255,0.72)" />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {model.label}
                </span>
              </span>
              <ChevronDown size={16} color="rgba(255,255,255,0.72)" />
            </button>

            {modelPanelOpen ? (
              <div
                data-no-drag="true"
                role="listbox"
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 54,
                  zIndex: 32,
                  width: 420,
                  maxWidth: "calc(100vw - 40px)",
                  borderRadius: 24,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(39,39,40,0.99)",
                  boxShadow: "0 28px 90px rgba(0,0,0,0.6)",
                  padding: 12,
                  boxSizing: "border-box",
                }}
              >
                {imageModels.map((item) => {
                  const active = item.value === model.value;
                  const chips = getModelChips(item.value);

                  return (
                    <button
                      key={item.value}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => onSelectModel(item)}
                      style={{
                        width: "100%",
                        minHeight: 82,
                        border: "none",
                        borderRadius: 18,
                        background: active ? "rgba(255,255,255,0.11)" : "transparent",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 14,
                        padding: "14px 16px",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 }}>
                        <Sparkles
                          size={20}
                          color={isGptModel(item.value) ? "#25f5b6" : "rgba(255,255,255,0.68)"}
                          style={{ marginTop: 2, flex: "0 0 auto" }}
                        />
                        <span style={{ display: "grid", gap: 8, minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: 18,
                              fontWeight: 850,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.label}
                          </span>
                          <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {chips.map((chip) => (
                              <span
                                key={chip}
                                style={{
                                  borderRadius: 999,
                                  background:
                                    chip === "实验" || chip === "可能较慢"
                                      ? "#1df0b7"
                                      : "rgba(255,255,255,0.1)",
                                  color:
                                    chip === "实验" || chip === "可能较慢"
                                      ? "black"
                                      : "rgba(255,255,255,0.62)",
                                  padding: "3px 9px",
                                  fontSize: 12,
                                  fontWeight: 900,
                                }}
                              >
                                {chip}
                              </span>
                            ))}
                            <span
                              style={{
                                borderRadius: 999,
                                background: "rgba(255,255,255,0.08)",
                                color: "rgba(255,255,255,0.58)",
                                padding: "3px 9px",
                                fontSize: 12,
                                fontWeight: 850,
                              }}
                            >
                              {quality}
                            </span>
                          </span>
                        </span>
                      </span>

                      {active ? <Check size={18} color="white" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={onToggleRatioPanel}
              style={{
                height: 40,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.22)",
                color: "white",
                padding: "0 16px",
                fontSize: 15,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
              }}
              aria-haspopup="dialog"
              aria-expanded={ratioPanelOpen}
            >
              <span>{ratio.label}</span>
              <span style={{ color: "rgba(255,255,255,0.55)" }}>·</span>
              <span>{quality}</span>
            </button>

            {ratioPanelOpen ? (
              <div
                data-no-drag="true"
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 54,
                  zIndex: 30,
                  width: 480,
                  maxWidth: "calc(100vw - 40px)",
                  borderRadius: 28,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background:
                    "linear-gradient(135deg, rgba(49,49,50,0.99), rgba(39,39,40,0.99))",
                  boxShadow: "0 28px 90px rgba(0,0,0,0.6)",
                  padding: 18,
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    color: "rgba(255,255,255,0.58)",
                    fontSize: 15,
                    fontWeight: 800,
                    margin: "0 0 10px 6px",
                  }}
                >
                  画质
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 0,
                    padding: 4,
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.055)",
                    marginBottom: 22,
                  }}
                >
                  {qualityOptions.map((item) => {
                    const active = quality === item;

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => onSetQuality(item)}
                        style={{
                          height: 48,
                          border: "none",
                          borderRadius: 16,
                          background: active ? "rgba(255,255,255,0.12)" : "transparent",
                          color: active ? "white" : "rgba(255,255,255,0.38)",
                          fontSize: 18,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>

                <div
                  style={{
                    color: "rgba(255,255,255,0.58)",
                    fontSize: 15,
                    fontWeight: 800,
                    margin: "0 0 12px 6px",
                  }}
                >
                  比例
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                    gap: 6,
                    padding: 10,
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.055)",
                  }}
                >
                  {ratios.map((item) => {
                    const active = ratio.value === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => onSelectRatio(item)}
                        style={{
                          minHeight: 68,
                          border: "none",
                          borderRadius: 16,
                          background: active ? "rgba(255,255,255,0.13)" : "transparent",
                          color: active ? "white" : "rgba(255,255,255,0.42)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          fontSize: 13,
                          fontWeight: 750,
                          cursor: "pointer",
                        }}
                      >
                        <span style={getRatioIconStyle(item.value, active)} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>风格</span>
          <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>
            摄影机控制
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: 48,
            height: 48,
            border: "none",
            borderRadius: 999,
            background: "rgba(255,255,255,0.86)",
            color: "black",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            boxShadow: "0 10px 34px rgba(255,255,255,0.14)",
          }}
          aria-label={loading ? "生成中" : "生成"}
        >
          {loading ? <RefreshCw size={22} /> : <Wand2 size={22} />}
        </button>
      </div>
    </form>
  );
});

export const PromptPanel = PromptBar;
