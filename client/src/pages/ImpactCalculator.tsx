import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calculator, Leaf, Droplet, Zap, TrendingUp, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ImpactCalculator() {
  const [materialWeight, setMaterialWeight] = useState("1000");
  const [recycledPercent, setRecycledPercent] = useState("50");
  const [energyUsage, setEnergyUsage] = useState("5000");
  const [renewablePercent, setRenewablePercent] = useState("30");
  const [waterUsage, setWaterUsage] = useState("10000");

  // Simple calculation formulas (these would be more sophisticated in production)
  const calculateCO2Savings = () => {
    const weight = parseFloat(materialWeight) || 0;
    const recycled = parseFloat(recycledPercent) || 0;
    return ((weight * recycled) / 100) * 0.5; // Simplified formula
  };

  const calculateEnergySavings = () => {
    const energy = parseFloat(energyUsage) || 0;
    const renewable = parseFloat(renewablePercent) || 0;
    return ((energy * renewable) / 100) * 0.3; // Simplified formula
  };

  const calculateWaterSavings = () => {
    const water = parseFloat(waterUsage) || 0;
    return water * 0.2; // Simplified 20% reduction formula
  };

  const calculateROI = () => {
    const totalSavings = calculateCO2Savings() * 50 + calculateEnergySavings() * 0.12 + calculateWaterSavings() * 0.002;
    const estimatedCost = parseFloat(materialWeight) || 1000;
    return ((totalSavings / estimatedCost) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Impact Calculator</h1>
        <p className="text-muted-foreground mt-1">
          Estimate project impact and ROI before implementation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Input Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="materials" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="materials">Materials</TabsTrigger>
                  <TabsTrigger value="energy">Energy</TabsTrigger>
                  <TabsTrigger value="water">Water</TabsTrigger>
                </TabsList>
                <TabsContent value="materials" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Total Material Weight (kg/year)</Label>
                    <Input
                      type="number"
                      value={materialWeight}
                      onChange={(e) => setMaterialWeight(e.target.value)}
                      data-testid="input-material-weight"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Recycled Content (%)</Label>
                    <Input
                      type="number"
                      value={recycledPercent}
                      onChange={(e) => setRecycledPercent(e.target.value)}
                      min="0"
                      max="100"
                      data-testid="input-recycled-percent"
                    />
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Recycled Materials</span>
                      <span className="font-semibold font-mono">
                        {((parseFloat(materialWeight) * parseFloat(recycledPercent)) / 100).toFixed(0)} kg
                      </span>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="energy" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Annual Energy Usage (kWh)</Label>
                    <Input
                      type="number"
                      value={energyUsage}
                      onChange={(e) => setEnergyUsage(e.target.value)}
                      data-testid="input-energy-usage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Renewable Energy (%)</Label>
                    <Input
                      type="number"
                      value={renewablePercent}
                      onChange={(e) => setRenewablePercent(e.target.value)}
                      min="0"
                      max="100"
                      data-testid="input-renewable-percent"
                    />
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Renewable Energy</span>
                      <span className="font-semibold font-mono">
                        {((parseFloat(energyUsage) * parseFloat(renewablePercent)) / 100).toFixed(0)} kWh
                      </span>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="water" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Annual Water Usage (gallons)</Label>
                    <Input
                      type="number"
                      value={waterUsage}
                      onChange={(e) => setWaterUsage(e.target.value)}
                      data-testid="input-water-usage"
                    />
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Estimated Savings (20%)</span>
                      <span className="font-semibold font-mono">
                        {(parseFloat(waterUsage) * 0.2).toLocaleString()} gallons
                      </span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scenario Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-save-scenario">
                  <Save className="h-4 w-4 mr-2" />
                  Save Current Scenario
                </Button>
                <Separator />
                <div className="text-sm text-muted-foreground">
                  No saved scenarios yet. Save your calculations to compare different approaches.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estimated Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-primary/5 rounded-lg space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Leaf className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CO₂ Reduction</p>
                    <p className="text-3xl font-bold font-mono">{calculateCO2Savings().toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">tons/year</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-chart-2/5 rounded-lg space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-chart-2/10 rounded-lg">
                    <Zap className="h-6 w-6 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Energy Saved</p>
                    <p className="text-3xl font-bold font-mono">{calculateEnergySavings().toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground">kWh/year</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-chart-5/5 rounded-lg space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-chart-5/10 rounded-lg">
                    <Droplet className="h-6 w-6 text-chart-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Water Saved</p>
                    <p className="text-3xl font-bold font-mono">{calculateWaterSavings().toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">gallons/year</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Financial Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Estimated ROI</span>
                  <span className="text-2xl font-bold font-mono text-primary">{calculateROI()}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on current market rates for carbon credits, energy, and water
                </p>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carbon Credit Value</span>
                  <span className="font-mono">${(calculateCO2Savings() * 50).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Energy Savings</span>
                  <span className="font-mono">${(calculateEnergySavings() * 0.12).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Water Savings</span>
                  <span className="font-mono">${(calculateWaterSavings() * 0.002).toFixed(2)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Annual Savings</span>
                <span className="font-mono text-primary">
                  ${(calculateCO2Savings() * 50 + calculateEnergySavings() * 0.12 + calculateWaterSavings() * 0.002).toFixed(2)}
                </span>
              </div>
              <Button className="w-full mt-4" data-testid="button-create-project">
                Create Project from Calculation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
