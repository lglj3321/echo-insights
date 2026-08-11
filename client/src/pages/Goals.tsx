import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, TrendingUp, Calendar, AlertCircle, Loader2 } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Goal } from "@shared/schema";

export default function Goals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: "",
    description: "",
    targetValue: "",
    unit: "",
    category: "",
    targetDate: "",
  });

  // Fetch goals from API
  const { data: goals = [], isLoading: isLoadingGoals, error: goalsError } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: {
      title: string;
      description: string;
      targetValue: string;
      unit: string;
      category: string;
      targetDate: string;
    }) => {
      const response = await apiRequest("POST", "/api/goals", {
        title: goalData.title,
        description: goalData.description || null,
        targetValue: goalData.targetValue,
        unit: goalData.unit,
        category: goalData.category,
        targetDate: goalData.targetDate,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: "Goal Created",
        description: "Your goal has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      setCreateFormData({
        title: "",
        description: "",
        targetValue: "",
        unit: "",
        category: "",
        targetDate: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create goal",
        variant: "destructive",
      });
    },
  });

  // Update goal progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ goalId, currentValue }: { goalId: string; currentValue: number }) => {
      const response = await apiRequest("PATCH", `/api/goals/${goalId}`, {
        currentValue: currentValue.toString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: "Progress Updated",
        description: "Goal progress has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update progress",
        variant: "destructive",
      });
    },
  });

  const handleCreateGoal = () => {
    if (!createFormData.title || !createFormData.targetValue || !createFormData.unit || 
        !createFormData.category || !createFormData.targetDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createGoalMutation.mutate(createFormData);
  };

  const handleUpdateProgress = (goalId: string, currentValue: number) => {
    updateProgressMutation.mutate({ goalId, currentValue });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "text-primary";
    if (progress >= 50) return "text-yellow-600";
    return "text-orange-600";
  };

  const getDaysRemaining = (targetDate: string | Date) => {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getGoalStatus = (goal: Goal): "active" | "completed" | "at-risk" => {
    const currentValue = Number(goal.currentValue);
    const targetValue = Number(goal.targetValue);
    const progress = (currentValue / targetValue) * 100;
    const daysRemaining = getDaysRemaining(goal.targetDate);
    
    if (progress >= 100) return "completed";
    if (daysRemaining < 0 && progress < 50) return "at-risk";
    return "active";
  };

  // Calculate statistics
  const activeGoals = goals.filter(g => getGoalStatus(g) === "active");
  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => {
        const current = Number(g.currentValue);
        const target = Number(g.targetValue);
        return sum + (target > 0 ? (current / target * 100) : 0);
      }, 0) / goals.length)
    : 0;
  const onTrackGoals = goals.filter(g => {
    const current = Number(g.currentValue);
    const target = Number(g.targetValue);
    return target > 0 && (current / target) >= 0.5;
  });
  const needsAttentionGoals = goals.filter(g => {
    const current = Number(g.currentValue);
    const target = Number(g.targetValue);
    return target > 0 && (current / target) < 0.5;
  });

  // Loading state
  if (isLoadingGoals) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading goals...</p>
        </div>
      </div>
    );
  }

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
                <Input 
                  placeholder="e.g., Reduce CO₂ Emissions" 
                  data-testid="input-goal-title"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Describe the goal..." 
                  data-testid="input-goal-description"
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Value</Label>
                  <Input 
                    type="number" 
                    placeholder="500" 
                    data-testid="input-target-value"
                    value={createFormData.targetValue}
                    onChange={(e) => setCreateFormData({ ...createFormData, targetValue: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input 
                    placeholder="tons CO₂" 
                    data-testid="input-unit"
                    value={createFormData.unit}
                    onChange={(e) => setCreateFormData({ ...createFormData, unit: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={createFormData.category}
                    onValueChange={(value) => setCreateFormData({ ...createFormData, category: value })}
                  >
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Environmental">Environmental</SelectItem>
                      <SelectItem value="Packaging">Packaging</SelectItem>
                      <SelectItem value="Water">Water</SelectItem>
                      <SelectItem value="Waste">Waste</SelectItem>
                      <SelectItem value="Energy">Energy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Input 
                    type="date" 
                    data-testid="input-target-date"
                    value={createFormData.targetDate}
                    onChange={(e) => setCreateFormData({ ...createFormData, targetDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  data-testid="button-save-goal"
                  onClick={handleCreateGoal}
                  disabled={createGoalMutation.isPending}
                >
                  {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
                </Button>
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
            <div className="text-3xl font-bold font-mono">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{avgProgress}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all goals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{onTrackGoals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Meeting targets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{needsAttentionGoals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Behind schedule</p>
          </CardContent>
        </Card>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <Target className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No goals yet. Create your first goal to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const currentValue = Number(goal.currentValue);
            const targetValue = Number(goal.targetValue);
            const progress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
            const daysRemaining = getDaysRemaining(goal.targetDate);
            const status = getGoalStatus(goal);
            
            return (
              <Card key={goal.id} data-testid={`card-goal-${goal.id}`} className="hover-elevate">
                <CardHeader>
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                      )}
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
                        {currentValue.toLocaleString()} / {targetValue.toLocaleString()} {goal.unit}
                      </span>
                      <span className="text-muted-foreground">
                        {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Overdue'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      data-testid={`button-update-progress-${goal.id}`}
                      onClick={() => {
                        const newValue = prompt(`Enter new current value for ${goal.title}:`, currentValue.toString());
                        if (newValue !== null && !isNaN(parseFloat(newValue))) {
                          handleUpdateProgress(goal.id, parseFloat(newValue));
                        }
                      }}
                    >
                      Update Progress
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
