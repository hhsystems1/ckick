type EditorMode = "code" | "agent" | "terminal" | "preview";

interface ModeSwitcherProps {
  activeMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

export function ModeSwitcher({ activeMode, onModeChange }: ModeSwitcherProps) {
  const modes = [
    { id: "code" as EditorMode, label: "Code", icon: "💻" },
    { id: "agent" as EditorMode, label: "Agent", icon: "🤖" },
    { id: "terminal" as EditorMode, label: "Terminal", icon: "🖥️" },
    { id: "preview" as EditorMode, label: "Preview", icon: "👁️" },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`
              flex-1 flex flex-col items-center py-3 px-4 text-sm font-medium transition-colors
              ${activeMode === mode.id
                ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }
            `}
          >
            <span className="text-xl mb-1">{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}