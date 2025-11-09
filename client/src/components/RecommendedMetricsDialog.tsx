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
  name: string;
  value: string;
  category: string;
  reason?: string;
}

export interface CustomMetric {
  name: string;
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
  onSubmit: (selectedAIMetrics: RecommendedMetric[], selectedCustomMetrics: CustomMetric[]) => void;
}

const RECOMMENDED_METRICS_BY_CATEGORY: Record<string, RecommendedMetric[]> = {
  Packaging: [
    { name: "Recycled Material Usage", value: "% of total packaging", category: "Packaging", reason: "Track sustainable material adoption" },
    { name: "Packaging Weight Reduction", value: "grams per unit", category: "Packaging", reason: "Measure material efficiency" },
    { name: "Plastic Elimination", value: "kg/year", category: "Packaging", reason: "Monitor plastic reduction progress" },
  ],
  Energy: [
    { name: "Energy Consumption Reduction", value: "kWh/month", category: "Energy", reason: "Track energy efficiency gains" },
    { name: "Renewable Energy Usage", value: "% of total energy", category: "Energy", reason: "Measure clean energy transition" },
    { name: "Carbon Intensity", value: "kg CO₂/kWh", category: "Energy", reason: "Monitor carbon footprint" },
  ],
  Sourcing: [
    { name: "Local Supplier Percentage", value: "% of suppliers", category: "Sourcing", reason: "Track local sourcing adoption" },
    { name: "Sustainable Certification Rate", value: "% of products", category: "Sourcing", reason: "Measure certification compliance" },
    { name: "Transport Distance Reduction", value: "miles/shipment", category: "Sourcing", reason: "Monitor logistics efficiency" },
  ],
  Waste: [
    { name: "Waste Diversion Rate", value: "% diverted from landfill", category: "Waste", reason: "Track landfill reduction" },
    { name: "Recycling Rate", value: "% of total waste", category: "Waste", reason: "Measure recycling effectiveness" },
    { name: "Composting Volume", value: "tons/year", category: "Waste", reason: "Monitor organic waste management" },
  ],
  Water: [
    { name: "Water Consumption Reduction", value: "gallons/day", category: "Water", reason: "Track water efficiency" },
    { name: "Water Recycling Rate", value: "% of water reused", category: "Water", reason: "Measure water conservation" },
    { name: "Wastewater Treatment", value: "% treated", category: "Water", reason: "Monitor treatment effectiveness" },
  ],
  Logistics: [
    { name: "Fleet Fuel Efficiency", value: "mpg average", category: "Logistics", reason: "Track fuel consumption" },
    { name: "Electric Vehicle Percentage", value: "% of fleet", category: "Logistics", reason: "Measure EV adoption" },
    { name: "Last-Mile Emissions", value: "kg CO₂/delivery", category: "Logistics", reason: "Monitor delivery impact" },
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
}: RecommendedMetricsDialogProps) {
  // Use API-detected category if available, otherwise fall back to keyword-based
  const fallbackCategory = categorizeFromDescription(projectDescription);
  const detectedCategory = apiDetectedCategory || fallbackCategory;
  
  // Track selected category (can be overridden by user)
  const [selectedCategory, setSelectedCategory] = useState<string>(detectedCategory);
  const [isManuallySelected, setIsManuallySelected] = useState(false);
  
  // Show no AI metrics for "Other" category
  const recommendedMetrics = selectedCategory === "Other" ? [] : (RECOMMENDED_METRICS_BY_CATEGORY[selectedCategory] || []);
  
  // Use combined selection state with keys like "ai-0", "custom-0", etc.
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(new Set());

  // Reset selections when dialog opens with new project
  useEffect(() => {
    if (open) {
      // Reset to detected category when dialog opens
      setSelectedCategory(detectedCategory);
      setIsManuallySelected(false);
      
      // Pre-select all custom metrics by default
      const preselected = new Set(customMetrics.map((_, index) => `custom-${index}`));
      setSelectedMetrics(preselected);
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

  const handleSubmit = () => {
    const selectedAI = recommendedMetrics.filter((_, index) => selectedMetrics.has(`ai-${index}`));
    const selectedCustom = customMetrics.filter((_, index) => selectedMetrics.has(`custom-${index}`));
    onSubmit(selectedAI, selectedCustom);
  };

  const handleSkip = () => {
    onSubmit([], []);
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
                  {recommendedMetrics.map((metric, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border hover-elevate"
                      data-testid={`ai-metric-${index}`}
                    >
                      <Checkbox
                        checked={selectedMetrics.has(`ai-${index}`)}
                        onCheckedChange={() => toggleMetric(`ai-${index}`)}
                        data-testid={`checkbox-ai-${index}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{metric.name}</p>
                        <p className="text-sm text-muted-foreground">Unit: {metric.value}</p>
                        {metric.reason && (
                          <p className="text-xs text-muted-foreground mt-1">{metric.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
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
                          <p className="font-medium">{metric.name}</p>
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
                          <p className="font-medium">{metric.name}</p>
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
              onClick={() => onOpenChange(false)}
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
