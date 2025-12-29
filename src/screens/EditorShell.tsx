"use client";

import { useState } from "react";
import { ModeSwitcher } from "@/app/components/layout/ModeSwitcher";
import { TopBar } from "@/app/components/layout/TopBar";

type EditorMode = "code" | "agent" | "terminal" | "preview";

export default function EditorShell({ projectId }: { projectId: string }) {
  const [activeMode, setActiveMode] = useState<EditorMode>("code");

  const renderModeContent = () => {
    switch (activeMode) {
      case "code":
        return (
          <div className="flex-1 bg-gray-900 text-white p-4">
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Code Editor</h3>
                <p className="text-sm">Monaco Editor will be integrated here</p>
              </div>
            </div>
          </div>
        );
      case "agent":
        return (
          <div className="flex-1 bg-white p-4">
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Agent</h3>
                <p className="text-sm">OpenCode AI Assistant will be integrated here</p>
              </div>
            </div>
          </div>
        );
      case "terminal":
        return (
          <div className="flex-1 bg-black text-green-400 p-4 font-mono">
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Terminal</h3>
                <p className="text-sm">xterm.js will be integrated here</p>
              </div>
            </div>
          </div>
        );
      case "preview":
        return (
          <div className="flex-1 bg-white p-4">
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Preview</h3>
                <p className="text-sm">Live preview will be shown here</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TopBar projectId={projectId} />
      <ModeSwitcher activeMode={activeMode} onModeChange={setActiveMode} />
      {renderModeContent()}
    </div>
  );
}