import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  GitCompare,
  TrendingUp,
  CheckCircle2,
  Award,
  BarChart3,
  Loader2,
} from "lucide-react";
import { getQueryFn, authFetch } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { getProjectImpactScore } from "@/lib/impactScore";
import type { Project as ProjectType } from "@/components/ProjectCard";
import type { ProjectMetric } from "@shared/schema";

interface Project {
  id: string;
  title: string;
  category: string;
  impactScore: number;
  metrics: { name: string; value: string; normalizedScore: number }[];
}

export default function Comparison() {
  const { user } = useAuth();
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

  // Fetch projects from API
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<ProjectType[]>({
    queryKey: ['/api/projects'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Fetch metrics for all projects
  const { data: projectsWithMetrics } = useQuery({
    queryKey: ['/api/projects', 'metrics'],
    queryFn: async () => {
      const projectsWithMetricsData = await Promise.all(
        projects.map(async (project) => {
          try {
            const response = await authFetch(`/api/projects/${project.id}/metrics`, {
              credentials: "include",
            });
            if (response.ok) {
              const metrics: ProjectMetric[] = await response.json();
              return {
                projectId: project.id,
                metrics,
              };
            }
          } catch (error) {
            // Skip if metrics not available
          }
          return {
            projectId: project.id,
            metrics: [],
          };
        })
      );
      return projectsWithMetricsData;
    },
    enabled: !!user && projects.length > 0,
  });

  // Format projects with metrics and calculate impact scores
  const availableProjects: Project[] = useMemo(() => {
    return projects.map(project => {
      const projectMetrics = projectsWithMetrics?.find(p => p.projectId === project.id)?.metrics || [];
      
      // Use server-calculated impactScore for consistency across all pages
      // This ensures the same score appears in ProjectDetails, Comparison, Dashboard, etc.
      const impactScore = getProjectImpactScore(project, projectMetrics);

      // Format metrics for comparison
      const formattedMetrics = projectMetrics.map(metric => {
        // Use normalizedScore if available, otherwise calculate it
        let normalizedScore = 0;
        
        if (metric.normalizedScore) {
          normalizedScore = Number(metric.normalizedScore);
        } else {
          const numValue = parseFloat(metric.value || "0");
          if (!isNaN(numValue)) {
            const name = metric.metricName.toLowerCase();
            const unit = (metric.unit || "").toLowerCase();
            
            // CO2/Carbon emissions
            if (name.includes("co2") || name.includes("carbon") || name.includes("emission")) {
              normalizedScore = Math.min(100, Math.max(0, Math.round(numValue * 10)));
            }
            // Percentage
            else if (unit.includes("%") || metric.value.includes("%")) {
              normalizedScore = Math.min(100, Math.max(0, Math.round(numValue)));
            }
            // Water/Energy savings
            else if (name.includes("water") || name.includes("energy") || name.includes("saving")) {
              normalizedScore = Math.min(100, Math.round(numValue / 10));
            }
            // Cost savings
            else if (name.includes("cost") || name.includes("saving")) {
              normalizedScore = Math.min(100, Math.round(numValue / 100));
            }
            // Default
            else {
              normalizedScore = Math.min(100, Math.max(0, Math.round(numValue * 5)));
            }
          }
        }

        return {
          name: metric.metricName,
          value: `${metric.value}${metric.unit ? ` ${metric.unit}` : ""}`,
          normalizedScore: Math.round(normalizedScore),
        };
      });

      // Add default metrics from project data if no metrics exist
      if (formattedMetrics.length === 0) {
        if (project.co2Saved) {
          formattedMetrics.push({
            name: "CO₂ Emissions Reduced",
            value: `${project.co2Saved} tons`,
            normalizedScore: Math.min(100, Math.round(Number(project.co2Saved) * 10)),
          });
        }
        if (project.roi) {
          formattedMetrics.push({
            name: "ROI",
            value: `${project.roi}%`,
            normalizedScore: Math.min(100, Math.round(Number(project.roi) * 4)),
          });
        }
        if (project.waterSaved) {
          formattedMetrics.push({
            name: "Water Conservation",
            value: `${project.waterSaved} liters`,
            normalizedScore: Math.min(100, Math.round(Number(project.waterSaved) / 10)),
          });
        }
        formattedMetrics.push({
          name: "Estimated Cost",
          value: `$${Number(project.estimatedCost).toLocaleString()}`,
          normalizedScore: Math.min(100, Math.max(0, 100 - Math.round(Number(project.estimatedCost) / 1000))),
        });
      }

      return {
        id: project.id,
        title: project.title,
        category: project.customCategory || project.type || "Other",
        impactScore,
        metrics: formattedMetrics,
      };
    });
  }, [projects, projectsWithMetrics]);

  if (isLoadingProjects) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (availableProjects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Project Comparison</h1>
          <p className="text-muted-foreground mt-1">
            Compare up to 3 projects side-by-side to analyze similarities and metrics
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GitCompare className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Projects Available</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Create some projects first to compare them
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleProject = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      if (newSelected.size >= 3) {
        return; // Max 3 projects
      }
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const selectedProjectsData = availableProjects.filter(p => selectedProjects.has(p.id));

  const calculateSimilarity = (project1: Project, project2: Project): number => {
    const metrics1 = new Set(project1.metrics.map(m => m.name.toLowerCase()));
    const metrics2 = new Set(project2.metrics.map(m => m.name.toLowerCase()));
    
    const metrics1Array = Array.from(metrics1);
    const metrics2Array = Array.from(metrics2);
    
    const intersection = new Set(metrics1Array.filter(m => metrics2.has(m)));
    const union = new Set([...metrics1Array, ...metrics2Array]);
    
    const metricOverlap = (intersection.size / union.size) * 100;
    
    const categoryMatch = project1.category === project2.category ? 30 : 0;
    
    return Math.round(metricOverlap * 0.7 + categoryMatch * 0.3);
  };

  const getOverlappingMetrics = () => {
    if (selectedProjectsData.length < 2) return { count: 0, percentage: 0, metrics: [] };
    
    const metricsByProject = selectedProjectsData.map(p => 
      new Set(p.metrics.map(m => m.name.toLowerCase()))
    );
    
    const intersection = metricsByProject.reduce((acc, curr) => 
      new Set(Array.from(acc).filter(m => curr.has(m)))
    );
    
    const allMetrics = new Set(selectedProjectsData.flatMap(p => p.metrics.map(m => m.name.toLowerCase())));
    
    const overlappingMetricNames = Array.from(intersection).map(name => 
      selectedProjectsData[0].metrics.find(m => m.name.toLowerCase() === name)?.name || name
    );
    
    return {
      count: intersection.size,
      percentage: Math.round((intersection.size / allMetrics.size) * 100),
      metrics: overlappingMetricNames,
    };
  };

  const getAllMetricNames = () => {
    const allMetrics = new Set<string>();
    selectedProjectsData.forEach(project => {
      project.metrics.forEach(metric => {
        allMetrics.add(metric.name);
      });
    });
    return Array.from(allMetrics).sort();
  };

  const getMetricValue = (project: Project, metricName: string) => {
    const metric = project.metrics.find(m => m.name === metricName);
    return metric || null;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-chart-3";
    if (score >= 40) return "text-chart-2";
    return "text-orange-600";
  };

  const overlappingData = getOverlappingMetrics();
  const allMetrics = getAllMetricNames();
  
  // Separate overlapping and unique metrics
  const getMetricsByType = () => {
    const overlappingMetrics = overlappingData.metrics;
    const uniqueMetricsByProject: Record<string, string[]> = {};
    
    selectedProjectsData.forEach(project => {
      const projectMetrics = project.metrics.map(m => m.name);
      const uniqueToProject = projectMetrics.filter(m => !overlappingMetrics.includes(m));
      if (uniqueToProject.length > 0) {
        uniqueMetricsByProject[project.id] = uniqueToProject;
      }
    });
    
    return {
      overlapping: overlappingMetrics,
      unique: uniqueMetricsByProject,
    };
  };
  
  const metricsByType = getMetricsByType();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold">Project Comparison</h1>
          <p className="text-muted-foreground mt-1">
            Compare up to 3 projects side-by-side to analyze similarities and metrics
          </p>
        </div>
        <Badge variant="outline" className="text-base px-4 py-2">
          {selectedProjects.size} / 3 Selected
        </Badge>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {availableProjects.map((project) => (
              <div
                key={project.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover-elevate ${
                  selectedProjects.has(project.id) ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => toggleProject(project.id)}
                data-testid={`project-select-${project.id}`}
              >
                <Checkbox
                  checked={selectedProjects.has(project.id)}
                  disabled={!selectedProjects.has(project.id) && selectedProjects.size >= 3}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{project.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {project.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Score: {project.impactScore}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {selectedProjectsData.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <GitCompare className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Projects Selected</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Select at least one project from the list to begin comparison
                </p>
              </CardContent>
            </Card>
          )}

          {selectedProjectsData.length > 0 && (
            <>
              {selectedProjectsData.length >= 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Similarity Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedProjectsData.map((project1, i) => 
                        selectedProjectsData.slice(i + 1).map((project2, j) => {
                          const similarity = calculateSimilarity(project1, project2);
                          return (
                            <div key={`${i}-${j}`} className="space-y-2">
                              <div className="text-sm font-medium">
                                {project1.title} vs {project2.title}
                              </div>
                              <div className="flex items-center gap-3">
                                <Progress value={similarity} className="flex-1 h-2" />
                                <span className={`text-lg font-bold font-mono ${getScoreColor(similarity)}`}>
                                  {similarity}%
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-lg bg-muted">
                        <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold font-mono">{overlappingData.count}</p>
                        <p className="text-xs text-muted-foreground">Overlapping Metrics</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted">
                        <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold font-mono">{overlappingData.percentage}%</p>
                        <p className="text-xs text-muted-foreground">Overlap Percentage</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted">
                        <Award className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <p className="text-2xl font-bold font-mono">{allMetrics.length}</p>
                        <p className="text-xs text-muted-foreground">Total Unique Metrics</p>
                      </div>
                    </div>

                    {overlappingData.metrics.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Common Metrics:</p>
                        <div className="flex flex-wrap gap-2">
                          {overlappingData.metrics.map((metric, idx) => (
                            <Badge key={idx} variant="default">
                              {metric}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Impact Score Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {selectedProjectsData.map((project) => (
                      <div key={project.id} className="space-y-3">
                        <div>
                          <p className="font-semibold mb-1">{project.title}</p>
                          <Badge variant="secondary">{project.category}</Badge>
                        </div>
                        <div className="text-center p-6 rounded-lg bg-muted">
                          <p className={`text-5xl font-bold font-mono ${getScoreColor(project.impactScore)}`}>
                            {project.impactScore}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">Impact Score</p>
                        </div>
                        <Progress value={project.impactScore} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Metrics Comparison</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Side-by-side comparison of all metrics across selected projects
                  </p>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Overlapping Metrics Section */}
                  {metricsByType.overlapping.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Shared Metrics</h3>
                        <Badge variant="outline" className="ml-auto">
                          {metricsByType.overlapping.length} shared
                        </Badge>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-4 font-semibold min-w-[200px]">Metric</th>
                              {selectedProjectsData.map((project) => (
                                <th key={project.id} className="text-center p-4 font-semibold min-w-[180px]">
                                  <div className="space-y-1">
                                    <p className="text-sm">{project.title}</p>
                                    <Badge variant="outline" className="text-xs">
                                      {project.category}
                                    </Badge>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {metricsByType.overlapping.map((metricName, idx) => (
                              <tr key={idx} className="border-b hover-elevate">
                                <td className="p-4 font-medium">{metricName}</td>
                                {selectedProjectsData.map((project) => {
                                  const metric = getMetricValue(project, metricName);
                                  return (
                                    <td key={project.id} className="p-4 text-center">
                                      {metric ? (
                                        <div className="space-y-2">
                                          <p className="text-sm font-mono">{metric.value}</p>
                                          <div className="flex items-center justify-center gap-2">
                                            <Progress value={metric.normalizedScore} className="h-1.5 flex-1" />
                                            <span className={`text-xs font-bold font-mono ${getScoreColor(metric.normalizedScore)}`}>
                                              {metric.normalizedScore}
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground text-sm">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Unique Metrics Section */}
                  {Object.keys(metricsByType.unique).length > 0 && (
                    <div>
                      <Separator className="mb-6" />
                      <div className="flex items-center gap-2 mb-4">
                        <Award className="h-5 w-5 text-chart-3" />
                        <h3 className="text-lg font-semibold">Unique Metrics</h3>
                        <Badge variant="outline" className="ml-auto">
                          {Object.values(metricsByType.unique).reduce((sum, metrics) => sum + metrics.length, 0)} total
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {selectedProjectsData.map((project) => {
                          const uniqueMetrics = metricsByType.unique[project.id] || [];
                          if (uniqueMetrics.length === 0) return null;
                          
                          return (
                            <div key={project.id} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold">{project.title}</p>
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    {project.category}
                                  </Badge>
                                </div>
                                <Badge variant="outline">
                                  {uniqueMetrics.length}
                                </Badge>
                              </div>
                              <div className="space-y-2 border rounded-lg p-4">
                                {uniqueMetrics.map((metricName, idx) => {
                                  const metric = getMetricValue(project, metricName);
                                  return (
                                    <div key={idx} className="space-y-2 pb-3 last:pb-0 border-b last:border-0">
                                      <p className="text-sm font-medium">{metricName}</p>
                                      {metric && (
                                        <>
                                          <p className="text-sm font-mono text-muted-foreground">{metric.value}</p>
                                          <div className="flex items-center gap-2">
                                            <Progress value={metric.normalizedScore} className="h-1.5 flex-1" />
                                            <span className={`text-xs font-bold font-mono ${getScoreColor(metric.normalizedScore)}`}>
                                              {metric.normalizedScore}
                                            </span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Show all metrics if only one project selected */}
                  {selectedProjectsData.length === 1 && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-4 font-semibold min-w-[200px]">Metric</th>
                            <th className="text-center p-4 font-semibold min-w-[180px]">
                              <div className="space-y-1">
                                <p className="text-sm">{selectedProjectsData[0].title}</p>
                                <Badge variant="outline" className="text-xs">
                                  {selectedProjectsData[0].category}
                                </Badge>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProjectsData[0].metrics.map((metric, idx) => (
                            <tr key={idx} className="border-b hover-elevate">
                              <td className="p-4 font-medium">{metric.name}</td>
                              <td className="p-4 text-center">
                                <div className="space-y-2">
                                  <p className="text-sm font-mono">{metric.value}</p>
                                  <div className="flex items-center justify-center gap-2">
                                    <Progress value={metric.normalizedScore} className="h-1.5 flex-1" />
                                    <span className={`text-xs font-bold font-mono ${getScoreColor(metric.normalizedScore)}`}>
                                      {metric.normalizedScore}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
