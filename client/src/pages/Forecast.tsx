import { useState, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  BarChart3,
  Sparkles,
  Loader2,
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
import { getQueryFn } from "@/lib/queryClient";
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
  [key: string]: number | string;
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

  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(new Set());
  const [targetYear, setTargetYear] = useState<string>("2030");
  const [forecastGenerated, setForecastGenerated] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastDataPoint[]>([]);

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

  const generateForecast = () => {
    const currentYear = new Date().getFullYear();
    const targetYearNum = parseInt(targetYear);
    const quarters = (targetYearNum - currentYear) * 4;

    const data: ForecastDataPoint[] = [];

    // Generate forecast for each quarter
    for (let i = 0; i <= quarters; i++) {
      const year = currentYear + Math.floor(i / 4);
      const quarter = (i % 4) + 1;
      const period = `Q${quarter} ${year}`;

      const dataPoint: ForecastDataPoint = { period };

      selectedMetrics.forEach(metricId => {
        const metric = availableMetrics.find(m => m.id === metricId);
        if (metric && metric.currentValue > 0) {
          // Determine growth rate based on metric type
          let baseGrowthRate = 1.05; // Default 5% growth per quarter
          
          const metricName = metric.name.toLowerCase();
          
          // Different growth rates for different metric types
          if (metricName.includes("co2") || metricName.includes("carbon") || metricName.includes("emission")) {
            // Emissions reduction - positive growth means more reduction
            baseGrowthRate = 1.08; // 8% improvement per quarter
          } else if (metricName.includes("recycl") || metricName.includes("usage") || metricName.includes("%")) {
            // Percentage metrics - slower growth, capped at 100%
            baseGrowthRate = 1.03; // 3% growth per quarter
          } else if (metricName.includes("cost") || metricName.includes("saving")) {
            // Cost savings - moderate growth
            baseGrowthRate = 1.06; // 6% growth per quarter
          } else if (metricName.includes("water") || metricName.includes("energy")) {
            // Resource metrics - steady growth
            baseGrowthRate = 1.05; // 5% growth per quarter
          }
          
          // Add some randomness for realism (volatility)
          const volatility = 1 + (Math.random() * 0.1 - 0.05); // ±5% volatility
          
          // Add seasonality (slight variation by quarter)
          const seasonality = 1 + Math.sin(i * Math.PI / 2) * 0.05; // ±5% seasonality
          
          // Calculate projected value
          const baseGrowth = Math.pow(baseGrowthRate, i / 4);
          let projectedValue = metric.currentValue * baseGrowth * volatility * seasonality;
          
          // Cap percentage metrics at 100%
          if (metric.unit.includes("%") || metricName.includes("%")) {
            projectedValue = Math.min(projectedValue, 100);
          }
          
          // Ensure non-negative values
          projectedValue = Math.max(0, projectedValue);
          
          // Store values
          dataPoint[metric.name] = parseFloat(projectedValue.toFixed(2));
          dataPoint[`${metric.name}_lower`] = parseFloat((projectedValue * 0.85).toFixed(2));
          dataPoint[`${metric.name}_upper`] = parseFloat((projectedValue * 1.15).toFixed(2));
        }
      });

      data.push(dataPoint);
    }

    setForecastData(data);
    setForecastGenerated(true);
  };

  const resetForecast = () => {
    setForecastGenerated(false);
    setForecastData([]);
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
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose which metrics you want to forecast
            </p>
            <div className="space-y-3">
              {availableMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover-elevate"
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
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Forecast Configuration
              </CardTitle>
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

            <div className="flex gap-2">
              <Button
                onClick={generateForecast}
                disabled={selectedMetrics.size === 0}
                data-testid="button-generate-forecast"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Forecast
              </Button>
              {forecastGenerated && (
                <Button
                  variant="outline"
                  onClick={resetForecast}
                  data-testid="button-reset-forecast"
                >
                  Reset
                </Button>
              )}
            </div>

            {selectedMetrics.size === 0 && (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select at least one metric to generate a forecast</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {forecastGenerated && forecastData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Forecast Results
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Projected values from {new Date().getFullYear()} to {targetYear} with confidence intervals
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {selectedMetricsArray.map((metric) => (
                <div key={metric.id} className="space-y-3" data-testid={`forecast-chart-${metric.id}`}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                    <h3 className="font-semibold">{metric.name}</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {metric.unit}
                    </Badge>
                  </div>
                  
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={forecastData}>
                      <defs>
                        <linearGradient id={`gradient-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={metric.color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
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
                        dataKey={`${metric.name}_upper`}
                        stroke="none"
                        fill={metric.color}
                        fillOpacity={0.1}
                      />
                      <Area
                        type="monotone"
                        dataKey={`${metric.name}_lower`}
                        stroke="none"
                        fill={metric.color}
                        fillOpacity={0.1}
                      />
                      <Line
                        type="monotone"
                        dataKey={metric.name}
                        stroke={metric.color}
                        strokeWidth={2}
                        dot={{ fill: metric.color, r: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <p className="text-muted-foreground mb-1">Current Value</p>
                      <p className="font-bold font-mono">
                        {metric.currentValue} {metric.unit}
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <p className="text-muted-foreground mb-1">Projected ({targetYear})</p>
                      <p className="font-bold font-mono" style={{ color: metric.color }}>
                        {(() => {
                          const value = forecastData[forecastData.length - 1][metric.name];
                          if (typeof value === 'number') {
                            return value.toFixed(2);
                          }
                          return String(value);
                        })()} {metric.unit}
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <p className="text-muted-foreground mb-1">Growth Rate</p>
                      <p className="font-bold font-mono text-primary">
                        {metric.currentValue > 0 
                          ? (((Number(forecastData[forecastData.length - 1][metric.name]) / metric.currentValue - 1) * 100)).toFixed(1)
                          : "0.0"}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
