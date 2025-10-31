import { useState } from "react";
import { ProjectCard, Project } from "@/components/ProjectCard";
import { ProjectForm } from "@/components/ProjectForm";
import { MetricsSelectionDialog, MetricItem } from "@/components/MetricsSelectionDialog";
import { SimilarProjectsDialog } from "@/components/SimilarProjectsDialog";
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
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Projects() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMetricsDialogOpen, setIsMetricsDialogOpen] = useState(false);
  const [isSimilarProjectsDialogOpen, setIsSimilarProjectsDialogOpen] = useState(false);
  const [pendingMetrics, setPendingMetrics] = useState<MetricItem[]>([]);
  const [pendingProjectData, setPendingProjectData] = useState<any>(null);
  const [similarProjects, setSimilarProjects] = useState<any[]>([]);

  // TODO: Remove mock data - replace with actual API data
  const mockProjects: Project[] = [
    {
      id: "1",
      title: "100% Recycled Packaging",
      description: "Switch all product packaging to 100% recycled materials",
      type: "Packaging",
      estimatedCost: 45000,
      roi: 18,
      co2Saved: 2.5,
      waterSaved: 500,
      feedbackScore: 4.6,
      responseCount: 234
    },
    {
      id: "2",
      title: "Solar Energy Installation",
      description: "Install solar panels on manufacturing facilities",
      type: "Energy",
      estimatedCost: 120000,
      roi: 25,
      co2Saved: 8.2,
      feedbackScore: 4.1,
      responseCount: 156
    },
    {
      id: "3",
      title: "Local Sourcing Initiative",
      description: "Source 80% of ingredients from local suppliers",
      type: "Sourcing",
      estimatedCost: 28000,
      roi: 12,
      co2Saved: 1.8,
      feedbackScore: 4.8,
      responseCount: 312
    },
    {
      id: "4",
      title: "Water Recycling System",
      description: "Implement advanced water recycling in production",
      type: "Water",
      estimatedCost: 75000,
      roi: 20,
      co2Saved: 3.5,
      feedbackScore: 4.3,
      responseCount: 189
    },
    {
      id: "5",
      title: "Zero Waste Initiative",
      description: "Achieve zero waste to landfill by 2025",
      type: "Waste",
      estimatedCost: 35000,
      roi: 15,
      co2Saved: 2.1,
      feedbackScore: 4.4,
      responseCount: 201
    },
    {
      id: "6",
      title: "Electric Fleet Transition",
      description: "Replace delivery vehicles with electric alternatives",
      type: "Logistics",
      estimatedCost: 95000,
      roi: 22,
      co2Saved: 5.8,
      feedbackScore: 4.2,
      responseCount: 167
    },
  ];

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || project.type === filterType;
    return matchesSearch && matchesType;
  });

  const projectTypes = ["Packaging", "Energy", "Sourcing", "Waste", "Water", "Logistics"];

  const extractMetricsFromFile = (file: File): Promise<MetricItem[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const fileName = file.name.toLowerCase();
        const extractedMetrics: MetricItem[] = [];

        if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx')) {
          extractedMetrics.push(
            { name: "CO₂ Emissions Reduced", value: "3.2 Tons/Quarter", source: "file" },
            { name: "Water Conservation", value: "1,250 Gallons/Month", source: "file" },
            { name: "Energy Savings", value: "450 kWh/Month", source: "file" },
            { name: "Waste Diverted", value: "85%", source: "file" }
          );
        } else if (fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
          extractedMetrics.push(
            { name: "Carbon Footprint Reduction", value: "2.8 Tons/Year", source: "file" },
            { name: "Recycling Rate", value: "92%", source: "file" }
          );
        }

        resolve(extractedMetrics);
      }, 1000);
    });
  };

  const handleProjectSubmit = async (data: any) => {
    const userMetrics: MetricItem[] = (data.metrics || []).map((m: any) => ({
      name: m.name,
      value: m.value,
      source: "user" as const
    }));

    let allMetrics = [...userMetrics];

    if (data.uploadedFile) {
      const fileMetrics = await extractMetricsFromFile(data.uploadedFile);
      allMetrics = [...allMetrics, ...fileMetrics];
    }

    setPendingProjectData(data);
    setIsCreateDialogOpen(false);
    
    if (allMetrics.length > 0) {
      setPendingMetrics(allMetrics);
      setIsMetricsDialogOpen(true);
    } else {
      console.log('Project created with no metrics:', data);
      toast({
        title: "Project Created",
        description: "Your sustainability project has been created successfully.",
      });
    }
  };

  const calculateSimilarity = (newProjectData: any, existingProject: Project, selectedMetrics: MetricItem[]) => {
    let totalScore = 0;
    const matchReasons: string[] = [];

    const newDesc = newProjectData.description.toLowerCase();
    const existingDesc = existingProject.description.toLowerCase();
    const words = newDesc.split(/\s+/);
    const matchingWords = words.filter((word: string) => 
      word.length > 3 && existingDesc.includes(word)
    );
    const descriptionSimilarity = (matchingWords.length / Math.max(words.length, 1)) * 100;
    totalScore += descriptionSimilarity * 0.6;

    if (descriptionSimilarity > 30) {
      matchReasons.push(`${Math.round(descriptionSimilarity)}% description overlap`);
    }

    const metricNames = selectedMetrics.map(m => m.name.toLowerCase());
    const hasCarbon = metricNames.some(n => n.includes('co') || n.includes('carbon') || n.includes('emission'));
    const hasWater = metricNames.some(n => n.includes('water'));
    const hasEnergy = metricNames.some(n => n.includes('energy'));
    
    let metricOverlap = 0;
    if (hasCarbon && existingProject.co2Saved) {
      metricOverlap += 33;
      matchReasons.push('Both track carbon emissions');
    }
    if (hasWater && existingProject.waterSaved) {
      metricOverlap += 33;
      matchReasons.push('Both track water conservation');
    }
    if (hasEnergy) {
      metricOverlap += 33;
      matchReasons.push('Both focus on energy efficiency');
    }

    totalScore += metricOverlap * 0.4;

    const costDiff = Math.abs(newProjectData.estimatedCost - existingProject.estimatedCost);
    const avgCost = (newProjectData.estimatedCost + existingProject.estimatedCost) / 2;
    if (avgCost > 0 && costDiff / avgCost < 0.3) {
      matchReasons.push('Similar budget range');
    }

    return {
      similarity: Math.min(Math.round(totalScore), 99),
      matchReasons: matchReasons.length > 0 ? matchReasons : ['General similarity in scope']
    };
  };

  const handleMetricsConfirm = (selectedMetrics: MetricItem[]) => {
    const similar = mockProjects
      .map(project => {
        const { similarity, matchReasons } = calculateSimilarity(
          pendingProjectData,
          project,
          selectedMetrics
        );
        return { project, similarity, matchReasons };
      })
      .filter(s => s.similarity > 25)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    if (similar.length > 0) {
      setSimilarProjects(similar);
      setIsSimilarProjectsDialogOpen(true);
    } else {
      finalizeProject(selectedMetrics);
    }
  };

  const finalizeProject = (selectedMetrics?: MetricItem[]) => {
    const metrics = selectedMetrics || pendingMetrics.filter(m => m.name && m.value);
    console.log('Final project created with metrics:', metrics);
    toast({
      title: "Project Created",
      description: `Your project has been created with ${metrics.length} metric${metrics.length !== 1 ? 's' : ''}.`,
    });
    setPendingMetrics([]);
    setPendingProjectData(null);
  };

  const handleMergeProject = (projectId: string) => {
    const mergeWith = mockProjects.find(p => p.id === projectId);
    console.log('Merging new project with:', mergeWith);
    toast({
      title: "Projects Merged",
      description: `Your new project has been merged with "${mergeWith?.title}".`,
    });
    setPendingMetrics([]);
    setPendingProjectData(null);
  };

  const handleCancelProject = () => {
    toast({
      title: "Project Cancelled",
      description: "Your new project has been cancelled.",
      variant: "destructive",
    });
    setPendingMetrics([]);
    setPendingProjectData(null);
  };

  const handleProceedWithProject = () => {
    finalizeProject();
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                onSubmit={handleProjectSubmit}
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
          <SelectTrigger className="w-full md:w-48" data-testid="select-filter-type">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {projectTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
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
          All ({mockProjects.length})
        </Badge>
        {projectTypes.map(type => {
          const count = mockProjects.filter(p => p.type === type).length;
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
          <p className="text-muted-foreground">No projects found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onGenerateQR={(id) => console.log('Generate QR for project:', id)}
              onViewDetails={(id) => console.log('View details for project:', id)}
            />
          ))}
        </div>
      )}

      <MetricsSelectionDialog
        open={isMetricsDialogOpen}
        onOpenChange={setIsMetricsDialogOpen}
        metrics={pendingMetrics}
        onSubmit={handleMetricsConfirm}
      />

      <SimilarProjectsDialog
        open={isSimilarProjectsDialogOpen}
        onOpenChange={setIsSimilarProjectsDialogOpen}
        similarProjects={similarProjects}
        onMerge={handleMergeProject}
        onCancel={handleCancelProject}
        onProceed={handleProceedWithProject}
      />
    </div>
  );
}
