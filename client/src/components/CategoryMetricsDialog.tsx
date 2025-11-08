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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Tag, TrendingUp } from "lucide-react";

export interface RecommendedMetric {
  name: string;
  value: string;
  category: string;
}

interface CategoryMetricsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedCategory: string;
  onSubmit: (category: string) => void;
}

const PROJECT_CATEGORIES = [
  "Packaging",
  "Energy",
  "Sourcing",
  "Waste",
  "Water",
  "Logistics",
];

const RECOMMENDED_METRICS_BY_CATEGORY: Record<string, RecommendedMetric[]> = {
  Packaging: [
    { name: "Recycled Material Usage", value: "% of total packaging", category: "Packaging" },
    { name: "Packaging Weight Reduction", value: "grams per unit", category: "Packaging" },
    { name: "Biodegradable Materials", value: "% of packaging", category: "Packaging" },
    { name: "Plastic Elimination", value: "kg/year", category: "Packaging" },
    { name: "Packaging Recyclability Rate", value: "%", category: "Packaging" },
  ],
  Energy: [
    { name: "Energy Consumption Reduction", value: "kWh/month", category: "Energy" },
    { name: "Renewable Energy Usage", value: "% of total energy", category: "Energy" },
    { name: "Solar Capacity", value: "kW installed", category: "Energy" },
    { name: "Energy Cost Savings", value: "$/year", category: "Energy" },
    { name: "Carbon Intensity", value: "kg CO₂/kWh", category: "Energy" },
  ],
  Sourcing: [
    { name: "Local Supplier Percentage", value: "% of suppliers", category: "Sourcing" },
    { name: "Sustainable Certification Rate", value: "% of products", category: "Sourcing" },
    { name: "Supply Chain Emissions", value: "tons CO₂/year", category: "Sourcing" },
    { name: "Fair Trade Products", value: "% of inventory", category: "Sourcing" },
    { name: "Transport Distance Reduction", value: "miles/shipment", category: "Sourcing" },
  ],
  Waste: [
    { name: "Waste Diversion Rate", value: "% diverted from landfill", category: "Waste" },
    { name: "Composting Volume", value: "tons/year", category: "Waste" },
    { name: "Recycling Rate", value: "% of total waste", category: "Waste" },
    { name: "Hazardous Waste Reduction", value: "kg/year", category: "Waste" },
    { name: "Zero Waste Achievement", value: "% toward goal", category: "Waste" },
  ],
  Water: [
    { name: "Water Consumption Reduction", value: "gallons/day", category: "Water" },
    { name: "Water Recycling Rate", value: "% of water reused", category: "Water" },
    { name: "Rainwater Harvesting", value: "gallons/year", category: "Water" },
    { name: "Wastewater Treatment", value: "% treated", category: "Water" },
    { name: "Water Efficiency Score", value: "gallons per unit produced", category: "Water" },
  ],
  Logistics: [
    { name: "Fleet Fuel Efficiency", value: "mpg average", category: "Logistics" },
    { name: "Electric Vehicle Percentage", value: "% of fleet", category: "Logistics" },
    { name: "Delivery Route Optimization", value: "% reduction in miles", category: "Logistics" },
    { name: "Last-Mile Emissions", value: "kg CO₂/delivery", category: "Logistics" },
    { name: "Packaging Fill Rate", value: "% of vehicle capacity", category: "Logistics" },
  ],
};

export function CategoryMetricsDialog({
  open,
  onOpenChange,
  suggestedCategory,
  onSubmit,
}: CategoryMetricsDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState(suggestedCategory);

  useEffect(() => {
    setSelectedCategory(suggestedCategory);
  }, [suggestedCategory]);

  const handleSubmit = () => {
    onSubmit(selectedCategory);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Finalize Project Category
          </DialogTitle>
          <DialogDescription>
            We've automatically categorized your project based on your description and selected metrics. You can change the category before finalizing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI-Suggested Category
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-select">
                  Our AI suggests: <Badge variant="default" className="ml-2">{suggestedCategory}</Badge>
                </Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category-select" data-testid="select-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Category determined by analyzing your project description and selected metrics
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-end w-full gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-category"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              data-testid="button-finalize-project"
            >
              Finalize & Create Project
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
