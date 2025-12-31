"use client";

import { ChevronRight, Plus } from "lucide-react";

interface HomeProps {
  onNavigateToEditor?: (projectName: string) => void;
}

export default function Home({ onNavigateToEditor }: HomeProps) {
  const handleNavigate = (name: string) => {
    if (onNavigateToEditor) onNavigateToEditor(name);
  };
  const recentProjects = [
    { name: "Portfolio Site", time: "2 hours ago", language: "TypeScript" },
    { name: "Todo App", time: "5 hours ago", language: "JavaScript" },
    { name: "Data Analysis", time: "1 day ago", language: "Python" },
    { name: "API Server", time: "3 days ago", language: "TypeScript" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-5 pt-8 pb-6">
        <p className="text-muted-foreground text-sm mb-1">Welcome back</p>
        <h1 className="text-4xl font-bold tracking-tight">CodeStudio</h1>
      </header>

      {/* Main Content */}
      <main className="px-5 pb-24">
        {/* Start Building Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Start building</h2>

          {/* Agent Card - Primary Action */}
          <button
            onClick={() => handleNavigate("New Agent Project")}
            className="w-full mb-4 rounded-xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform"
          >
            <div
              className="relative p-6 text-left"
              style={{ background: "linear-gradient(135deg, #8B6CFF 0%, #6F56D8 100%)" }}
            >
              {/* Recommended Badge */}
              <span
                className="absolute top-4 right-4 text-xs font-medium px-3 py-1 rounded-full"
                style={{ backgroundColor: "rgba(139, 108, 255, 0.2)", color: "rgba(255, 255, 255, 0.9)" }}
              >
                Recommended
              </span>

              <h3 className="text-2xl font-bold text-white mb-2">Agent</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255, 255, 255, 0.85)" }}>
                Describe what you want, I'll build it
              </p>
            </div>
          </button>

          {/* IDE Card - Secondary Action */}
          <button
            onClick={() => handleNavigate("New IDE Project")}
            className="w-full bg-card hover:bg-card/80 rounded-xl p-5 flex items-center justify-between active:scale-[0.98] transition-all shadow-sm border border-border"
          >
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold mb-1">IDE</h3>
              <p className="text-muted-foreground text-sm">Full code access — edit everything manually</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground ml-4 flex-shrink-0" />
          </button>
        </section>

        {/* Recent Projects Section */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Recent Projects</h2>

          <div className="space-y-3">
            {recentProjects.map((project, index) => (
              <button
                key={index}
                onClick={() => handleNavigate(project.name)}
                className="w-full bg-card hover:bg-card/80 rounded-xl p-4 flex items-center justify-between active:scale-[0.98] transition-all border border-border"
              >
                <div className="flex-1 text-left">
                  <h3 className="font-medium mb-1">{project.name}</h3>
                  <p className="text-muted-foreground text-sm">{project.time}</p>
                </div>
                <span className="bg-accent text-accent-foreground text-xs font-medium px-3 py-1.5 rounded-md ml-4 flex-shrink-0">
                  {project.language}
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => handleNavigate("New Project")}
        className="fixed bottom-6 right-5 w-14 h-14 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        style={{ background: "linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)" }}
        aria-label="Create new project"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}