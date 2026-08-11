import { useState, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  BarChart3,
  Sparkles,
  Loader2,
  Download,
  AlertCircle,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProjectMetric } from "@shared/schema";

interface MetricOption {
  id: string;
  name: string;
  currentValue: number;
  unit: string;
  color: string;
}

interface ForecastDataPoint {
  period: string;
  value: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

interface ForecastResult {
  metricId: string;
  metricName: string;
  unit: string;
  currentValue: number;
  forecast: ForecastDataPoint[];
  growthRate: number;
  projectedValue: number;
  scenario: 'optimistic' | 'realistic' | 'pessimistic';
}

// Color palette for metrics
const metricColors = [
  "#10b981", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#ef4444", // red
  "#14b8a6", // teal
];

export default function Forecast() {
  const [, params] = useRoute("/project/:id/forecast");
  const projectId = params?.id || "1";
  const { toast } = useToast();

  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(new Set());
  const [targetYear, setTargetYear] = useState<string>("2030");
  const [scenario, setScenario] = useState<'optimistic' | 'realistic' | 'pessimistic'>('realistic');
  const [forecastResults, setForecastResults] = useState<ForecastResult[]>([]);

  // Fetch project metrics from API
  const { data: projectMetrics = [], isLoading: isLoadingMetrics } = useQuery<ProjectMetric[]>({
    queryKey: [`/api/projects/${projectId}/metrics`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!projectId,
  });

  // Convert project metrics to MetricOption format
  const availableMetrics: MetricOption[] = useMemo(() => {
    return projectMetrics.map((metric, index) => {
      // Extract numeric value from metric.value
      const numericMatch = metric.value.match(/[\d.]+/);
      const currentValue = numericMatch ? parseFloat(numericMatch[0]) : 0;
      
      // Get unit from metric.unit or extract from value
      let unit = metric.unit || "";
      if (!unit && metric.value) {
        // Try to extract unit from value string
        const unitMatch = metric.value.match(/[a-zA-Z%]+/);
        if (unitMatch) {
          unit = unitMatch[0];
        }
      }
      if (!unit) unit = "";

      return {
        id: metric.id,
        name: metric.metricName,
        currentValue,
        unit,
        color: metricColors[index % metricColors.length],
      };
    });
  }, [projectMetrics]);

  const yearOptions = ["2026", "2027", "2028", "2029", "2030", "2035", "2040", "2050"];

  const toggleMetric = (metricId: string) => {
    const newSelected = new Set(selectedMetrics);
    if (newSelected.has(metricId)) {
      newSelected.delete(metricId);
    } else {
      newSelected.add(metricId);
    }
    setSelectedMetrics(newSelected);
  };

  // Generate forecast using backend API
  const generateForecastMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        'POST',
        `/api/projects/${projectId}/forecast`,
        {
          metricIds: Array.from(selectedMetrics),
          targetYear: parseInt(targetYear),
          scenario,
        }
      );
      return await response.json();
    },
    onSuccess: (data) => {
      setForecastResults(data.forecasts || []);
      toast({
        title: "Forecast Generated",
        description: `Successfully generated ${data.forecasts?.length || 0} forecast(s)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Forecast Generation Failed",
        description: error.message || "Failed to generate forecast",
        variant: "destructive",
      });
    },
  });

  const generateForecast = () => {
    if (selectedMetrics.size === 0) {
      toast({
        title: "No Metrics Selected",
        description: "Please select at least one metric to forecast",
        variant: "destructive",
      });
      return;
    }
    generateForecastMutation.mutate();
  };

  const resetForecast = () => {
    setForecastResults([]);
  };

  // Export forecast data to CSV
  const exportToCSV = () => {
    if (forecastResults.length === 0) return;

    const headers = ['Period', ...forecastResults.map(f => `${f.metricName} (${f.unit})`)];
    const rows: string[][] = [headers];

    // Get all unique periods
    const allPeriods = new Set<string>();
    forecastResults.forEach(result => {
      result.forecast.forEach(point => allPeriods.add(point.period));
    });
    const sortedPeriods = Array.from(allPeriods).sort();

    // Build rows
    sortedPeriods.forEach(period => {
      const row = [period];
      forecastResults.forEach(result => {
        const point = result.forecast.find(p => p.period === period);
        row.push(point ? point.value.toString() : '');
      });
      rows.push(row);
    });

    // Convert to CSV
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast-${projectId}-${scenario}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Forecast data exported to CSV",
    });
  };

  // Export forecast data to JSON
  const exportToJSON = () => {
    if (forecastResults.length === 0) return;

    const data = {
      projectId,
      scenario,
      targetYear: parseInt(targetYear),
      generatedAt: new Date().toISOString(),
      forecasts: forecastResults,
    };

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast-${projectId}-${scenario}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Forecast data exported to JSON",
    });
  };

  const selectedMetricsArray = availableMetrics.filter(m => selectedMetrics.has(m.id));

  // Loading state
  if (isLoadingMetrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading project metrics...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (availableMetrics.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center gap-4">
          <Link href={`/project/${projectId}`}>
            <Button variant="ghost" size="icon" data-testid="button-back-to-project">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-4xl font-bold">Project Forecast</h1>
            <p className="text-muted-foreground mt-1">
              Generate time series forecasts for your sustainability metrics
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              No metrics available for this project. Add metrics to generate forecasts.
            </p>
            <Link href={`/project/${projectId}`}>
              <Button variant="outline">Back to Project</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center gap-4">
        <Link href={`/project/${projectId}`}>
          <Button variant="ghost" size="icon" data-testid="button-back-to-project">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-4xl font-bold">Project Forecast</h1>
          <p className="text-muted-foreground mt-1">
            Generate time series forecasts for your sustainability metrics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Select Metrics
            </CardTitle>
            <CardDescription>
              Choose which metrics you want to forecast
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {availableMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  data-testid={`metric-option-${metric.id}`}
                >
                  <Checkbox
                    checked={selectedMetrics.has(metric.id)}
                    onCheckedChange={() => toggleMetric(metric.id)}
                    data-testid={`checkbox-metric-${metric.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: metric.color }}
                      />
                      <p className="font-medium text-sm">{metric.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {metric.currentValue} {metric.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Forecast Configuration
                </CardTitle>
                <CardDescription className="mt-1">
                  Configure forecast parameters and scenario
                </CardDescription>
              </div>
              <Badge variant="outline">
                {selectedMetrics.size} metric{selectedMetrics.size !== 1 ? 's' : ''} selected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="target-year">Target Year</Label>
              <Select value={targetYear} onValueChange={setTargetYear}>
                <SelectTrigger id="target-year" data-testid="select-target-year">
                  <SelectValue placeholder="Select target year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Forecast will project from {new Date().getFullYear()} to {targetYear}
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Forecast Scenario</Label>
              <RadioGroup value={scenario} onValueChange={(value) => setScenario(value as typeof scenario)}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border">
                  <RadioGroupItem value="optimistic" id="scenario-optimistic" />
                  <Label htmlFor="scenario-optimistic" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">Optimistic</p>
                        <p className="text-xs text-muted-foreground">Higher growth expectations</p>
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border">
                  <RadioGroupItem value="realistic" id="scenario-realistic" />
                  <Label htmlFor="scenario-realistic" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">Realistic</p>
                        <p className="text-xs text-muted-foreground">Most likely outcome</p>
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border">
                  <RadioGroupItem value="pessimistic" id="scenario-pessimistic" />
                  <Label htmlFor="scenario-pessimistic" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-amber-600" />
                      <div>
                        <p className="font-medium">Pessimistic</p>
                        <p className="text-xs text-muted-foreground">Conservative estimates</p>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                onClick={generateForecast}
                disabled={selectedMetrics.size === 0 || generateForecastMutation.isPending}
                data-testid="button-generate-forecast"
              >
                {generateForecastMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Forecast
                  </>
                )}
              </Button>
              {forecastResults.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={resetForecast}
                    data-testid="button-reset-forecast"
                  >
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportToCSV}
                    data-testid="button-export-csv"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportToJSON}
                    data-testid="button-export-json"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                </>
              )}
            </div>

