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
import { Sparkles, TrendingUp, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface RecommendedMetric {
  name: string;
  value: string;
  category: string;
  reason?: string;
}

interface RecommendedMetricsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectDescription: string;
  onSubmit: (selectedMetrics: RecommendedMetric[]) => void;
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
  
  // Logistics-specific
  if (desc.includes("logistic") || desc.includes("transport") || desc.includes("deliver") || 
      desc.includes("fleet") || desc.includes("vehicle") || desc.includes("shipping")) {
    return "Logistics";
  }
  
  // Packaging (check last to avoid catching water recycling)
  if (desc.includes("packag") || desc.includes("box") || desc.includes("container") || 
      desc.includes("material recycl") || desc.includes("biodegradable")) {
    return "Packaging";
  }
  
  return "Packaging";
};

export function RecommendedMetricsDialog({
  open,
  onOpenChange,
  projectDescription,
  onSubmit,
}: RecommendedMetricsDialogProps) {
  const detectedCategory = categorizeFromDescription(projectDescription);
  const recommendedMetrics = RECOMMENDED_METRICS_BY_CATEGORY[detectedCategory] || [];
  
  const [selectedMetrics, setSelectedMetrics] = useState<Set<number>>(new Set());

  // Reset selections when dialog opens with new project
  useEffect(() => {
    if (open) {
      setSelectedMetrics(new Set());
    }
  }, [open]);

  const toggleMetric = (index: number) => {
    const newSelected = new Set(selectedMetrics);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedMetrics(newSelected);
  };

  const handleSubmit = () => {
    const selected = recommendedMetrics.filter((_, index) => selectedMetrics.has(index));
    onSubmit(selected);
  };

  const handleSkip = () => {
    onSubmit([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Recommended Metrics
          </DialogTitle>
          <DialogDescription>
            Based on your project description, we suggest tracking these key sustainability metrics. Select the ones that fit your goals.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <span className="font-semibold">Detected Category: {detectedCategory}</span>
              <p className="text-sm mt-1">
                These metrics are commonly used for {detectedCategory.toLowerCase()} projects to measure impact and progress.
              </p>
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Suggested Metrics</h3>
                <Badge variant="outline" className="ml-auto">
                  {recommendedMetrics.length} available
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
                      checked={selectedMetrics.has(index)}
                      onCheckedChange={() => toggleMetric(index)}
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

              {recommendedMetrics.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No recommendations available</p>
                  <p className="text-sm mt-1">You can add custom metrics in the next step</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription className="text-sm">
              Don't worry - you can always add, remove, or modify metrics later from the project details page.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {selectedMetrics.size} metric{selectedMetrics.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSkip}
                data-testid="button-skip-recommendations"
              >
                Skip for Now
              </Button>
              <Button
                onClick={handleSubmit}
                data-testid="button-accept-recommendations"
              >
                {selectedMetrics.size > 0 ? `Add ${selectedMetrics.size} Metric${selectedMetrics.size !== 1 ? 's' : ''}` : 'Continue'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
