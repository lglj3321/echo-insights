import { useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  TrendingUp,
  FileText,
  Lock,
  Edit,
  Download,
  Award,
  LineChart,
  Upload,
  Clock,
  MessageSquare,
} from "lucide-react";
import { Link } from "wouter";
import { ProjectUpdateDialog } from "@/components/ProjectUpdateDialog";
import { CreateSurveyDialog } from "@/components/CreateSurveyDialog";
import { useToast } from "@/hooks/use-toast";

interface MetricScore {
  name: string;
  value: string;
  normalizedScore: number;
  type: string;
}

interface MetricTypeWeight {
  type: string;
  weight: number;
  metrics: MetricScore[];
}

interface ProjectUpdate {
  period: string;
  year: string;
  timestamp: string;
  notes?: string;
  metricUpdates: { name: string; value: string }[];
  newMetrics: { name: string; value: string }[];
}

export default function ProjectDetails() {
  const [, params] = useRoute("/project/:id");
  const projectId = params?.id || "1";
  const { toast } = useToast();

  // Check if this is a merge scenario
  const urlParams = new URLSearchParams(window.location.search);
  const isMerged = urlParams.get('merged') === 'true';
  const mergeContextStr = sessionStorage.getItem('mergeContext');
  const mergeContext = mergeContextStr ? JSON.parse(mergeContextStr) : null;

  // Grant authorization if user is merging their new project into this one
  const [isAuthorized] = useState(true); // In real app, check user permissions OR merge context
  const [showMergeBanner, setShowMergeBanner] = useState(isMerged && mergeContext);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isCreateSurveyDialogOpen, setIsCreateSurveyDialogOpen] = useState(false);
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([
    {
      period: "Q4",
      year: "2024",
      timestamp: "2024-10-15T10:00:00Z",
      notes: "Initial project creation",
      metricUpdates: [],
      newMetrics: [],
    },
  ]);
  const [metricWeights, setMetricWeights] = useState<Record<string, number>>({
    "Environmental Impact": 40,
    "Resource Efficiency": 30,
    "Cost Effectiveness": 20,
    "Social Impact": 10,
  });

  // TODO: Remove mock data - replace with actual API data
  const mockProjects = [
    {
      id: "1",
      title: "100% Recycled Packaging Initiative",
      description: "Transition all product packaging to 100% recycled materials to reduce environmental impact and meet our 2025 sustainability goals. This initiative includes redesigning packaging, sourcing certified recycled materials, and educating consumers about proper recycling.",
      category: "Packaging",
      estimatedCost: 45000,
      roi: 18,
      status: "active",
      createdAt: "2024-10-15",
      uploadedFiles: [
        { name: "packaging-analysis.pdf", size: "2.4 MB", uploadedAt: "2024-10-15" },
        { name: "supplier-quotes.xlsx", size: "456 KB", uploadedAt: "2024-10-16" },
      ],
    },
    {
      id: "2",
      title: "Solar Energy Installation",
      description: "Install solar panels on manufacturing facilities to reduce energy costs and carbon emissions. This comprehensive project includes site assessment, installation, and grid integration.",
      category: "Energy",
      estimatedCost: 120000,
      roi: 25,
      status: "active",
      createdAt: "2024-09-20",
      uploadedFiles: [
        { name: "solar-feasibility-study.pdf", size: "3.1 MB", uploadedAt: "2024-09-20" },
      ],
    },
    {
      id: "3",
      title: "Local Sourcing Initiative",
      description: "Source 80% of ingredients from local suppliers within 100 miles to reduce transportation emissions and support the local economy.",
      category: "Sourcing",
      estimatedCost: 28000,
      roi: 12,
      status: "active",
      createdAt: "2024-08-10",
      uploadedFiles: [],
    },
    {
      id: "4",
      title: "Water Recycling System",
      description: "Implement advanced water recycling in production facilities to reduce water consumption by 60% and lower utility costs.",
      category: "Water",
      estimatedCost: 75000,
      roi: 20,
      status: "active",
      createdAt: "2024-07-15",
      uploadedFiles: [
        { name: "water-system-blueprint.pdf", size: "1.8 MB", uploadedAt: "2024-07-15" },
        { name: "cost-analysis.xlsx", size: "320 KB", uploadedAt: "2024-07-16" },
      ],
    },
    {
      id: "5",
      title: "Zero Waste Initiative",
      description: "Achieve zero waste to landfill by 2025 through comprehensive recycling, composting, and waste reduction programs.",
      category: "Waste",
      estimatedCost: 35000,
      roi: 15,
      status: "active",
      createdAt: "2024-06-01",
      uploadedFiles: [],
    },
    {
      id: "6",
      title: "Electric Fleet Transition",
      description: "Replace delivery vehicles with electric alternatives to reduce emissions and fuel costs while improving brand image.",
      category: "Logistics",
      estimatedCost: 95000,
      roi: 22,
      status: "active",
      createdAt: "2024-05-12",
      uploadedFiles: [
        { name: "fleet-analysis.pdf", size: "2.2 MB", uploadedAt: "2024-05-12" },
      ],
    },
  ];

  // Find the specific project by ID, or default to the first one
  const mockProject = mockProjects.find(p => p.id === projectId) || mockProjects[0];

  const mockMetrics: MetricScore[] = [
    { name: "CO₂ Emissions Reduced", value: "3.2 Tons/Quarter", normalizedScore: 85, type: "Environmental Impact" },
    { name: "Recycled Material Usage", value: "92%", normalizedScore: 92, type: "Environmental Impact" },
    { name: "Plastic Elimination", value: "1,200 kg/year", normalizedScore: 78, type: "Environmental Impact" },
    { name: "Water Conservation", value: "1,250 Gallons/Month", normalizedScore: 65, type: "Resource Efficiency" },
    { name: "Energy Savings", value: "450 kWh/Month", normalizedScore: 71, type: "Resource Efficiency" },
    { name: "Packaging Weight Reduction", value: "25 grams per unit", normalizedScore: 88, type: "Resource Efficiency" },
    { name: "Cost Savings", value: "$12,500/year", normalizedScore: 55, type: "Cost Effectiveness" },
    { name: "ROI Timeline", value: "18 months", normalizedScore: 68, type: "Cost Effectiveness" },
    { name: "Consumer Satisfaction", value: "4.6/5", normalizedScore: 92, type: "Social Impact" },
    { name: "Brand Value Increase", value: "15%", normalizedScore: 75, type: "Social Impact" },
  ];

  const groupedMetrics: MetricTypeWeight[] = Object.entries(
    mockMetrics.reduce((acc, metric) => {
      if (!acc[metric.type]) {
        acc[metric.type] = [];
      }
      acc[metric.type].push(metric);
      return acc;
    }, {} as Record<string, MetricScore[]>)
  ).map(([type, metrics]) => ({
    type,
    weight: metricWeights[type] || 25,
    metrics,
  }));

  const calculateImpactScore = () => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    groupedMetrics.forEach(group => {
      const groupAverage = group.metrics.reduce((sum, m) => sum + m.normalizedScore, 0) / group.metrics.length;
      totalWeightedScore += groupAverage * group.weight;
      totalWeight += group.weight;
    });

    return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  };

  const impactScore = calculateImpactScore();

  const handleWeightChange = (type: string, value: number[]) => {
    setMetricWeights(prev => ({
      ...prev,
      [type]: value[0],
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-chart-3";
    if (score >= 40) return "text-chart-2";
    return "text-orange-600";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "D";
  };

  const handleProjectUpdate = (updateData: any) => {
    const newUpdate: ProjectUpdate = {
      period: updateData.period,
      year: updateData.year,
      timestamp: updateData.timestamp,
      notes: updateData.notes,
      metricUpdates: updateData.metricUpdates,
      newMetrics: updateData.newMetrics,
    };

    setProjectUpdates([...projectUpdates, newUpdate]);
    
    toast({
      title: "Project Updated",
      description: `Data for ${updateData.period} ${updateData.year} has been added successfully.`,
    });
  };

  const handleIntegrateMergeData = () => {
    if (!mergeContext) return;

    // Create an update entry for the merged data
    const mergeUpdate: ProjectUpdate = {
      period: new Date().getMonth() < 3 ? "Q1" : new Date().getMonth() < 6 ? "Q2" : new Date().getMonth() < 9 ? "Q3" : "Q4",
      year: new Date().getFullYear().toString(),
      timestamp: mergeContext.mergedAt,
      notes: `Merged data from new project: "${mergeContext.newProjectData?.title || 'Untitled'}"`,
      metricUpdates: [],
      newMetrics: mergeContext.newMetrics.map((m: any) => ({
        name: m.name,
        value: m.value
      })),
    };

    setProjectUpdates([...projectUpdates, mergeUpdate]);
    
    toast({
      title: "Merge Completed",
      description: `New project data has been integrated successfully.`,
    });

    // Clear merge context
    sessionStorage.removeItem('mergeContext');
    setShowMergeBanner(false);
    
    // Remove merged param from URL
    window.history.replaceState({}, '', `/project/${projectId}`);
  };

  const handleCancelMerge = () => {
    sessionStorage.removeItem('mergeContext');
    setShowMergeBanner(false);
    window.history.replaceState({}, '', `/project/${projectId}`);
    
    toast({
      title: "Merge Cancelled",
      description: "No data was integrated.",
      variant: "destructive",
    });
  };

  const handleCreateSurvey = (surveyData: any) => {
    console.log('Survey created:', surveyData);
    toast({
      title: "Survey Created",
      description: `Your survey "${surveyData.title}" has been created successfully.`,
    });
  };

  const existingMetricNames = mockMetrics.map(m => m.name);

  return (
    <div className="space-y-6 max-w-7xl">
      {showMergeBanner && mergeContext && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Merge Pending</Badge>
                  <h3 className="font-semibold">Ready to Integrate New Project Data</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  You've chosen to merge your new project "{mergeContext.newProjectData?.title}" into this existing project.
                  Review the data below and click "Integrate Data" to add the new metrics and information to this project.
                </p>
                {mergeContext.newMetrics && mergeContext.newMetrics.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">New Metrics to Add:</p>
                    <div className="flex flex-wrap gap-2">
                      {mergeContext.newMetrics.map((metric: any, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {metric.name}: {metric.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelMerge}
                  data-testid="button-cancel-merge"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleIntegrateMergeData}
                  data-testid="button-integrate-merge"
                >
                  Integrate Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-4xl font-bold">{mockProject.title}</h1>
            <Badge variant="default">{mockProject.category}</Badge>
            <Badge variant="outline" className="capitalize">{mockProject.status}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Created on {new Date(mockProject.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/project/${projectId}/forecast`}>
            <Button variant="default" data-testid="button-forecast">
              <LineChart className="h-4 w-4 mr-2" />
              Forecast
            </Button>
          </Link>
          {isAuthorized && (
            <>
              <Button 
                variant="default" 
                onClick={() => setIsCreateSurveyDialogOpen(true)}
                data-testid="button-create-survey"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Create Survey
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setIsUpdateDialogOpen(true)}
                data-testid="button-upload-data"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload New Data
              </Button>
              <Button variant="outline" data-testid="button-edit-project">
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Overall Impact Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className={`text-6xl font-bold font-mono ${getScoreColor(impactScore)}`}>
                    {impactScore}
                  </span>
                  <span className="text-2xl text-muted-foreground">/ 100</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="default" className="text-lg px-3 py-1">
                    Grade: {getScoreGrade(impactScore)}
                  </Badge>
                </div>
              </div>
              <TrendingUp className="h-24 w-24 text-primary opacity-20" />
            </div>
            <Progress value={impactScore} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground">
              Calculated from {mockMetrics.length} normalized metrics across {groupedMetrics.length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated Cost</span>
              <span className="font-semibold">${mockProject.estimatedCost.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expected ROI</span>
              <span className="font-semibold">{mockProject.roi}%</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Metrics</span>
              <span className="font-semibold">{mockMetrics.length}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Metric Categories</span>
              <span className="font-semibold">{groupedMetrics.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Metrics & Scoring</TabsTrigger>
          <TabsTrigger value="timeline">Timeline & Updates</TabsTrigger>
          <TabsTrigger value="description">Description & Files</TabsTrigger>
          <TabsTrigger value="settings">Weights & Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4 mt-6">
          {groupedMetrics.map((group, idx) => (
            <Card key={idx} data-testid={`metric-group-${idx}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{group.type}</CardTitle>
                  <Badge variant="outline">
                    Weight: {group.weight}% | {group.metrics.length} metrics
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.metrics.map((metric, metricIdx) => (
                  <div key={metricIdx} className="space-y-2" data-testid={`metric-${idx}-${metricIdx}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{metric.name}</p>
                        <p className="text-sm text-muted-foreground">{metric.value}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold font-mono ${getScoreColor(metric.normalizedScore)}`}>
                          {metric.normalizedScore}
                        </div>
                        <p className="text-xs text-muted-foreground">Normalized Score</p>
                      </div>
                    </div>
                    <Progress value={metric.normalizedScore} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Project Timeline
                </CardTitle>
                <Badge variant="outline">
                  {projectUpdates.length} update{projectUpdates.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectUpdates.map((update, idx) => (
                  <div
                    key={idx}
                    className="relative pl-8 pb-8 border-l-2 border-muted last:pb-0"
                    data-testid={`timeline-update-${idx}`}
                  >
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="default">
                          {update.period} {update.year}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(update.timestamp).toLocaleDateString()} at{' '}
                          {new Date(update.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {update.notes && (
                        <p className="text-sm text-muted-foreground">{update.notes}</p>
                      )}

                      {update.metricUpdates.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Metric Updates:</p>
                          <ul className="text-sm space-y-1">
                            {update.metricUpdates.map((metric, mIdx) => (
                              <li key={mIdx} className="text-muted-foreground">
                                • {metric.name}: <span className="font-mono">{metric.value}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {update.newMetrics.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">New Metrics Added:</p>
                          <ul className="text-sm space-y-1">
                            {update.newMetrics.map((metric, mIdx) => (
                              <li key={mIdx} className="text-muted-foreground">
                                • {metric.name}: <span className="font-mono">{metric.value}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {idx === 0 && (
                        <Badge variant="secondary" className="mt-2">Initial Creation</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="description" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {mockProject.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Uploaded Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockProject.uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                  data-testid={`file-${idx}`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {file.size} • Uploaded {file.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" data-testid={`button-download-${idx}`}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {mockProject.uploadedFiles.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No files uploaded
                </p>
              )}
            </CardContent>
          </Card>

          {!isAuthorized && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="flex items-center gap-3 p-4">
                <Lock className="h-5 w-5 text-orange-600" />
                <p className="text-sm">
                  You don't have permission to edit this project. Contact the project owner for access.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Metric Type Weights</CardTitle>
              <p className="text-sm text-muted-foreground">
                Adjust the importance of each metric category to calculate the overall impact score
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {groupedMetrics.map((group, idx) => (
                <div key={idx} className="space-y-3" data-testid={`weight-slider-${idx}`}>
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">{group.type}</Label>
                    <Badge variant="secondary" className="font-mono">
                      {group.weight}%
                    </Badge>
                  </div>
                  <Slider
                    value={[group.weight]}
                    onValueChange={(value) => handleWeightChange(group.type, value)}
                    max={100}
                    step={5}
                    disabled={!isAuthorized}
                    data-testid={`slider-${idx}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    Affects {group.metrics.length} metric{group.metrics.length !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <span className="font-semibold">Total Weight</span>
                <span className="text-lg font-bold font-mono">
                  {Object.values(metricWeights).reduce((sum, w) => sum + w, 0)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Total weight should equal 100% for optimal impact score calculation
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProjectUpdateDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        projectId={projectId}
        existingMetrics={existingMetricNames}
        onSubmit={handleProjectUpdate}
      />

      <CreateSurveyDialog
        open={isCreateSurveyDialogOpen}
        onOpenChange={setIsCreateSurveyDialogOpen}
        projectId={projectId}
        projectCategory={mockProject.category}
        onSubmit={handleCreateSurvey}
      />
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
