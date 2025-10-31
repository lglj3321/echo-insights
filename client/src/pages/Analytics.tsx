import { MetricCard } from "@/components/MetricCard";
import { ImpactCostMatrix } from "@/components/ImpactCostMatrix";
import { ProjectTypeChart } from "@/components/ProjectTypeChart";
import { FeedbackTrendChart } from "@/components/FeedbackTrendChart";
import { TrendingUp, Users, Star, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/components/ProjectCard";

export default function Analytics() {
  // TODO: Remove mock data - replace with actual API data
  const mockProjects: Project[] = [
    {
      id: "1",
      title: "100% Recycled Packaging",
      description: "Switch all product packaging to 100% recycled materials",
      type: "Packaging",
      estimatedCost: 45000,
      roi: 18,
      co2Saved: 2.5,
      waterSaved: 500,
      feedbackScore: 4.6,
      responseCount: 234
    },
    {
      id: "2",
      title: "Solar Energy Installation",
      description: "Install solar panels on manufacturing facilities",
      type: "Energy",
      estimatedCost: 120000,
      roi: 25,
      co2Saved: 8.2,
      feedbackScore: 4.1,
      responseCount: 156
    },
    {
      id: "3",
      title: "Local Sourcing Initiative",
      description: "Source 80% of ingredients from local suppliers",
      type: "Sourcing",
      estimatedCost: 28000,
      roi: 12,
      co2Saved: 1.8,
      feedbackScore: 4.8,
      responseCount: 312
    },
    {
      id: "4",
      title: "Water Recycling System",
      description: "Implement advanced water recycling in production",
      type: "Water",
      estimatedCost: 75000,
      roi: 20,
      co2Saved: 3.5,
      feedbackScore: 4.3,
      responseCount: 189
    },
    {
      id: "5",
      title: "Zero Waste Initiative",
      description: "Achieve zero waste to landfill by 2025",
      type: "Waste",
      estimatedCost: 35000,
      roi: 15,
      co2Saved: 2.1,
      feedbackScore: 4.4,
      responseCount: 201
    },
    {
      id: "6",
      title: "Electric Fleet Transition",
      description: "Replace delivery vehicles with electric alternatives",
      type: "Logistics",
      estimatedCost: 95000,
      roi: 22,
      co2Saved: 5.8,
      feedbackScore: 4.2,
      responseCount: 167
    },
  ];

  const typeDistribution = [
    { type: "Packaging", count: 8 },
    { type: "Energy", count: 5 },
    { type: "Sourcing", count: 6 },
    { type: "Waste", count: 3 },
    { type: "Water", count: 2 },
  ];

  const feedbackTrend = [
    { date: "Jan", score: 3.8 },
    { date: "Feb", score: 4.1 },
    { date: "Mar", score: 4.3 },
    { date: "Apr", score: 4.2 },
    { date: "May", score: 4.6 },
    { date: "Jun", score: 4.5 },
  ];

  const topProjects = [...mockProjects]
    .sort((a, b) => (b.feedbackScore || 0) - (a.feedbackScore || 0))
    .slice(0, 5);

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
          value="78%"
          icon={Users}
          subtitle="Across all projects"
          trend={{ value: "+5% vs last month", isPositive: true }}
        />
        <MetricCard
          title="Highest Rated"
          value="4.8"
          icon={Star}
          subtitle="Local Sourcing Initiative"
        />
        <MetricCard
          title="Total Investment"
          value="$398K"
          icon={TrendingUp}
          subtitle="Across 24 projects"
        />
        <MetricCard
          title="Avg ROI"
          value="18.7%"
          icon={Target}
          subtitle="Expected return"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImpactCostMatrix projects={mockProjects} />
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
              {topProjects.map((project, idx) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