            {selectedMetrics.size === 0 && (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select at least one metric to generate a forecast</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {forecastResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Forecast Results ({scenario.charAt(0).toUpperCase() + scenario.slice(1)} Scenario)
                </CardTitle>
                <CardDescription className="mt-1">
                  Projected values from {new Date().getFullYear()} to {targetYear} with confidence intervals
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="charts" className="space-y-6">
              <TabsList>
                <TabsTrigger value="charts">Charts</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>

              <TabsContent value="charts" className="space-y-8">
                {forecastResults.map((result) => {
                  const metric = availableMetrics.find(m => m.id === result.metricId);
                  const chartData = result.forecast.map(point => ({
                    period: point.period,
                    value: point.value,
                    lowerBound: point.lowerBound,
                    upperBound: point.upperBound,
                  }));

                  return (
                    <div key={result.metricId} className="space-y-3" data-testid={`forecast-chart-${result.metricId}`}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: metric?.color || '#666' }}
                        />
                        <h3 className="font-semibold">{result.metricName}</h3>
                        <Badge variant="secondary" className="ml-auto">
                          {result.unit}
                        </Badge>
                      </div>
                      
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id={`gradient-${result.metricId}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={metric?.color || '#666'} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={metric?.color || '#666'} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="period"
                            tick={{ fontSize: 12 }}
                            interval="preserveStartEnd"
                            className="text-muted-foreground"
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            className="text-muted-foreground"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="upperBound"
                            stroke="none"
                            fill={metric?.color || '#666'}
                            fillOpacity={0.1}
                          />
                          <Area
                            type="monotone"
                            dataKey="lowerBound"
                            stroke="none"
                            fill={metric?.color || '#666'}
                            fillOpacity={0.1}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={metric?.color || '#666'}
                            strokeWidth={2}
                            fill={`url(#gradient-${result.metricId})`}
                          />
                        </AreaChart>
                      </ResponsiveContainer>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-3 rounded-lg bg-muted">
                          <p className="text-muted-foreground mb-1">Current Value</p>
                          <p className="font-bold font-mono">
                            {result.currentValue.toFixed(2)} {result.unit}
                          </p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted">
                          <p className="text-muted-foreground mb-1">Projected ({targetYear})</p>
                          <p className="font-bold font-mono" style={{ color: metric?.color }}>
                            {result.projectedValue.toFixed(2)} {result.unit}
                          </p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted">
                          <p className="text-muted-foreground mb-1">Growth Rate</p>
                          <p className="font-bold font-mono text-primary">
                            {result.growthRate > 0 ? '+' : ''}{result.growthRate.toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted">
                          <p className="text-muted-foreground mb-1">Confidence</p>
                          <p className="font-bold font-mono">
                            {result.forecast[0]?.confidence.toFixed(0) || 85}%
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="summary">
                <div className="space-y-4">
                  {forecastResults.map((result) => {
                    const metric = availableMetrics.find(m => m.id === result.metricId);
                    return (
                      <Card key={result.metricId}>
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: metric?.color || '#666' }}
                            />
                            <CardTitle className="text-lg">{result.metricName}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Current</p>
                              <p className="text-2xl font-bold">{result.currentValue.toFixed(2)} {result.unit}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Projected</p>
                              <p className="text-2xl font-bold" style={{ color: metric?.color }}>
                                {result.projectedValue.toFixed(2)} {result.unit}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Growth</p>
                              <p className="text-2xl font-bold text-primary">
                                {result.growthRate > 0 ? '+' : ''}{result.growthRate.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Data Points</p>
                              <p className="text-2xl font-bold">{result.forecast.length}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
