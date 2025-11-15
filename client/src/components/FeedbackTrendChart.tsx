import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Calendar, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { Project } from "./ProjectCard";

interface DataPoint {
  date: string;
  score: number;
  count: number;
}

interface FeedbackTrendChartProps {
  data?: DataPoint[];
  projectId?: string;
  projectTitle?: string;
  showControls?: boolean;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
}

interface FeedbackTrendResponse {
  data: DataPoint[];
  statistics: {
    averageScore: number;
    totalResponses: number;
    trend: 'up' | 'down' | 'stable';
    periodCount: number;
  };
}

export function FeedbackTrendChart({ 
  data: propData,
  projectId,
  projectTitle,
  showControls = true,
  timeRange: propTimeRange,
  onTimeRangeChange,
}: FeedbackTrendChartProps) {
  const [timeRange, setTimeRange] = useState<string>(propTimeRange || '6months');

  // Fetch data from API if not provided
  const { data: apiData, isLoading } = useQuery<FeedbackTrendResponse>({
    queryKey: ['/api/dashboard/feedback-trend', timeRange, projectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (timeRange) params.append('range', timeRange);
      if (projectId) params.append('projectId', projectId);
      const url = `/api/dashboard/feedback-trend${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    enabled: !propData && showControls,
  });

  // Use provided data or API data
  const trendData = propData || apiData?.data || [];
  const statistics = apiData?.statistics;

  // Fetch projects for filter dropdown
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: showControls && !projectId,
  });

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    onTimeRangeChange?.(value);
  };

  // Calculate chart statistics
  const chartStats = useMemo(() => {
    if (trendData.length === 0) {
      return {
        avgScore: 0,
        maxScore: 0,
        minScore: 0,
        totalResponses: 0,
        trend: 'stable' as const,
      };
    }

    const scores = trendData.filter(d => d.count > 0).map(d => d.score);
    const totalResponses = trendData.reduce((sum, d) => sum + d.count, 0);
    const avgScore = scores.length > 0 
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
      : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (scores.length >= 4) {
      const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
      const secondHalf = scores.slice(Math.floor(scores.length / 2));
      const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
      const change = secondAvg - firstAvg;
      
      if (change > 0.1) trend = 'up';
      else if (change < -0.1) trend = 'down';
    }

    return {
      avgScore: Math.round(avgScore * 10) / 10,
      maxScore: Math.round(maxScore * 10) / 10,
      minScore: Math.round(minScore * 10) / 10,
      totalResponses,
      trend: statistics?.trend || trend,
    };
  }, [trendData, statistics]);

  if (isLoading && !propData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feedback Trend</CardTitle>
          <CardDescription>Loading feedback data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (trendData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feedback Trend</CardTitle>
          <CardDescription>
            {projectTitle || "Consumer sentiment over time"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No feedback data available for the selected time period.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = chartStats.trend === 'up' 
    ? TrendingUp 
    : chartStats.trend === 'down' 
    ? TrendingDown 
    : Minus;

  const trendColor = chartStats.trend === 'up' 
    ? 'text-green-600' 
    : chartStats.trend === 'down' 
    ? 'text-red-600' 
    : 'text-muted-foreground';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Feedback Trend</CardTitle>
            <CardDescription>
              {projectTitle || "Consumer sentiment over time"}
            </CardDescription>
          </div>
          {showControls && (
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold">{chartStats.avgScore.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">out of 5.0</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Responses</p>
              <p className="text-2xl font-bold">{chartStats.totalResponses}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>responses</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Trend</p>
              <div className="flex items-center gap-2">
                <TrendIcon className={`h-5 w-5 ${trendColor}`} />
                <p className={`text-2xl font-bold ${trendColor}`}>
                  {chartStats.trend === 'up' ? 'Up' : chartStats.trend === 'down' ? 'Down' : 'Stable'}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Range</p>
              <p className="text-2xl font-bold">
                {chartStats.minScore.toFixed(1)} - {chartStats.maxScore.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">score range</p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="feedbackGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 5]}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as DataPoint;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-sm">
                          <p className="font-medium">{data.date}</p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">Score: </span>
                            <span className="font-semibold">{data.score.toFixed(1)}</span>
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">Responses: </span>
                            <span className="font-semibold">{data.count}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine 
                  y={chartStats.avgScore} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="3 3"
                  label={{ value: 'Average', position: 'right' }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#feedbackGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Response count indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>
              Showing {trendData.filter(d => d.count > 0).length} of {trendData.length} periods with data
            </p>
            {chartStats.totalResponses > 0 && (
              <Badge variant="secondary">
                {chartStats.totalResponses} total {chartStats.totalResponses === 1 ? 'response' : 'responses'}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
