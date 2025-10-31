import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Goal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  category: string;
  targetDate: string;
  status: "active" | "completed" | "at-risk";
}

export default function Goals() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // TODO: Remove mock data - replace with actual API data
  const mockGoals: Goal[] = [
    {
      id: "1",
      title: "Reduce CO₂ Emissions",
      description: "Reduce total carbon emissions by 500 tons by end of 2026",
      targetValue: 500,
      currentValue: 187.5,
      unit: "tons CO₂",
      category: "Environmental",
      targetDate: "2026-12-31",
      status: "active",
    },
    {
      id: "2",
      title: "Increase Recycled Materials",
      description: "Use 80% recycled materials across all product packaging",
      targetValue: 80,
      currentValue: 52,
      unit: "% recycled",
      category: "Packaging",
      targetDate: "2025-12-31",
      status: "active",
    },
    {
      id: "3",
      title: "Water Conservation",
      description: "Save 1 million gallons of water annually",
      targetValue: 1000000,
      currentValue: 650000,
      unit: "gallons",
      category: "Water",
      targetDate: "2025-06-30",
      status: "active",
    },
    {
      id: "4",
      title: "Zero Waste to Landfill",
      description: "Achieve zero waste sent to landfill across all facilities",
      targetValue: 100,
      currentValue: 95,
      unit: "% diverted",
      category: "Waste",
      targetDate: "2025-03-31",
      status: "active",
    },
  ];

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "text-primary";
    if (progress >= 50) return "text-yellow-600";
    return "text-orange-600";
  };

  const getDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold">Goals & Targets</h1>
          <p className="text-muted-foreground mt-1">
            Track progress toward sustainability objectives and milestones
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-goal">
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Goal Title</Label>
                <Input placeholder="e.g., Reduce CO₂ Emissions" data-testid="input-goal-title" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Describe the goal..." data-testid="input-goal-description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Value</Label>
                  <Input type="number" placeholder="500" data-testid="input-target-value" />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input placeholder="tons CO₂" data-testid="input-unit" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="environmental">Environmental</SelectItem>
                      <SelectItem value="packaging">Packaging</SelectItem>
                      <SelectItem value="water">Water</SelectItem>
                      <SelectItem value="waste">Waste</SelectItem>
                      <SelectItem value="energy">Energy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Input type="date" data-testid="input-target-date" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button data-testid="button-save-goal">Create Goal</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{mockGoals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              {Math.round(mockGoals.reduce((sum, g) => sum + (g.currentValue / g.targetValue * 100), 0) / mockGoals.length)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all goals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              {mockGoals.filter(g => (g.currentValue / g.targetValue) >= 0.5).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Meeting targets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              {mockGoals.filter(g => (g.currentValue / g.targetValue) < 0.5).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Behind schedule</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {mockGoals.map((goal) => {
          const progress = (goal.currentValue / goal.targetValue) * 100;
          const daysRemaining = getDaysRemaining(goal.targetDate);
          
          return (
            <Card key={goal.id} data-testid={`card-goal-${goal.id}`} className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                  </div>
                  <Badge variant="outline">{goal.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className={`font-bold ${getProgressColor(progress)}`}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono">
                      {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()} {goal.unit}
                    </span>
                    <span className="text-muted-foreground">
                      {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Overdue'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" data-testid={`button-update-progress-${goal.id}`}>
                    Update Progress
                  </Button>
                  <Button variant="outline" size="sm" data-testid={`button-view-details-${goal.id}`}>
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
