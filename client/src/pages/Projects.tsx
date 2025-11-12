import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Papa from "papaparse";
import { ProjectCard, Project } from "@/components/ProjectCard";
import { ProjectForm } from "@/components/ProjectForm";
import {
  MetricsSelectionDialog,
  MetricItem,
} from "@/components/MetricsSelectionDialog";
import { FinalizeProjectDialog } from "@/components/FinalizeProjectDialog";
import {
  RecommendedMetricsDialog,
  RecommendedMetric,
  CustomMetric,
} from "@/components/RecommendedMetricsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, RefreshCw, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Projects() {
  const { toast } = useToast();
  const { user, isLoading: isLoadingUser } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRecommendedMetricsDialogOpen, setIsRecommendedMetricsDialogOpen] =
    useState(false);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] =
    useState(false);
  const [pendingMetrics, setPendingMetrics] = useState<MetricItem[]>([]);
  const [pendingCustomMetrics, setPendingCustomMetrics] = useState<CustomMetric[]>([]);
  const [pendingProjectData, setPendingProjectData] = useState<any>(null);
  const [similarProjects, setSimilarProjects] = useState<any[]>([]);
  const [suggestedCategory, setSuggestedCategory] =
    useState<string>("Packaging");
  const [isClassifying, setIsClassifying] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null);
  const [classificationConfidence, setClassificationConfidence] = useState<number>(0);

  // Fetch projects from API (不需要userId参数，后端从session获取)
  const { data: projects = [], isLoading: isLoadingProjects, error: projectsError } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  // Show error toast if projects fail to load (only once)
  useEffect(() => {
    if (projectsError) {
      toast({
        title: "Error Loading Projects",
        description: "Failed to load projects. Please try again.",
        variant: "destructive",
      });
    }
  }, [projectsError, toast]);

  // Filter projects based on search and type filter
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || project.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [projects, searchQuery, filterType]);

  const projectTypes = ["Packaging", "Energy", "Sourcing", "Waste", "Water"];
  // const projectTypes = ["Packaging", "Energy", "Sourcing", "Waste", "Water", "Logistics"];

  const extractMetricsFromFile = (file: File): Promise<MetricItem[]> => {
    return new Promise((resolve, reject) => {
      const fileName = file.name.toLowerCase();
      const extractedMetrics: MetricItem[] = [];

      // Parse CSV files using PapaParse - Read vertically (first column = metric names)
      if (fileName.endsWith(".csv")) {
        Papa.parse(file, {
          header: false, // Don't use header mode, read as raw array
          skipEmptyLines: true,
          // Auto-detect delimiter (supports comma, semicolon, tab, etc.)
          complete: (results) => {
            if (results.data && results.data.length > 1) {
              const rows = results.data as any[][];
              
              // First row = headers to find value/unit columns
              const headerRow = rows[0];
              let valueColIndex = -1;
              let unitColIndex = -1;
              
              // Detect columns by keywords (case-insensitive)
              headerRow.forEach((header: any, index: number) => {
                const headerStr = String(header || "").toLowerCase();
                if (headerStr.includes("value") || headerStr.includes("metric")) {
                  valueColIndex = index;
                }
                if (headerStr.includes("unit") || headerStr.includes("measure")) {
                  unitColIndex = index;
                }
              });
              
              // Extract metrics from remaining rows (first column = metric name)
              for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (!Array.isArray(row) || row.length === 0) continue;
                
                const metricName = row[0];
                if (!metricName || String(metricName).trim() === "") continue;
                
                // Build value string
                let valueStr = "";
                if (valueColIndex >= 0 && row[valueColIndex]) {
                  valueStr = String(row[valueColIndex]);
                }
                
                if (unitColIndex >= 0 && row[unitColIndex]) {
                  const unit = String(row[unitColIndex]);
                  valueStr = valueStr ? `${valueStr} ${unit}` : unit;
                }
                
                if (valueStr.trim()) {
                  extractedMetrics.push({
                    metricName: String(metricName),
                    value: valueStr,
                    source: "file",
                  });
                }
              }
            }
            resolve(extractedMetrics);
          },
          error: (error) => {
            console.error("CSV parsing error:", error);
            resolve([]); // Return empty array on error instead of rejecting
          }
        });
      } 
      // For Excel files - Read vertically (first column = metric names)
      else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const base64 = e.target?.result as string;
            const base64Data = base64.split(",")[1];
            
            const response = await fetch("/api/parse-excel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileData: base64Data }),
            });
            
            if (response.ok) {
              const { metrics } = await response.json();
              const extractedMetrics: any[] = [];
              
              if (Array.isArray(metrics)) {
                metrics.forEach((metric: { name: string; value: string }) => {
                  extractedMetrics.push({
                    metricName: metric.name,
                    value: metric.value,
                    source: "file",
                  });
                });
              }
              resolve(extractedMetrics);
            } else {
              console.error("Excel parsing failed");
              resolve([]);
            }
          } catch (error) {
            console.error("Excel processing error:", error);
            resolve([]);
          }
        };
        reader.onerror = () => {
          console.error("File reading error");
          resolve([]);
        };
        reader.readAsDataURL(file);
      }
      else {
        resolve([]);
      }
    });
  };

  const handleProjectSubmit = async (data: any) => {
    // Store project data
    setPendingProjectData(data);
    setIsCreateDialogOpen(false);

    try {
      // Show classifying state
      setIsClassifying(true);

      // Prepare all custom metrics (user-entered + file-extracted)
      const userMetrics: CustomMetric[] = (data.metrics || []).map((m: any) => ({
        metricName: m.metricName,
        value: m.value,
        source: "user" as const,
      }));

      // Extract file metrics and full text if file uploaded
      let allCustomMetrics = [...userMetrics];
      let fileMetrics: any[] = [];
      let fileText: string | undefined;
      
      if (data.uploadedFile) {
        fileMetrics = await extractMetricsFromFile(data.uploadedFile);
        
        // Extract full text for OpenAI classification from Excel files
        const fileName = data.uploadedFile.name.toLowerCase();
        const reader = new FileReader();
        
        const extractFullText = new Promise<string>((resolve) => {
          reader.onload = async (e) => {
            try {
              const base64 = e.target?.result as string;
              const base64Data = base64.split(",")[1];
              
              if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
                const response = await fetch("/api/parse-excel", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ fileData: base64Data }),
                });
                if (response.ok) {
                  const { text } = await response.json();
                  resolve(text);
                } else {
                  resolve("");
                }
              } else {
                resolve("");
              }
            } catch {
              resolve("");
            }
          };
          reader.readAsDataURL(data.uploadedFile);
        });
        
        fileText = await extractFullText;
        
        allCustomMetrics = [
          ...allCustomMetrics,
          ...fileMetrics.map((m) => ({ ...m, source: "file" as const })),
        ];
      }

      setPendingCustomMetrics(allCustomMetrics);

      // Call classification API
      const classificationResponse = await fetch("/api/classify-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: data.description,
          customMetrics: userMetrics,
          csvData: fileMetrics,
          fileText: fileText,
        }),
      });

      if (classificationResponse.ok) {
        const result = await classificationResponse.json();
        setDetectedCategory(result.category);
        setClassificationConfidence(result.confidence);
      } else {
        // Fallback to keyword-based detection in the dialog
        setDetectedCategory(null);
        setClassificationConfidence(0);
      }
    } catch (error) {
      console.error("Classification error:", error);
      toast({
        title: "Classification Error",
        description: "Using keyword-based detection. You can change it manually.",
        variant: "destructive",
      });
      // Fallback to keyword-based detection in the dialog
      setDetectedCategory(null);
      setClassificationConfidence(0);
    } finally {
      setIsClassifying(false);
      
      // Show unified metrics dialog with both AI and custom metrics
      setTimeout(() => {
        setIsRecommendedMetricsDialogOpen(true);
      }, 100);
    }
  };

  const handleRecommendedMetricsSubmit = async (
    selectedAIMetrics: RecommendedMetric[],
    selectedCustomMetrics: CustomMetric[],
    customCategoryName?: string,
  ) => {
    // Close unified metrics dialog
    setIsRecommendedMetricsDialogOpen(false);

    // Store custom category name if provided
    if (customCategoryName) {
      setPendingProjectData((prev: any) => ({
        ...prev,
        customCategory: customCategoryName,
      }));
    }

    // Combine AI metrics and custom metrics into unified list
    const aiAsMetrics: MetricItem[] = selectedAIMetrics.map((m) => ({
      metricName: m.metricName,
      value: m.value,
      source: "user" as const,
    }));

    const customAsMetrics: MetricItem[] = selectedCustomMetrics.map((m) => ({
      metricName: m.metricName,
      value: m.value,
      source: m.source,
    }));

    const allSelectedMetrics = [...aiAsMetrics, ...customAsMetrics];

    // Store metrics and proceed to similarity analysis
    setPendingMetrics(allSelectedMetrics);
    handleMetricsConfirm(allSelectedMetrics);
  };

  const calculateSimilarity = (
    newProjectData: any,
    existingProject: Project,
    selectedMetrics: MetricItem[],
  ) => {
    let totalScore = 0;
    const matchReasons: string[] = [];

    const newDesc = newProjectData.description.toLowerCase();
    const existingDesc = existingProject.description.toLowerCase();
    const words = newDesc.split(/\s+/);
    const matchingWords = words.filter(
      (word: string) => word.length > 3 && existingDesc.includes(word),
    );
    const descriptionSimilarity =
      (matchingWords.length / Math.max(words.length, 1)) * 100;
    totalScore += descriptionSimilarity * 0.6;

    if (descriptionSimilarity > 30) {
      matchReasons.push(
        `${Math.round(descriptionSimilarity)}% description overlap`,
      );
    }

    const metricNames = selectedMetrics.map((m) => m.metricName.toLowerCase());
    const hasCarbon = metricNames.some(
      (n) => n.includes("co") || n.includes("carbon") || n.includes("emission"),
    );
    const hasWater = metricNames.some((n) => n.includes("water"));
    const hasEnergy = metricNames.some((n) => n.includes("energy"));

    let metricOverlap = 0;
    if (hasCarbon) {
      metricOverlap += 33;
      matchReasons.push("Both track carbon emissions");
    }
    if (hasWater && existingProject.waterSaved) {
      metricOverlap += 33;
      matchReasons.push("Both track water conservation");
    }
    if (hasEnergy) {
      metricOverlap += 33;
      matchReasons.push("Both focus on energy efficiency");
    }

    totalScore += metricOverlap * 0.4;

    const costDiff = Math.abs(
      newProjectData.estimatedCost - existingProject.estimatedCost,
    );
    const avgCost =
      (newProjectData.estimatedCost + existingProject.estimatedCost) / 2;
    if (avgCost > 0 && costDiff / avgCost < 0.3) {
      matchReasons.push("Similar budget range");
    }

    return {
      similarity: Math.min(Math.round(totalScore), 99),
      matchReasons:
        matchReasons.length > 0
          ? matchReasons
          : ["General similarity in scope"],
    };
  };

  const handleMetricsConfirm = (selectedMetrics: MetricItem[]) => {
    // Store metrics for later use
    setPendingMetrics(selectedMetrics);

    // Calculate similarity with existing projects
    const similar = projects
      .map((project: Project) => {
        const { similarity, matchReasons } = calculateSimilarity(
          pendingProjectData,
          project,
          selectedMetrics,
        );
        return { project, similarity, matchReasons };
      })
      .filter((s) => s.similarity >= 25)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    console.log("Similarity analysis results:", {
      totalProjects: projects.length,
      similarFound: similar.length,
      topMatches: similar.map((s: any) => ({
        title: s.project.title,
        similarity: s.similarity,
      })),
    });

    // Always show finalize dialog (even if no matches)
    setTimeout(() => {
      setSimilarProjects(similar);
      setIsFinalizeDialogOpen(true);
    }, 100);
  };

  const finalizeProject = (selectedMetrics?: MetricItem[]) => {
    const metrics =
      selectedMetrics || pendingMetrics.filter((m) => m.metricName && m.value);
    console.log("Final project created with metrics:", metrics);
    toast({
      title: "Project Created",
      description: `Your project has been created with ${metrics.length} metric${metrics.length !== 1 ? "s" : ""}.`,
    });
    setPendingMetrics([]);
    setPendingProjectData(null);
  };

  const handleMergeProject = (projectId: string) => {
    const mergeWith = projects.find((p: Project) => p.id === projectId);

    // Store merge context in sessionStorage for the details page to pick up
    sessionStorage.setItem(
      "mergeContext",
      JSON.stringify({
        mergedAt: new Date().toISOString(),
        newProjectData: pendingProjectData,
        newMetrics: pendingMetrics,
        targetProjectId: projectId,
        targetProjectTitle: mergeWith?.title,
      }),
    );

    toast({
      title: "Merging Projects",
      description: `Redirecting to "${mergeWith?.title}" to integrate your new data.`,
    });

    setPendingMetrics([]);
    setPendingCustomMetrics([]);
    setPendingProjectData(null);
    setIsFinalizeDialogOpen(false);

    // Redirect to the target project's details page
    window.location.href = `/project/${projectId}?merged=true`;
  };

  const handleCancelProject = () => {
    toast({
      title: "Project Cancelled",
      description: "Your new project has been cancelled.",
      variant: "destructive",
    });
    setPendingMetrics([]);
    setPendingCustomMetrics([]);
    setPendingProjectData(null);
    setIsFinalizeDialogOpen(false);
  };

  const categorizeProject = (
    projectData: any,
    selectedMetrics: MetricItem[],
  ): string => {
    if (!projectData || !projectData.description) {
      return "Other";
    }
    const description = projectData.description.toLowerCase();
    const metricNames = selectedMetrics
      .map((m) => m.metricName.toLowerCase())
      .join(" ");
    const allText = `${description} ${metricNames}`;

    const categoryScores: Record<string, number> = {
      Packaging: 0,
      Energy: 0,
      Sourcing: 0,
      Waste: 0,
      Water: 0,
      Logistics: 0,
    };

    const keywords: Record<string, string[]> = {
      Packaging: [
        "packaging",
        "package",
        "container",
        "wrap",
        "box",
        "bottle",
        "recyclable",
        "biodegradable",
        "plastic",
      ],
      Energy: [
        "energy",
        "solar",
        "renewable",
        "power",
        "electricity",
        "kwh",
        "efficiency",
        "consumption",
        "carbon",
      ],
      Sourcing: [
        "sourcing",
        "supplier",
        "local",
        "supply chain",
        "procurement",
        "ingredients",
        "materials",
        "fair trade",
      ],
      Waste: [
        "waste",
        "recycling",
        "compost",
        "landfill",
        "disposal",
        "zero waste",
        "diversion",
      ],
      Water: [
        "water",
        "conservation",
        "recycling",
        "wastewater",
        "consumption",
        "gallons",
        "rainwater",
      ],
      Logistics: [
        "logistics",
        "transport",
        "delivery",
        "fleet",
        "vehicle",
        "shipping",
        "route",
        "miles",
        "electric vehicle",
      ],
    };

    Object.entries(keywords).forEach(([category, words]) => {
      words.forEach((keyword) => {
        if (allText.includes(keyword)) {
          categoryScores[category] += 1;
        }
      });
    });

    const topCategory = Object.entries(categoryScores).sort(
      ([, a], [, b]) => b - a,
    )[0];

    return topCategory[1] > 0 ? topCategory[0] : "Packaging";
  };

  // Mutation for creating project
  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const projectPayload = {
        ...pendingProjectData,
        // userId 不需要传递，后端从session自动获取
        type: pendingProjectData?.type || suggestedCategory,
        customCategory: pendingProjectData?.customCategory,
        estimatedCost: String(pendingProjectData?.estimatedCost || 0),
        roi: String(pendingProjectData?.roi || 0),
      };
      
      console.log("Creating project:", projectPayload);
      
      const response = await apiRequest("POST", "/api/projects", projectPayload);
      const project = await response.json();
      const projectId = project.id;
      
      // Create metrics
      if (pendingMetrics.length > 0) {
        await Promise.all(
          pendingMetrics.map((metric) =>
            apiRequest("POST", `/api/projects/${projectId}/metrics`, metric)
          )
        );
      }
      
      return { projectId, projectTitle: projectPayload.title, metricsCount: pendingMetrics.length };
    },
    onSuccess: async ({ projectId, projectTitle, metricsCount }) => {
      // Invalidate projects cache (不需要userId参数，后端从session获取)
      await queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      
      toast({
        title: "Project Created Successfully",
        description: `Your project has been created with ${metricsCount} metric${metricsCount !== 1 ? 's' : ''}.`,
      });

      // Clear pending state
      setPendingMetrics([]);
      setPendingCustomMetrics([]);
      setPendingProjectData(null);
      setIsFinalizeDialogOpen(false);

      // Navigate to project details
      navigate(`/project/${projectId}`);
    },
    onError: (error) => {
      console.error("Failed to create project:", error);
      toast({
        title: "Error Creating Project",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFinalizeProject = () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }
    createProjectMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your sustainability initiatives
          </p>
        </div>
        <div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button data-testid="button-create-project">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <ProjectForm 
                key={isCreateDialogOpen ? 'create-form' : 'hidden'}
                onSubmit={handleProjectSubmit} 
                initialData={pendingProjectData}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger
            className="w-full md:w-48"
            data-testid="select-filter-type"
          >
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {projectTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={filterType === "all" ? "default" : "outline"}
          className="cursor-pointer hover-elevate"
          onClick={() => setFilterType("all")}
          data-testid="badge-filter-all"
        >
          All ({projects.length})
        </Badge>
        {projectTypes.map((type) => {
          const count = projects.filter((p: Project) => p.type === type).length;
          return (
            <Badge
              key={type}
              variant={filterType === type ? "default" : "outline"}
              className="cursor-pointer hover-elevate"
              onClick={() => setFilterType(type)}
              data-testid={`badge-filter-${type.toLowerCase()}`}
            >
              {type} ({count})
            </Badge>
          );
        })}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No projects found matching your criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <RecommendedMetricsDialog
        open={isRecommendedMetricsDialogOpen}
        onOpenChange={setIsRecommendedMetricsDialogOpen}
        projectDescription={pendingProjectData?.description || ""}
        customMetrics={pendingCustomMetrics}
        apiDetectedCategory={detectedCategory}
        classificationConfidence={classificationConfidence}
        onSubmit={handleRecommendedMetricsSubmit}
        onGoBack={() => {
          setIsRecommendedMetricsDialogOpen(false);
          setIsCreateDialogOpen(true);
        }}
      />

      {/* Loading Dialog for Classification */}
      <Dialog open={isClassifying}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              Analyzing Project
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <p className="text-muted-foreground">
              AI is analyzing your project description, metrics, and uploaded files to suggest the best category...
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <FinalizeProjectDialog
        open={isFinalizeDialogOpen}
        onOpenChange={setIsFinalizeDialogOpen}
        similarProjects={similarProjects}
        onMerge={handleMergeProject}
        onCancel={handleCancelProject}
        onFinalize={handleFinalizeProject}
      />
    </div>
  );
}
