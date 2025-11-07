import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  Merge, 
  X, 
  Check, 
  TrendingUp, 
  DollarSign,
  Leaf,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Project } from "@/components/ProjectCard";
import { Link } from "wouter";

interface SimilarProject {
  project: Project;
  similarity: number;
  matchReasons: string[];
}

interface SimilarProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  similarProjects: SimilarProject[];
  onMerge: (projectId: string) => void;
  onCancel: () => void;
  onProceed: () => void;
}

export function SimilarProjectsDialog({
  open,
  onOpenChange,
  similarProjects,
  onMerge,
  onCancel,
  onProceed,
}: SimilarProjectsDialogProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 75) return "text-red-600";
    if (similarity >= 50) return "text-orange-600";
    return "text-yellow-600";
  };

  const getSimilarityBadge = (similarity: number) => {
    if (similarity >= 75) return "High Match";
    if (similarity >= 50) return "Moderate Match";
    return "Low Match";
  };

  const handleMerge = () => {
    if (selectedProject) {
      onMerge(selectedProject);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleProceed = () => {
    onProceed();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Similar Projects Found
          </DialogTitle>
          <DialogDescription>
            We found {similarProjects.length} existing project{similarProjects.length !== 1 ? 's' : ''} similar to your new project.
            Review the matches below and decide whether to merge, cancel, or proceed with a new project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {similarProjects.map((similar, index) => {
            const isExpanded = expandedProject === similar.project.id;
            const isSelected = selectedProject === similar.project.id;

            return (
              <Card
                key={similar.project.id}
                className={`hover-elevate ${isSelected ? 'border-primary' : ''}`}
                data-testid={`similar-project-${index}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-muted-foreground">
                          #{index + 1}
                        </span>
                        <CardTitle className="text-lg">{similar.project.title}</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {similar.project.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className={`text-3xl font-bold font-mono ${getSimilarityColor(similar.similarity)}`}>
                          {similar.similarity}%
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {getSimilarityBadge(similar.similarity)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Similarity Score</span>
                      <span className="font-medium">{similar.similarity}%</span>
                    </div>
                    <Progress value={similar.similarity} className="h-2" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium">Match Reasons:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {similar.matchReasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant={isExpanded ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setExpandedProject(isExpanded ? null : similar.project.id)}
                      data-testid={`button-expand-${index}`}
                    >
                      <ChevronRight className={`h-4 w-4 mr-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      {isExpanded ? 'Hide' : 'Quick View'}
                    </Button>
                    <Link href={`/project/${similar.project.id}`} target="_blank">
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-view-full-${index}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Full Details
                      </Button>
                    </Link>
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedProject(isSelected ? null : similar.project.id)}
                      data-testid={`button-select-merge-${index}`}
                    >
                      <Merge className="h-4 w-4 mr-2" />
                      {isSelected ? 'Selected for Merge' : 'Select to Merge'}
                    </Button>
                  </div>

                  {isExpanded && (
                    <>
                      <Separator />
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              <span className="text-xs">Estimated Cost</span>
                            </div>
                            <p className="font-semibold">${similar.project.estimatedCost.toLocaleString()}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <TrendingUp className="h-3 w-3" />
                              <span className="text-xs">ROI</span>
                            </div>
                            <p className="font-semibold">{similar.project.roi}%</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Leaf className="h-3 w-3" />
                              <span className="text-xs">CO₂ Saved</span>
                            </div>
                            <p className="font-semibold">{similar.project.co2Saved}T</p>
                          </div>
                          {similar.project.feedbackScore && (
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">Feedback</div>
                              <p className="font-semibold">{similar.project.feedbackScore}/5</p>
                              <p className="text-xs text-muted-foreground">
                                ({similar.project.responseCount} responses)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {similarProjects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No similar projects found</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {selectedProject ? 'Merging will combine data with the selected project' : 'Choose an action to continue'}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={handleCancel}
                data-testid="button-cancel-project"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel New Project
              </Button>
              {selectedProject && (
                <Button
                  variant="secondary"
                  onClick={handleMerge}
                  data-testid="button-confirm-merge"
                >
                  <Merge className="h-4 w-4 mr-2" />
                  Merge with Selected
                </Button>
              )}
              <Button
                onClick={handleProceed}
                data-testid="button-proceed-anyway"
              >
                <Check className="h-4 w-4 mr-2" />
                Proceed Anyway
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
