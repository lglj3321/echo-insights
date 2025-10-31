import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, TrendingUp, Target, Leaf, Droplet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScoreCategory {
  name: string;
  score: number;
  maxScore: number;
  icon: React.ElementType;
  color: string;
}

export default function Scorecard() {
  const overallScore = 78;

  const categories: ScoreCategory[] = [
    { name: "Carbon Reduction", score: 85, maxScore: 100, icon: Leaf, color: "text-primary" },
    { name: "Water Conservation", score: 72, maxScore: 100, icon: Droplet, color: "text-chart-5" },
    { name: "Energy Efficiency", score: 80, maxScore: 100, icon: Zap, color: "text-chart-2" },
    { name: "Waste Management", score: 68, maxScore: 100, icon: Target, color: "text-chart-4" },
    { name: "Consumer Engagement", score: 88, maxScore: 100, icon: TrendingUp, color: "text-chart-3" },
  ];

  const achievements = [
    { id: 1, title: "First Project", desc: "Created your first sustainability project", unlocked: true },
    { id: 2, title: "Survey Master", desc: "Collected 100+ survey responses", unlocked: true },
    { id: 3, title: "Carbon Warrior", desc: "Reduced CO₂ by 100 tons", unlocked: true },
    { id: 4, title: "Team Player", desc: "Invited 5+ team members", unlocked: false },
    { id: 5, title: "Goal Getter", desc: "Completed 3 sustainability goals", unlocked: false },
  ];

  const topProjects = [
    { title: "Local Sourcing Initiative", score: 92 },
    { title: "100% Recycled Packaging", score: 88 },
    { title: "Solar Energy Installation", score: 85 },
  ];

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
                  <span className="font-mono">3.2T</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Water Saved</span>
                  <span className="font-mono">1.2M gal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waste Diverted</span>
                  <span className="font-mono">95%</span>
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
                  <span className="font-mono">1,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Rate</span>
                  <span className="font-mono">45.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Feedback</span>
                  <span className="font-mono">4.2/5</span>
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
                  <span className="font-mono">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Goals On Track</span>
                  <span className="font-mono">75%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Members</span>
                  <span className="font-mono">4</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
