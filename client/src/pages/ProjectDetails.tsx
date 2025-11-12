import { useState, useMemo, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  TrendingUp,
  FileText,
  Lock,
  Edit,
  Download,
  Award,
  LineChart,
  Upload,
  Clock,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";
import { ProjectUpdateDialog } from "@/components/ProjectUpdateDialog";
import { CreateSurveyDialog } from "@/components/CreateSurveyDialog";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn } from "@/lib/queryClient";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, ProjectMetric } from "@shared/schema";

interface MetricScore {
  name: string;
  value: string;
  normalizedScore: number;
  type: string;
}

interface MetricTypeWeight {
  type: string;
  weight: number;
  metrics: MetricScore[];
}

interface ProjectUpdate {
  period: string;
  year: string;
  timestamp: string;
  notes?: string;
  metricUpdates: { name: string; value: string }[];
  newMetrics: { name: string; value: string }[];
}

export default function ProjectDetails() {
  const [, params] = useRoute("/project/:id");
  const projectId = params?.id || "1";
  const { toast } = useToast();

  // Check if this is a merge scenario
  const urlParams = new URLSearchParams(window.location.search);
  const isMerged = urlParams.get('merged') === 'true';
  const mergeContextStr = sessionStorage.getItem('mergeContext');
  const mergeContext = mergeContextStr ? JSON.parse(mergeContextStr) : null;

  // Grant authorization if user is merging their new project into this one
  const [isAuthorized] = useState(true); // In real app, check user permissions OR merge context
  const [showMergeBanner, setShowMergeBanner] = useState(isMerged && mergeContext);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isCreateSurveyDialogOpen, setIsCreateSurveyDialogOpen] = useState(false);
  // Initialize project updates with creation date from project
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([]);
  const [metricWeights, setMetricWeights] = useState<Record<string, number>>({
    "Environmental Impact": 40,
    "Resource Efficiency": 30,
    "Cost Effectiveness": 20,
    "Social Impact": 10,
  });

  // Fetch project data from API
  const { data: project, isLoading: isLoadingProject, error: projectError } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!projectId,
  });

  // Set initial update when project is loaded
  useEffect(() => {
    if (project && projectUpdates.length === 0) {
      const createdDate = new Date(project.createdAt);
      const quarter = Math.floor(createdDate.getMonth() / 3) + 1;
      const period = `Q${quarter}`;
      const year = createdDate.getFullYear().toString();
      
      setProjectUpdates([{
        period,
        year,
        timestamp: project.createdAt instanceof Date 
          ? project.createdAt.toISOString() 
          : new Date(project.createdAt).toISOString(),
        notes: "Initial project creation",
        metricUpdates: [],
        newMetrics: [],
      }]);
    }
  }, [project, projectUpdates.length]);

  // Fetch project metrics from API
  const { data: projectMetrics = [], isLoading: isLoadingMetrics } = useQuery<ProjectMetric[]>({
    queryKey: [`/api/projects/${projectId}/metrics`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!projectId && !!project,
  });

  // Helper function to classify metric type based on name
  const classifyMetricType = (metricName: string): string => {
    const name = metricName.toLowerCase();
    
    // Environmental Impact
    if (name.includes("co2") || name.includes("carbon") || name.includes("emission") || 
        name.includes("greenhouse") || name.includes("ghg") || name.includes("pollution") ||
        name.includes("waste") || name.includes("recycl") || name.includes("plastic")) {
      return "Environmental Impact";
    }
    
    // Resource Efficiency
    if (name.includes("water") || name.includes("energy") || name.includes("power") ||
        name.includes("electricity") || name.includes("fuel") || name.includes("consumption") ||
        name.includes("efficiency") || name.includes("usage") || name.includes("reduction")) {
      return "Resource Efficiency";
    }
    
    // Cost Effectiveness
    if (name.includes("cost") || name.includes("saving") || name.includes("roi") ||
        name.includes("revenue") || name.includes("profit") || name.includes("budget") ||
        name.includes("expense") || name.includes("financial") || name.includes("economic")) {
      return "Cost Effectiveness";
    }
    
    // Social Impact
    if (name.includes("satisfaction") || name.includes("engagement") || name.includes("awareness") ||
        name.includes("education") || name.includes("community") || name.includes("social") ||
        name.includes("brand") || name.includes("reputation") || name.includes("employee")) {
      return "Social Impact";
    }
    
    // Default to Environmental Impact
    return "Environmental Impact";
  };

  // Helper function to calculate normalized score if not provided
  const calculateNormalizedScore = (metricName: string, value: string, unit?: string | null): number => {
    // Try to extract numeric value
    const numericMatch = value.match(/[\d.]+/);
    if (!numericMatch) return 50; // Default score if no number found
    
    const numericValue = parseFloat(numericMatch[0]);
    if (isNaN(numericValue)) return 50;
    
    const name = metricName.toLowerCase();
    
    // CO2/Carbon emissions - lower is better, normalize to 0-100
    if (name.includes("co2") || name.includes("carbon") || name.includes("emission")) {
      // Assume 0-10 tons is good (100), 10+ tons is worse
      return Math.min(100, Math.max(0, 100 - (numericValue * 10)));
    }
    
    // Water/Energy savings - higher is better
    if (name.includes("water") || name.includes("energy") || name.includes("saving")) {
      // Assume 0-1000 units is good, scale to 0-100
      return Math.min(100, (numericValue / 10));
    }
    
    // Percentage - use directly
    if (value.includes("%") || unit?.includes("%")) {
      return Math.min(100, Math.max(0, numericValue));
    }
    
    // Cost savings - higher is better, but scale differently
    if (name.includes("cost") || name.includes("saving")) {
      // Assume 0-10000 is good, scale to 0-100
      return Math.min(100, (numericValue / 100));
    }
    
    // Rating (1-5 scale) - convert to 0-100
    if (name.includes("rating") || name.includes("satisfaction") || name.includes("score")) {
      if (numericValue <= 5) {
        return (numericValue / 5) * 100;
      }
    }
    
    // Default: scale based on value magnitude
    if (numericValue < 1) {
      return numericValue * 100;
    } else if (numericValue < 100) {
      return numericValue;
    } else {
      return Math.min(100, 100 - (numericValue / 100));
    }
  };

  // Convert ProjectMetric to MetricScore format
  const metrics: MetricScore[] = useMemo(() => {
    return projectMetrics.map((metric) => {
      const normalizedScore = metric.normalizedScore 
        ? Number(metric.normalizedScore) 
        : calculateNormalizedScore(metric.metricName, metric.value, metric.unit);
      
      return {
        name: metric.metricName,
        value: metric.value,
        normalizedScore: Math.round(normalizedScore),
        type: classifyMetricType(metric.metricName),
      };
    });
  }, [projectMetrics]);

  const groupedMetrics: MetricTypeWeight[] = useMemo(() => {
    return Object.entries(
      metrics.reduce((acc, metric) => {
        if (!acc[metric.type]) {
          acc[metric.type] = [];
        }
        acc[metric.type].push(metric);
        return acc;
      }, {} as Record<string, MetricScore[]>)
    ).map(([type, metrics]) => ({
      type,
      weight: metricWeights[type] || 25,
      metrics,
    }));
  }, [metrics, metricWeights]);

  const calculateImpactScore = () => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    groupedMetrics.forEach(group => {
      if (group.metrics.length > 0) {
        const groupAverage = group.metrics.reduce((sum, m) => sum + m.normalizedScore, 0) / group.metrics.length;
        totalWeightedScore += groupAverage * group.weight;
        totalWeight += group.weight;
      }
    });

    return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  };

  // Use impactScore from project if available, otherwise calculate it
  const impactScore = project?.impactScore 
    ? Number(project.impactScore) 
    : calculateImpactScore();

  const handleWeightChange = (type: string, value: number[]) => {
    setMetricWeights(prev => ({
      ...prev,
      [type]: value[0],
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-chart-3";
    if (score >= 40) return "text-chart-2";
    return "text-orange-600";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "D";
  };

  const handleProjectUpdate = (updateData: any) => {
    const newUpdate: ProjectUpdate = {
      period: updateData.period,
      year: updateData.year,
      timestamp: updateData.timestamp,
      notes: updateData.notes,
      metricUpdates: updateData.metricUpdates,
      newMetrics: updateData.newMetrics,
    };

    setProjectUpdates([...projectUpdates, newUpdate]);
    
    toast({
      title: "Project Updated",
      description: `Data for ${updateData.period} ${updateData.year} has been added successfully.`,
    });
  };

  const handleIntegrateMergeData = () => {
    if (!mergeContext) return;

    // Create an update entry for the merged data
    const mergeUpdate: ProjectUpdate = {
      period: new Date().getMonth() < 3 ? "Q1" : new Date().getMonth() < 6 ? "Q2" : new Date().getMonth() < 9 ? "Q3" : "Q4",
      year: new Date().getFullYear().toString(),
      timestamp: mergeContext.mergedAt,
      notes: `Merged data from new project: "${mergeContext.newProjectData?.title || 'Untitled'}"`,
      metricUpdates: [],
      newMetrics: mergeContext.newMetrics.map((m: any) => ({
        name: m.name,
        value: m.value
      })),
    };

    setProjectUpdates([...projectUpdates, mergeUpdate]);
    
    toast({
      title: "Merge Completed",
      description: `New project data has been integrated successfully.`,
    });

    // Clear merge context
    sessionStorage.removeItem('mergeContext');
    setShowMergeBanner(false);
    
    // Remove merged param from URL
    window.history.replaceState({}, '', `/project/${projectId}`);
  };

  const handleCancelMerge = () => {
    sessionStorage.removeItem('mergeContext');
    setShowMergeBanner(false);
    window.history.replaceState({}, '', `/project/${projectId}`);
    
    toast({
      title: "Merge Cancelled",
      description: "No data was integrated.",
      variant: "destructive",
    });
  };

  const handleCreateSurvey = (surveyData: any) => {
    console.log('Survey created:', surveyData);
    toast({
      title: "Survey Created",
      description: `Your survey "${surveyData.title}" has been created successfully.`,
    });
  };

  const existingMetricNames = metrics.map(m => m.name);

  // Loading state
  if (isLoadingProject) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (projectError || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-muted-foreground">
              {projectError ? "Failed to load project" : "Project not found"}
            </p>
            <Link href="/projects">
              <Button variant="outline">Back to Projects</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {showMergeBanner && mergeContext && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Merge Pending</Badge>
                  <h3 className="font-semibold">Ready to Integrate New Project Data</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  You've chosen to merge your new project "{mergeContext.newProjectData?.title}" into this existing project.
                  Review the data below and click "Integrate Data" to add the new metrics and information to this project.
                </p>
                {mergeContext.newMetrics && mergeContext.newMetrics.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">New Metrics to Add:</p>
                    <div className="flex flex-wrap gap-2">
                      {mergeContext.newMetrics.map((metric: any, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {metric.name}: {metric.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelMerge}
                  data-testid="button-cancel-merge"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleIntegrateMergeData}
                  data-testid="button-integrate-merge"
                >
                  Integrate Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-4xl font-bold">{project.title}</h1>
            <Badge variant="default">{project.type}</Badge>
            {project.customCategory && (
              <Badge variant="secondary">{project.customCategory}</Badge>
            )}
            <Badge variant="outline" className="capitalize">{project.status || "active"}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Created on {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/project/${projectId}/forecast`}>
            <Button variant="default" data-testid="button-forecast">
              <LineChart className="h-4 w-4 mr-2" />
              Forecast
            </Button>
          </Link>
          {isAuthorized && (
            <>
              <Button 
                variant="default" 
                onClick={() => setIsCreateSurveyDialogOpen(true)}
                data-testid="button-create-survey"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Create Survey
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setIsUpdateDialogOpen(true)}
                data-testid="button-upload-data"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload New Data
              </Button>
              <Button variant="outline" data-testid="button-edit-project">
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Overall Impact Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className={`text-6xl font-bold font-mono ${getScoreColor(impactScore)}`}>
                    {impactScore}
                  </span>
                  <span className="text-2xl text-muted-foreground">/ 100</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="default" className="text-lg px-3 py-1">
                    Grade: {getScoreGrade(impactScore)}
                  </Badge>
                </div>
              </div>
              <TrendingUp className="h-24 w-24 text-primary opacity-20" />
            </div>
            <Progress value={impactScore} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground">
              Calculated from {metrics.length} normalized metrics across {groupedMetrics.length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated Cost</span>
              <span className="font-semibold">${Number(project.estimatedCost).toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expected ROI</span>
              <span className="font-semibold">{Number(project.roi)}%</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Metrics</span>
              <span className="font-semibold">{metrics.length}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Metric Categories</span>
              <span className="font-semibold">{groupedMetrics.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Metrics & Scoring</TabsTrigger>
          <TabsTrigger value="timeline">Timeline & Updates</TabsTrigger>
          <TabsTrigger value="description">Description & Files</TabsTrigger>
          <TabsTrigger value="settings">Weights & Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4 mt-6">
          {groupedMetrics.map((group, idx) => (
            <Card key={idx} data-testid={`metric-group-${idx}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{group.type}</CardTitle>
                  <Badge variant="outline">
                    Weight: {group.weight}% | {group.metrics.length} metrics
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.metrics.map((metric, metricIdx) => (
                  <div key={metricIdx} className="space-y-2" data-testid={`metric-${idx}-${metricIdx}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{metric.name}</p>
                        <p className="text-sm text-muted-foreground">{metric.value}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold font-mono ${getScoreColor(metric.normalizedScore)}`}>
                          {metric.normalizedScore}
                        </div>
                        <p className="text-xs text-muted-foreground">Normalized Score</p>
                      </div>
                    </div>
                    <Progress value={metric.normalizedScore} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Project Timeline
                </CardTitle>
                <Badge variant="outline">
                  {projectUpdates.length} update{projectUpdates.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectUpdates.map((update, idx) => (
                  <div
                    key={idx}
                    className="relative pl-8 pb-8 border-l-2 border-muted last:pb-0"
                    data-testid={`timeline-update-${idx}`}
                  >
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="default">
                          {update.period} {update.year}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(update.timestamp).toLocaleDateString()} at{' '}
                          {new Date(update.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {update.notes && (
                        <p className="text-sm text-muted-foreground">{update.notes}</p>
                      )}

                      {update.metricUpdates.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Metric Updates:</p>
                          <ul className="text-sm space-y-1">
                            {update.metricUpdates.map((metric, mIdx) => (
                              <li key={mIdx} className="text-muted-foreground">
                                • {metric.name}: <span className="font-mono">{metric.value}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {update.newMetrics.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">New Metrics Added:</p>
                          <ul className="text-sm space-y-1">
                            {update.newMetrics.map((metric, mIdx) => (
                              <li key={mIdx} className="text-muted-foreground">
                                • {metric.name}: <span className="font-mono">{metric.value}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {idx === 0 && (
                        <Badge variant="secondary" className="mt-2">Initial Creation</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="description" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {project.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Uploaded Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* TODO: Implement file upload functionality */}
              <p className="text-center text-muted-foreground py-8">
                No files uploaded
              </p>
            </CardContent>
          </Card>

          {!isAuthorized && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="flex items-center gap-3 p-4">
                <Lock className="h-5 w-5 text-orange-600" />
                <p className="text-sm">
                  You don't have permission to edit this project. Contact the project owner for access.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Metric Type Weights</CardTitle>
              <p className="text-sm text-muted-foreground">
                Adjust the importance of each metric category to calculate the overall impact score
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {groupedMetrics.map((group, idx) => (
                <div key={idx} className="space-y-3" data-testid={`weight-slider-${idx}`}>
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">{group.type}</Label>
                    <Badge variant="secondary" className="font-mono">
                      {group.weight}%
                    </Badge>
                  </div>
                  <Slider
                    value={[group.weight]}
                    onValueChange={(value) => handleWeightChange(group.type, value)}
                    max={100}
                    step={5}
                    disabled={!isAuthorized}
                    data-testid={`slider-${idx}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    Affects {group.metrics.length} metric{group.metrics.length !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <span className="font-semibold">Total Weight</span>
                <span className="text-lg font-bold font-mono">
                  {Object.values(metricWeights).reduce((sum, w) => sum + w, 0)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Total weight should equal 100% for optimal impact score calculation
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProjectUpdateDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        projectId={projectId}
        existingMetrics={existingMetricNames}
        onSubmit={handleProjectUpdate}
      />

      <CreateSurveyDialog
        open={isCreateSurveyDialogOpen}
        onOpenChange={setIsCreateSurveyDialogOpen}
        projectId={projectId}
        projectCategory={project.type}
        onSubmit={handleCreateSurvey}
      />
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
