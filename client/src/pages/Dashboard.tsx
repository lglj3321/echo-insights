import { MetricCard } from "@/components/MetricCard";
import { ProjectCard } from "@/components/ProjectCard";
import { ImpactCostMatrix } from "@/components/ImpactCostMatrix";
import { ProjectTypeChart } from "@/components/ProjectTypeChart";
import { FeedbackTrendChart } from "@/components/FeedbackTrendChart";
import { FolderKanban, Users, TrendingUp, Leaf } from "lucide-react";

export default function Dashboard() {
  // TODO: Remove mock data - replace with actual API data
  const mockProjects = [
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
            value="24"
            icon={FolderKanban}
            subtitle="Active sustainability initiatives"
            trend={{ value: "+3 this month", isPositive: true }}
          />
          <MetricCard
            title="Consumer Responses"
            value="1,847"
            icon={Users}
            subtitle="Feedback collected"
            trend={{ value: "+12% this week", isPositive: true }}
          />
          <MetricCard
            title="Avg. Feedback Score"
            value="4.2"
            icon={TrendingUp}
            subtitle="Out of 5.0"
          />
          <MetricCard
            title="CO₂ Reduction"
            value="3.2T"
            icon={Leaf}
            subtitle="Estimated annual impact"
            trend={{ value: "+0.8T planned", isPositive: true }}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Analytics Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ImpactCostMatrix projects={mockProjects} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {mockProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
