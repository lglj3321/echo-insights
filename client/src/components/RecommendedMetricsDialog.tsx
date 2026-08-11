import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Sparkles, TrendingUp, Info, User, FileText, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface RecommendedMetric {
  metricName: string;
  value: string; // This is actually the unit description
  defaultValue: string; // Default numeric value for the metric
  unit: string; // Unit abbreviation (e.g., "%", "kg", "kWh")
  category: string;
  reason?: string;
}

export interface CustomMetric {
  metricName: string;
  value: string;
  source: "user" | "file";
}

interface RecommendedMetricsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectDescription: string;
  customMetrics?: CustomMetric[];
  apiDetectedCategory?: string | null;
  classificationConfidence?: number;
  onSubmit: (selectedAIMetrics: RecommendedMetric[], selectedCustomMetrics: CustomMetric[], customCategoryName?: string) => void;
  onGoBack?: () => void;
}

const RECOMMENDED_METRICS_BY_CATEGORY: Record<string, RecommendedMetric[]> = {
  Packaging: [
    { metricName: "Recycled Material Usage", value: "% of total packaging", defaultValue: "75", unit: "%", category: "Packaging", reason: "Track sustainable material adoption" },
    { metricName: "Packaging Weight Reduction", value: "grams per unit", defaultValue: "5000", unit: "kg", category: "Packaging", reason: "Measure material efficiency" },
    { metricName: "Plastic Elimination", value: "kg/year", defaultValue: "2000", unit: "kg/year", category: "Packaging", reason: "Monitor plastic reduction progress" },
  ],
  Energy: [
    { metricName: "Energy Consumption Reduction", value: "kWh/month", defaultValue: "50000", unit: "kWh/year", category: "Energy", reason: "Track energy efficiency gains" },
    { metricName: "Renewable Energy Usage", value: "% of total energy", defaultValue: "60", unit: "%", category: "Energy", reason: "Measure clean energy transition" },
    { metricName: "CO2 Reduction", value: "tons/year", defaultValue: "25", unit: "tons", category: "Energy", reason: "Monitor carbon footprint reduction" },
  ],
  Sourcing: [
    { metricName: "Local Supplier Percentage", value: "% of suppliers", defaultValue: "70", unit: "%", category: "Sourcing", reason: "Track local sourcing adoption" },
    { metricName: "Sustainable Certification Rate", value: "% of products", defaultValue: "80", unit: "%", category: "Sourcing", reason: "Measure certification compliance" },
    { metricName: "Transportation Distance Reduction", value: "miles/shipment", defaultValue: "30", unit: "%", category: "Sourcing", reason: "Monitor logistics efficiency" },
  ],
  Waste: [
    { metricName: "Waste Diversion Rate", value: "% diverted from landfill", defaultValue: "85", unit: "%", category: "Waste", reason: "Track landfill reduction" },
    { metricName: "Recycling Rate", value: "% of total waste", defaultValue: "70", unit: "%", category: "Waste", reason: "Measure recycling effectiveness" },
    { metricName: "Waste Reduction", value: "tons/year", defaultValue: "5000", unit: "kg", category: "Waste", reason: "Monitor organic waste management" },
  ],
  Water: [
    { metricName: "Water Saved", value: "liters/day", defaultValue: "50000", unit: "liters", category: "Water", reason: "Track water efficiency" },
    { metricName: "Water Recycling Rate", value: "% of water reused", defaultValue: "80", unit: "%", category: "Water", reason: "Measure water conservation" },
    { metricName: "Water Consumption Reduction", value: "% reduction", defaultValue: "40", unit: "%", category: "Water", reason: "Monitor treatment effectiveness" },
  ],
  Logistics: [
    { metricName: "Fleet Fuel Efficiency", value: "mpg average", defaultValue: "25", unit: "mpg", category: "Logistics", reason: "Track fuel consumption" },
    { metricName: "Electric Vehicle Percentage", value: "% of fleet", defaultValue: "50", unit: "%", category: "Logistics", reason: "Measure EV adoption" },
    { metricName: "CO2 Reduction", value: "kg CO₂/delivery", defaultValue: "15", unit: "tons", category: "Logistics", reason: "Monitor delivery impact" },
  ],
};

