import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertTriangle, 
  Merge, 
  X, 
  Check, 
  TrendingUp, 
  DollarSign,
  ChevronRight,
  ExternalLink,
  Tag,
  Sparkles
} from "lucide-react";
import { Project } from "@/components/ProjectCard";
import { Link } from "wouter";

interface SimilarProject {
  project: Project;
  similarity: number;
  matchReasons: string[];
}

interface FinalizeProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  similarProjects: SimilarProject[];
  suggestedCategory: string;
  onMerge: (projectId: string) => void;
  onCancel: () => void;
  onFinalize: (category: string) => void;
}

const PROJECT_CATEGORIES = [
  "Packaging",
  "Energy",
  "Sourcing",
  "Waste",
  "Water",
  "Other",
];

export function FinalizeProjectDialog({
  open,
  onOpenChange,
  similarProjects,
  suggestedCategory,
  onMerge,
  onCancel,
  onFinalize,
}: FinalizeProjectDialogProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(suggestedCategory);

  useEffect(() => {
    setSelectedCategory(suggestedCategory);
  }, [suggestedCategory]);

  const hasSimilarProjects = similarProjects.length > 0;

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

  const handleFinalize = () => {
    onFinalize(selectedCategory);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasSimilarProjects ? (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Similar Projects Found
              </>
            ) : (
              <>
                <Tag className="h-5 w-5 text-primary" />
                Finalize Project
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {hasSimilarProjects ? (
              <>
                We found {similarProjects.length} existing project{similarProjects.length !== 1 ? 's' : ''} similar to your new project.
                Review the matches below and decide whether to merge, cancel, or proceed with a new project.
              </>
            ) : (
              <>
                Your project appears to be unique! Review the AI-suggested category and finalize your project.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Similar Projects Section */}
          {hasSimilarProjects && (
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
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            </div>
          )}

          {/* Category Selection Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Project Category
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-select">
                  AI-Suggested: <Badge variant="default" className="ml-2">{suggestedCategory}</Badge>
                </Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category-select" data-testid="select-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Category determined by analyzing your project description and selected metrics
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Empty State */}
          {!hasSimilarProjects && (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                This project is unique and doesn't significantly overlap with any existing projects in your portfolio.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {hasSimilarProjects
                ? selectedProject 
                  ? 'Merging will combine data with the selected project' 
                  : 'Choose an action to continue'
                : 'Review category and finalize your project'
              }
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={handleCancel}
                data-testid="button-cancel-project"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              {hasSimilarProjects && selectedProject && (
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
                onClick={handleFinalize}
                data-testid="button-finalize-project"
              >
                <Check className="h-4 w-4 mr-2" />
                {hasSimilarProjects ? 'Proceed Anyway' : 'Finalize & Create Project'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
