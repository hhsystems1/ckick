import { Badge } from "./Badge";
import { formatTimeAgo } from "@/lib/utils";

export interface Project {
  id: string;
  name: string;
  description: string;
  badges: string[];
  updatedAt: Date;
}

interface ProjectRowProps {
  project: Project;
  onClick: () => void;
}

export function ProjectRow({ project, onClick }: ProjectRowProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
          <p className="text-sm text-gray-600 mb-3">{project.description}</p>
          <div className="flex items-center gap-2">
            {project.badges.map((badge) => (
              <Badge key={badge} variant="secondary" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        </div>
        <div className="text-xs text-gray-500 ml-4">
          {formatTimeAgo(project.updatedAt)}
        </div>
      </div>
    </div>
  );
}