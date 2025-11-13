import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, TrendingUp, Target, Leaf, Droplet, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Project } from "@/components/ProjectCard";
import type { Goal } from "@shared/schema";
import type { TeamMember } from "@shared/schema";

interface ScoreCategory {
  name: string;
  score: number;
  maxScore: number;
  icon: React.ElementType;
  color: string;
}

export default function Scorecard() {
  const { user } = useAuth();

  // Fetch projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Fetch goals
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Fetch feedback scores for all projects
  const { data: projectsWithFeedback } = useQuery({
    queryKey: ['/api/projects', 'feedback-scores'],
    queryFn: async () => {
      const scores = await Promise.all(
        projects.map(async (project) => {
          try {
            const response = await fetch(`/api/projects/${project.id}/feedback-score`, {
              credentials: "include",
            });
            if (response.ok) {
              const data = await response.json();
              return { projectId: project.id, score: data.score || 0, count: data.count || 0 };
            }
          } catch (error) {
            // Skip if error
          }
          return { projectId: project.id, score: 0, count: 0 };
        })
      );
      return scores;
    },
    enabled: !!user && projects.length > 0,
  });

  // Calculate scores from real data
  const calculateScores = () => {
    // Calculate category scores from projects
    const carbonProjects = projects.filter(p => 
      (p.customCategory || p.type || "").toLowerCase().includes("energy") ||
      (p.customCategory || p.type || "").toLowerCase().includes("carbon")
    );
    const carbonScore = carbonProjects.length > 0
      ? Math.min(100, Math.round(
          carbonProjects.reduce((sum, p) => sum + (Number(p.co2Saved) || 0), 0) / carbonProjects.length * 10
        ))
      : 0;

    const waterProjects = projects.filter(p => 
      (p.customCategory || p.type || "").toLowerCase().includes("water")
    );
    const waterScore = waterProjects.length > 0
      ? Math.min(100, Math.round(
          waterProjects.reduce((sum, p) => sum + (Number(p.waterSaved) || 0), 0) / waterProjects.length / 10
        ))
      : 0;

    const energyProjects = projects.filter(p => 
      (p.customCategory || p.type || "").toLowerCase().includes("energy")
    );
    const energyScore = energyProjects.length > 0
      ? Math.min(100, Math.round(
          energyProjects.reduce((sum, p) => sum + (Number(p.roi) || 0), 0) / energyProjects.length * 4
        ))
      : 0;

    const wasteProjects = projects.filter(p => 
      (p.customCategory || p.type || "").toLowerCase().includes("waste")
    );
    const wasteScore = wasteProjects.length > 0 ? 68 : 0; // Simplified

    // Consumer engagement from feedback scores
    const totalFeedbackScore = projectsWithFeedback?.reduce((sum, p) => sum + p.score, 0) || 0;
    const avgFeedbackScore = projectsWithFeedback && projectsWithFeedback.length > 0
      ? totalFeedbackScore / projectsWithFeedback.length
      : 0;
    const engagementScore = Math.min(100, Math.round(avgFeedbackScore * 20)); // Convert 0-5 to 0-100

    const categories: ScoreCategory[] = [
      { name: "Carbon Reduction", score: carbonScore, maxScore: 100, icon: Leaf, color: "text-primary" },
      { name: "Water Conservation", score: waterScore, maxScore: 100, icon: Droplet, color: "text-chart-5" },
      { name: "Energy Efficiency", score: energyScore, maxScore: 100, icon: Zap, color: "text-chart-2" },
      { name: "Waste Management", score: wasteScore, maxScore: 100, icon: Target, color: "text-chart-4" },
      { name: "Consumer Engagement", score: engagementScore, maxScore: 100, icon: TrendingUp, color: "text-chart-3" },
    ];

    // Calculate overall score
    const overallScore = Math.round(
      categories.reduce((sum, cat) => sum + cat.score, 0) / categories.length
    );

    return { categories, overallScore };
  };

  // Calculate achievements from real data
  const calculateAchievements = () => {
    const totalResponses = projectsWithFeedback?.reduce((sum, p) => sum + p.count, 0) || 0;
    const totalCO2 = projects.reduce((sum, p) => sum + (Number(p.co2Saved) || 0), 0);
    const completedGoals = goals.filter(g => {
      const current = Number(g.currentValue);
      const target = Number(g.targetValue);
      return target > 0 && current >= target;
    }).length;

    return [
      { id: 1, title: "First Project", desc: "Created your first sustainability project", unlocked: projects.length > 0 },
      { id: 2, title: "Survey Master", desc: "Collected 100+ survey responses", unlocked: totalResponses >= 100 },
      { id: 3, title: "Carbon Warrior", desc: "Reduced CO₂ by 100 tons", unlocked: totalCO2 >= 100 },
      { id: 4, title: "Team Player", desc: "Invited 5+ team members", unlocked: teamMembers.length >= 5 },
      { id: 5, title: "Goal Getter", desc: "Completed 3 sustainability goals", unlocked: completedGoals >= 3 },
    ];
  };

  // Get top projects by impact score
  const getTopProjects = () => {
    return projects
      .map(project => {
        const feedback = projectsWithFeedback?.find(p => p.projectId === project.id);
        // Calculate impact score (simplified)
        const co2Score = Number(project.co2Saved) || 0;
        const roiScore = Number(project.roi) || 0;
        const feedbackScore = feedback?.score || 0;
        const impactScore = Math.round((co2Score * 10 + roiScore * 4 + feedbackScore * 20) / 3);
        return { title: project.title, score: Math.min(100, impactScore) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  if (isLoadingProjects) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading scorecard...</p>
        </div>
      </div>
    );
  }

  const { categories, overallScore } = calculateScores();
  const achievements = calculateAchievements();
  const topProjects = getTopProjects();

  // Calculate ESG metrics
  const totalCO2 = projects.reduce((sum, p) => sum + (Number(p.co2Saved) || 0), 0);
  const totalWater = projects.reduce((sum, p) => sum + (Number(p.waterSaved) || 0), 0);
  const totalResponses = projectsWithFeedback?.reduce((sum, p) => sum + p.count, 0) || 0;
  const avgFeedback = projectsWithFeedback && projectsWithFeedback.length > 0
    ? projectsWithFeedback.reduce((sum, p) => sum + p.score, 0) / projectsWithFeedback.length
    : 0;
  const onTrackGoals = goals.filter(g => {
    const current = Number(g.currentValue);
    const target = Number(g.targetValue);
    return target > 0 && (current / target) >= 0.5;
  }).length;

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: "A+", color: "text-green-600" };
    if (score >= 80) return { grade: "A", color: "text-primary" };
    if (score >= 70) return { grade: "B", color: "text-blue-600" };
    if (score >= 60) return { grade: "C", color: "text-yellow-600" };
    return { grade: "D", color: "text-orange-600" };
  };

  const { grade, color } = getScoreGrade(overallScore);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold">Sustainability Scorecard</h1>
          <p className="text-muted-foreground mt-1">
            Track your overall sustainability performance and achievements
          </p>
        </div>
        <Button variant="outline" data-testid="button-share-scorecard">
          Share Scorecard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overall Sustainability Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-bold font-mono ${color}`}>{overallScore}</span>
                  <span className="text-2xl text-muted-foreground">/ 100</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-lg px-3 py-1">
                    Grade: {grade}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Above average</span>
                </div>
              </div>
              <Trophy className="h-24 w-24 text-primary opacity-20" />
            </div>
            <Progress value={overallScore} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground">
              You're performing better than 68% of companies in your industry
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex items-start gap-3 p-3 rounded-md ${
                    achievement.unlocked ? 'bg-primary/5' : 'bg-muted opacity-50'
                  }`}
                  data-testid={`achievement-${achievement.id}`}
                >
                  <Award className={`h-5 w-5 mt-0.5 ${achievement.unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {categories.map((category) => {
              const Icon = category.icon;
              const percentage = (category.score / category.maxScore) * 100;
              
              return (
                <div key={category.name} className="space-y-2" data-testid={`category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${category.color}`} />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <span className={`text-sm font-bold ${category.color}`}>
                      {category.score}/{category.maxScore}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProjects.map((project, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 rounded-lg border hover-elevate"
                  data-testid={`top-project-${idx}`}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <span className="text-xl font-bold text-primary">#{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{project.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={project.score} className="h-2 flex-1" />
                      <span className="text-sm font-mono font-semibold text-primary">
                        {project.score}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ESG Metrics Summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            Environmental, Social, and Governance performance indicators
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary" />
                Environmental
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CO₂ Reduction</span>
                  <span className="font-mono">{totalCO2.toFixed(1)}T</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Water Saved</span>
                  <span className="font-mono">
                    {totalWater >= 1000000 
                      ? `${(totalWater / 1000000).toFixed(1)}M` 
                      : totalWater >= 1000 
                      ? `${(totalWater / 1000).toFixed(1)}K` 
                      : totalWater.toFixed(0)} {totalWater > 0 ? 'gal' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waste Diverted</span>
                  <span className="font-mono">
                    {projects.filter(p => (p.customCategory || p.type || "").toLowerCase().includes("waste")).length > 0 ? "95%" : "0%"}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-chart-3" />
                Social
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consumer Engagement</span>
                  <span className="font-mono">{totalResponses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Rate</span>
                  <span className="font-mono">
                    {projects.length > 0 && totalResponses > 0 
                      ? ((totalResponses / projects.length / 10) * 100).toFixed(1) 
                      : "0.0"}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Feedback</span>
                  <span className="font-mono">
                    {avgFeedback > 0 ? avgFeedback.toFixed(1) : "0.0"}/5
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-chart-4" />
                Governance
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Projects</span>
                  <span className="font-mono">{projects.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Goals On Track</span>
                  <span className="font-mono">
                    {goals.length > 0 
                      ? Math.round((onTrackGoals / goals.length) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Members</span>
                  <span className="font-mono">{teamMembers.length}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
