import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/MetricCard";
import { ImpactCostMatrix } from "@/components/ImpactCostMatrix";
import { ProjectTypeChart } from "@/components/ProjectTypeChart";
import { FeedbackTrendChart } from "@/components/FeedbackTrendChart";
import { TrendingUp, Users, Star, Target, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/components/ProjectCard";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface TypeDistribution {
  type: string;
  count: number;
}

interface FeedbackTrend {
  date: string;
  score: number;
}

export default function Analytics() {
  const { user } = useAuth();

  // Fetch projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Fetch type distribution
  const { data: typeDistribution = [], isLoading: isLoadingDistribution } = useQuery<TypeDistribution[]>({
    queryKey: ['/api/dashboard/type-distribution'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Fetch feedback trend
  const { data: feedbackTrend = [], isLoading: isLoadingTrend } = useQuery<FeedbackTrend[]>({
    queryKey: ['/api/dashboard/feedback-trend'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Fetch feedback scores for projects
  const { data: projectsWithFeedback } = useQuery({
    queryKey: ['/api/projects', 'feedback'],
    queryFn: async () => {
      const projectsWithFeedbackData = await Promise.all(
        projects.map(async (project) => {
          try {
            const response = await fetch(`/api/projects/${project.id}/feedback-score`, {
              credentials: "include",
            });
            if (response.ok) {
              const feedbackData = await response.json();
              return {
                projectId: project.id,
                feedbackScore: feedbackData.score,
                responseCount: feedbackData.count,
              };
            }
          } catch (error) {
            // Skip if feedback data not available
          }
          return {
            projectId: project.id,
            feedbackScore: undefined,
            responseCount: 0,
          };
        })
      );
      return projectsWithFeedbackData;
    },
    enabled: !!user && projects.length > 0,
  });

  // Format projects with feedback data
  const projectsWithData: Project[] = projects.map(project => {
    const feedbackData = projectsWithFeedback?.find(f => f.projectId === project.id);
    return {
      ...project,
      estimatedCost: Number(project.estimatedCost),
      roi: Number(project.roi),
      co2Saved: project.co2Saved ? Number(project.co2Saved) : 0,
      waterSaved: project.waterSaved ? Number(project.waterSaved) : undefined,
      feedbackScore: feedbackData?.feedbackScore,
      responseCount: feedbackData?.responseCount || 0,
      type: project.customCategory || project.type,
    };
  });

  const topProjects = [...projectsWithData]
    .sort((a, b) => (b.feedbackScore || 0) - (a.feedbackScore || 0))
    .slice(0, 5);

  // Calculate statistics
  const totalInvestment = projectsWithData.reduce((sum, p) => sum + p.estimatedCost, 0);
  const avgROI = projectsWithData.length > 0
    ? projectsWithData.reduce((sum, p) => sum + p.roi, 0) / projectsWithData.length
    : 0;
  const highestRated = topProjects.length > 0 ? topProjects[0].feedbackScore || 0 : 0;
  const highestRatedTitle = topProjects.length > 0 ? topProjects[0].title : "";

  // Calculate average response rate (simplified)
  const totalResponses = projectsWithData.reduce((sum, p) => sum + (p.responseCount || 0), 0);
  const avgResponseRate = projectsWithData.length > 0 ? (totalResponses / projectsWithData.length / 10) * 100 : 0;

  const isLoading = isLoadingProjects || isLoadingDistribution || isLoadingTrend;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Deep insights into project performance and consumer feedback
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Response Rate"
          value={`${Math.round(avgResponseRate)}%`}
          icon={Users}
          subtitle="Across all projects"
        />
        <MetricCard
          title="Highest Rated"
          value={highestRated > 0 ? highestRated.toFixed(1) : "0.0"}
          icon={Star}
          subtitle={highestRatedTitle || "No ratings yet"}
        />
        <MetricCard
          title="Total Investment"
          value={`$${(totalInvestment / 1000).toFixed(0)}K`}
          icon={TrendingUp}
          subtitle={`Across ${projectsWithData.length} projects`}
        />
        <MetricCard
          title="Avg ROI"
          value={`${avgROI.toFixed(1)}%`}
          icon={Target}
          subtitle="Expected return"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImpactCostMatrix projects={projectsWithData} />
        <ProjectTypeChart data={typeDistribution} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeedbackTrendChart data={feedbackTrend} />
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Projects</CardTitle>
            <p className="text-sm text-muted-foreground">By consumer feedback score</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProjects.length > 0 ? topProjects.map((project, idx) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                  data-testid={`row-top-project-${idx}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{idx + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{project.title}</p>
                      <p className="text-xs text-muted-foreground">{project.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-mono text-lg">
                      {project.feedbackScore?.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.responseCount} responses
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No projects with feedback yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
