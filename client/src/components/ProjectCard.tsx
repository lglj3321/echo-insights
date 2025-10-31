import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, DollarSign, Leaf, TrendingUp, Award } from "lucide-react";
import { Link } from "wouter";

export interface Project {
  id: string;
  title: string;
  description: string;
  type: string;
  estimatedCost: number;
  roi: number;
  co2Saved: number;
  waterSaved?: number;
  feedbackScore?: number;
  responseCount?: number;
  impactScore?: number;
}

interface ProjectCardProps {
  project: Project;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return "text-primary";
  if (score >= 60) return "text-chart-3";
  if (score >= 40) return "text-chart-2";
  return "text-muted-foreground";
};

const typeColors: Record<string, string> = {
  Packaging: "bg-chart-1 text-primary-foreground",
  Energy: "bg-chart-2 text-primary-foreground",
  Sourcing: "bg-chart-3 text-primary-foreground",
  Waste: "bg-chart-4 text-primary-foreground",
  Water: "bg-chart-5 text-primary-foreground",
  Logistics: "bg-muted text-muted-foreground",
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card data-testid={`card-project-${project.id}`} className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg">{project.title}</CardTitle>
          <Badge className={typeColors[project.type] || "bg-muted"} data-testid={`badge-type-${project.id}`}>
            {project.type}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
        
        {project.impactScore !== undefined && (
          <div className="mt-3 p-3 rounded-lg bg-muted space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Award className="h-3 w-3" />
                <span>Impact Score</span>
              </div>
              <span className={`text-2xl font-bold font-mono ${getScoreColor(project.impactScore)}`}>
                {project.impactScore}
              </span>
            </div>
            <Progress value={project.impactScore} className="h-1.5" />
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              <span>Estimated Cost</span>
            </div>
            <p className="text-lg font-semibold font-mono">${project.estimatedCost.toLocaleString()}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              <span>ROI</span>
            </div>
            <p className="text-lg font-semibold font-mono">{project.roi}%</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Leaf className="h-3 w-3" />
              <span>CO₂ Saved</span>
            </div>
            <p className="text-lg font-semibold font-mono">{project.co2Saved}T</p>
          </div>
          {project.feedbackScore !== undefined && (
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Star className="h-3 w-3" />
                <span>Feedback</span>
              </div>
              <p className="text-lg font-semibold font-mono">
                {project.feedbackScore.toFixed(1)}
                <span className="text-xs text-muted-foreground ml-1">({project.responseCount})</span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 flex-wrap">
        <Link href={`/project/${project.id}`}>
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
            data-testid={`button-view-${project.id}`}
          >
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