const categorizeFromDescription = (description: string): string => {
  const desc = description.toLowerCase();
  
  // Check for more specific keywords first to avoid misclassification
  // Water-specific before generic recycling
  if (desc.includes("water conservation") || desc.includes("water recycl") || desc.includes("wastewater") || 
      (desc.includes("water") && !desc.includes("packaging"))) {
    return "Water";
  }
  
  // Waste-specific before generic recycling
  if (desc.includes("waste") || desc.includes("landfill") || desc.includes("compost") || 
      desc.includes("zero waste") || desc.includes("waste recycl")) {
    return "Waste";
  }
  
  // Energy-specific
  if (desc.includes("energy") || desc.includes("solar") || desc.includes("power") || 
      desc.includes("electric") || desc.includes("renewable") || desc.includes("kwh")) {
    return "Energy";
  }
  
  // Sourcing-specific
  if (desc.includes("sourc") || desc.includes("supplier") || desc.includes("local") || 
      desc.includes("ingredient") || desc.includes("supply chain")) {
    return "Sourcing";
  }
  
  // Packaging (check last to avoid catching water recycling)
  if (desc.includes("packag") || desc.includes("box") || desc.includes("container") || 
      desc.includes("material recycl") || desc.includes("biodegradable")) {
    return "Packaging";
  }
  
  return "Packaging";
};

const CATEGORY_OPTIONS = ["Packaging", "Energy", "Sourcing", "Waste", "Water", "Other"];

