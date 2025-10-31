import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "./ProjectCard";

interface ImpactCostMatrixProps {
  projects: Project[];
}

export function ImpactCostMatrix({ projects }: ImpactCostMatrixProps) {
  const maxCost = Math.max(...projects.map(p => p.estimatedCost), 1);
  const maxImpact = Math.max(...projects.map(p => p.co2Saved), 1);

  const getPosition = (project: Project) => ({
    x: (project.estimatedCost / maxCost) * 85 + 5,
    y: 85 - (project.co2Saved / maxImpact) * 85 + 5,
  });

  const typeColors: Record<string, string> = {
    Packaging: "fill-chart-1",
    Energy: "fill-chart-2",
    Sourcing: "fill-chart-3",
    Waste: "fill-chart-4",
    Water: "fill-chart-5",
    Logistics: "fill-muted",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impact vs. Cost Matrix</CardTitle>
        <p className="text-sm text-muted-foreground">Project prioritization analysis</p>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-square">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <line x1="5" y1="5" x2="5" y2="90" stroke="currentColor" strokeWidth="0.5" className="text-border" />
            <line x1="5" y1="90" x2="90" y2="90" stroke="currentColor" strokeWidth="0.5" className="text-border" />
            
            <line x1="50" y1="5" x2="50" y2="90" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2,2" className="text-border" />
            <line x1="5" y1="47.5" x2="90" y2="47.5" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2,2" className="text-border" />
            
            <text x="50" y="97" textAnchor="middle" className="text-[3px] fill-muted-foreground">Cost →</text>
            <text x="1" y="50" textAnchor="middle" className="text-[3px] fill-muted-foreground" transform="rotate(-90, 1, 50)">Impact →</text>
            
            <rect x="5" y="5" width="42.5" height="42.5" fill="hsl(var(--primary))" opacity="0.05" />
            <text x="26" y="30" textAnchor="middle" className="text-[2.5px] fill-muted-foreground">High Impact</text>
            <text x="26" y="34" textAnchor="middle" className="text-[2.5px] fill-muted-foreground">Low Cost</text>
            
            {projects.map((project) => {
              const pos = getPosition(project);
              return (
                <g key={project.id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="3"
                    className={`${typeColors[project.type] || "fill-muted"} hover-elevate cursor-pointer`}
                    opacity="0.8"
                    data-testid={`dot-project-${project.id}`}
                  >
                    <title>{project.title}</title>
                  </circle>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(typeColors).map(([type, colorClass]) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colorClass}`} />
              <span className="text-xs text-muted-foreground">{type}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
