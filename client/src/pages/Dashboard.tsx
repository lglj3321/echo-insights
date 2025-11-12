import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/MetricCard";
import { ProjectCard } from "@/components/ProjectCard";
import { ImpactCostMatrix } from "@/components/ImpactCostMatrix";
import { ProjectTypeChart } from "@/components/ProjectTypeChart";
import { FeedbackTrendChart } from "@/components/FeedbackTrendChart";
import { FolderKanban, Users, TrendingUp, Leaf, Loader2 } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Project } from "@/components/ProjectCard";

interface DashboardStats {
  totalProjects: number;
  projectsThisMonth: number;
  totalResponses: number;
  avgFeedbackScore: number;
  totalCo2Saved: number;
  responseGrowth: string;
}

interface TypeDistribution {
  type: string;
  count: number;
}

interface FeedbackTrend {
  date: string;
  score: number;
}

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Fetch dashboard statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
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

  // Get recent projects (last 3) with feedback data
  const recentProjects = projects.slice(0, 3).map(project => {
    const feedbackData = projectsWithFeedback?.find(f => f.projectId === project.id);
    return {
      ...project,
      estimatedCost: Number(project.estimatedCost),
      roi: Number(project.roi),
      co2Saved: project.co2Saved ? Number(project.co2Saved) : 0,
      waterSaved: project.waterSaved ? Number(project.waterSaved) : undefined,
      feedbackScore: feedbackData?.feedbackScore,
      responseCount: feedbackData?.responseCount || 0,
      impactScore: project.impactScore ? Number(project.impactScore) : undefined,
      // Ensure type is set correctly (use customCategory if available)
      type: project.customCategory || project.type,
    };
  });

  // Loading state
  const isLoading = isLoadingProjects || isLoadingStats || isLoadingDistribution || isLoadingTrend;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your sustainability projects and consumer feedback
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Projects"
            value={stats?.totalProjects.toString() || "0"}
            icon={FolderKanban}
            subtitle="Active sustainability initiatives"
            trend={stats?.projectsThisMonth ? { 
              value: `+${stats.projectsThisMonth} this month`, 
              isPositive: true 
            } : undefined}
          />
          <MetricCard
            title="Consumer Responses"
            value={stats?.totalResponses.toLocaleString() || "0"}
            icon={Users}
            subtitle="Feedback collected"
            trend={stats?.responseGrowth ? { 
              value: stats.responseGrowth, 
              isPositive: true 
            } : undefined}
          />
          <MetricCard
            title="Avg. Feedback Score"
            value={stats?.avgFeedbackScore.toFixed(1) || "0.0"}
            icon={TrendingUp}
            subtitle="Out of 5.0"
          />
          <MetricCard
            title="CO₂ Reduction"
            value={`${stats?.totalCo2Saved.toFixed(1) || "0.0"}T`}
            icon={Leaf}
            subtitle="Estimated annual impact"
            trend={{ value: "Ongoing", isPositive: true }}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Analytics Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ImpactCostMatrix projects={recentProjects} />
          </div>
          <div className="lg:col-span-1">
            <ProjectTypeChart data={typeDistribution} />
          </div>
          <div className="lg:col-span-1">
            <FeedbackTrendChart data={feedbackTrend} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
        {recentProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recentProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No projects yet. Create your first project to get started!</p>
          </div>
        )}
      </section>
    </div>
  );
}