export function RecommendedMetricsDialog({
  open,
  onOpenChange,
  projectDescription,
  customMetrics = [],
  apiDetectedCategory,
  classificationConfidence = 0,
  onSubmit,
  onGoBack,
}: RecommendedMetricsDialogProps) {
  // Use API-detected category if available, otherwise fall back to keyword-based
  const fallbackCategory = categorizeFromDescription(projectDescription);
  const detectedCategory = apiDetectedCategory || fallbackCategory;
  
  // Track selected category (can be overridden by user)
  const [selectedCategory, setSelectedCategory] = useState<string>(detectedCategory);
  const [isManuallySelected, setIsManuallySelected] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState<string>("");
  
  // Show no AI metrics for "Other" category
  const recommendedMetrics = selectedCategory === "Other" ? [] : (RECOMMENDED_METRICS_BY_CATEGORY[selectedCategory] || []);
  
  // Use combined selection state with keys like "ai-0", "custom-0", etc.
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(new Set());
  
  // Store custom values for AI metrics (key: "ai-0", value: user-edited value)
  const [aiMetricValues, setAiMetricValues] = useState<Record<string, string>>({});

  // Reset selections when dialog opens with new project
  useEffect(() => {
    if (open) {
      // Reset to detected category when dialog opens
      setSelectedCategory(detectedCategory);
      setIsManuallySelected(false);
      setCustomCategoryName("");
      
      // Pre-select all custom metrics by default
      const preselected = new Set(customMetrics.map((_, index) => `custom-${index}`));
      setSelectedMetrics(preselected);
      
      // Reset AI metric values
      setAiMetricValues({});
    }
  }, [open, customMetrics, detectedCategory]);

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    setIsManuallySelected(true);
    // Clear AI metric selections when category changes (custom metrics remain selected)
    const newSelected = new Set(
      Array.from(selectedMetrics).filter(key => key.startsWith('custom-'))
    );
    setSelectedMetrics(newSelected);
    // Clear AI metric values when category changes
    setAiMetricValues({});
  };

  const toggleMetric = (key: string) => {
    const newSelected = new Set(selectedMetrics);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedMetrics(newSelected);
  };

  const updateAiMetricValue = (index: number, value: string) => {
    const key = `ai-${index}`;
    setAiMetricValues(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const getAiMetricValue = (index: number): string => {
    const key = `ai-${index}`;
    return aiMetricValues[key] || recommendedMetrics[index]?.defaultValue || "";
  };

  const handleSubmit = () => {
    // Map selected AI metrics with user-edited values or defaults
    const selectedAI = recommendedMetrics
      .map((metric, index) => {
        if (!selectedMetrics.has(`ai-${index}`)) return null;
        const userValue = aiMetricValues[`ai-${index}`];
        return {
          ...metric,
          defaultValue: userValue || metric.defaultValue, // Use user value if provided, otherwise default
        };
      })
      .filter((m): m is RecommendedMetric => m !== null);
    
    const selectedCustom = customMetrics.filter((_, index) => selectedMetrics.has(`custom-${index}`));
    const categoryName = selectedCategory === "Other" && customCategoryName.trim() ? customCategoryName.trim() : undefined;
    onSubmit(selectedAI, selectedCustom, categoryName);
  };

  const handleSkip = () => {
    onSubmit([], [], undefined);
  };

  const userMetrics = customMetrics.filter(m => m.source === "user");
  const fileMetrics = customMetrics.filter(m => m.source === "file");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Select Project Metrics
          </DialogTitle>
          <DialogDescription>
            Review AI-recommended metrics and your custom entries. Select the ones you want to track for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Selection Section */}
          <div className="space-y-3">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span className="font-semibold">
                      {isManuallySelected ? "Selected" : "AI-Detected"} Category: {selectedCategory}
                    </span>
                    {!isManuallySelected && (
                      <p className="text-sm mt-1">
                        Based on your project description, we detected this as a {selectedCategory.toLowerCase()} project.
                      </p>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium whitespace-nowrap">
                Project Category:
              </label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full" data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((category) => (
                    <SelectItem key={category} value={category} data-testid={`category-${category.toLowerCase()}`}>
                      {category}
                      {category === detectedCategory && (
                        <span className="text-xs text-muted-foreground ml-2">(AI detected)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Category Name Input for "Other" */}
            {selectedCategory === "Other" && (
              <div className="space-y-2 mt-3">
                <label htmlFor="custom-category" className="text-sm font-medium">
                  Category Name (Optional)
                </label>
                <Input
                  id="custom-category"
                  placeholder="e.g., Transportation, Animal Welfare, Community Engagement"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  data-testid="input-custom-category"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a custom name for this project category. This will be stored and used to identify similar projects.
                </p>
              </div>
            )}
          </div>

          {/* AI-Recommended Metrics Section */}
          {recommendedMetrics.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">AI-Recommended Metrics</h3>
                  <Badge variant="outline" className="ml-auto">
                    {recommendedMetrics.length} suggested
                  </Badge>
                </div>
                <div className="space-y-2">
                  {recommendedMetrics.map((metric, index) => {
                    const isSelected = selectedMetrics.has(`ai-${index}`);
                    const currentValue = getAiMetricValue(index);
                    return (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${isSelected ? 'border-primary/50 bg-primary/5' : 'hover-elevate'}`}
                        data-testid={`ai-metric-${index}`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleMetric(`ai-${index}`)}
                          data-testid={`checkbox-ai-${index}`}
                        />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <p className="font-medium">{metric.metricName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Unit: {metric.value}</p>
                            {metric.reason && (
                              <p className="text-xs text-muted-foreground mt-1">{metric.reason}</p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-2 mt-2">
                              <label className="text-sm font-medium whitespace-nowrap">
                                Value:
                              </label>
                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  type="text"
                                  value={currentValue}
                                  onChange={(e) => updateAiMetricValue(index, e.target.value)}
                                  placeholder={metric.defaultValue}
                                  className="h-8 flex-1"
                                  data-testid={`input-ai-metric-value-${index}`}
                                />
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                  {metric.unit}
                                </span>
                              </div>
                              {currentValue !== metric.defaultValue && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => updateAiMetricValue(index, metric.defaultValue)}
                                  data-testid={`button-reset-ai-metric-${index}`}
                                >
                                  Reset
                                </Button>
                              )}
                            </div>
                          )}
                          {!isSelected && (
                            <p className="text-sm text-muted-foreground">
                              Default: <span className="font-semibold">{metric.defaultValue} {metric.unit}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* User-Entered Metrics Section */}
          {userMetrics.length > 0 && (
            <>
              {recommendedMetrics.length > 0 && <Separator />}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Your Custom Metrics</h3>
                  <Badge variant="outline" className="ml-auto">
                    {userMetrics.length} entered
                  </Badge>
                </div>
                <div className="space-y-2">
                  {customMetrics.map((metric, index) => {
                    if (metric.source !== "user") return null;
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg border hover-elevate"
                        data-testid={`user-metric-${index}`}
                      >
                        <Checkbox
                          checked={selectedMetrics.has(`custom-${index}`)}
                          onCheckedChange={() => toggleMetric(`custom-${index}`)}
                          data-testid={`checkbox-custom-${index}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{metric.metricName}</p>
                          <p className="text-sm text-muted-foreground">{metric.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* File-Extracted Metrics Section */}
          {fileMetrics.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Extracted from File</h3>
                  <Badge variant="outline" className="ml-auto">
                    {fileMetrics.length} detected
                  </Badge>
                </div>
                <div className="space-y-2">
                  {customMetrics.map((metric, index) => {
                    if (metric.source !== "file") return null;
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg border hover-elevate"
                        data-testid={`file-metric-${index}`}
                      >
                        <Checkbox
                          checked={selectedMetrics.has(`custom-${index}`)}
                          onCheckedChange={() => toggleMetric(`custom-${index}`)}
                          data-testid={`checkbox-custom-${index}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{metric.metricName}</p>
                          <p className="text-sm text-muted-foreground">{metric.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <Alert>
            <AlertDescription className="text-sm">
              Don't worry - you can always add, remove, or modify metrics later from the project details page.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full gap-2 flex-wrap">
            <Button
              variant="ghost"
              onClick={() => onGoBack ? onGoBack() : onOpenChange(false)}
              data-testid="button-go-back"
            >
              Go Back
            </Button>
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {selectedMetrics.size} metric{selectedMetrics.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  data-testid="button-skip-metrics"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleSubmit}
                  data-testid="button-confirm-metrics"
                >
                  {selectedMetrics.size > 0 ? `Confirm ${selectedMetrics.size} Metric${selectedMetrics.size !== 1 ? 's' : ''}` : 'Continue'}
                </Button>
              </div>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
