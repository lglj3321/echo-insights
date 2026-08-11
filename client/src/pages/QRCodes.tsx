import { useQuery } from "@tanstack/react-query";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { MetricCard } from "@/components/MetricCard";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, QrCode, Users, TrendingUp, Eye, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getQueryFn, authFetch } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Project } from "@/components/ProjectCard";

interface ProjectQR {
  projectId: string;
  projectTitle: string;
  projectType: string;
  surveyUrl: string;
  totalScans: number;
  totalResponses: number;
  responseRate: number;
}

export default function QRCodes() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Fetch projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Fetch QR scan counts and response counts for each project
  const { data: projectsWithStats } = useQuery({
    queryKey: ['/api/projects', 'qr-stats'],
    queryFn: async () => {
      const stats = await Promise.all(
        projects.map(async (project) => {
          try {
            const [scansResponse, feedbackResponse] = await Promise.all([
              authFetch(`/api/projects/${project.id}/qr-scans`),
              authFetch(`/api/projects/${project.id}/feedback-score`),
            ]);

            const scansData = scansResponse.ok ? await scansResponse.json() : { count: 0 };
            const feedbackData = feedbackResponse.ok ? await feedbackResponse.json() : { count: 0 };

            return {
              projectId: project.id,
              totalScans: scansData.count || 0,
              totalResponses: feedbackData.count || 0,
            };
          } catch (error) {
            return {
              projectId: project.id,
              totalScans: 0,
              totalResponses: 0,
            };
          }
        })
      );
      return stats;
    },
    enabled: !!user && projects.length > 0,
  });

  // Format projects as ProjectQR
  const projectQRs: ProjectQR[] = useMemo(() => {
    return projects.map(project => {
      const stats = projectsWithStats?.find(s => s.projectId === project.id);
      const surveyUrl = `${window.location.origin}/survey/${project.id}`;
      const totalScans = stats?.totalScans || 0;
      const totalResponses = stats?.totalResponses || 0;
      const responseRate = totalScans > 0 ? (totalResponses / totalScans) * 100 : 0;

      return {
        projectId: project.id,
        projectTitle: project.title,
        projectType: project.customCategory || project.type || "Other",
        surveyUrl,
        totalScans,
        totalResponses,
        responseRate,
      };
    });
  }, [projects, projectsWithStats]);

  const filteredProjects = projectQRs.filter(project => {
    const matchesSearch = project.projectTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || project.projectType === filterType;
    return matchesSearch && matchesType;
  });

  const totalScans = projectQRs.reduce((sum, p) => sum + p.totalScans, 0);
  const totalResponses = projectQRs.reduce((sum, p) => sum + p.totalResponses, 0);
  const overallResponseRate = totalScans > 0 ? (totalResponses / totalScans) * 100 : 0;

  const isLoading = isLoadingProjects;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading QR codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">QR Codes & Tracking</h1>
        <p className="text-muted-foreground mt-1">
          Monitor QR code scans, responses, and engagement rates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total QR Codes"
          value={projectQRs.length.toString()}
          icon={QrCode}
          subtitle="Active survey links"
        />
        <MetricCard
          title="Total Scans"
          value={totalScans.toLocaleString()}
          icon={Eye}
          subtitle="All-time QR code scans"
        />
        <MetricCard
          title="Total Responses"
          value={totalResponses.toLocaleString()}
          icon={Users}
          subtitle="Completed surveys"
        />
        <MetricCard
          title="Response Rate"
          value={`${overallResponseRate.toFixed(1)}%`}
          icon={TrendingUp}
          subtitle="Scan to completion rate"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-qr"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-48" data-testid="select-filter-type">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Packaging">Packaging</SelectItem>
            <SelectItem value="Energy">Energy</SelectItem>
            <SelectItem value="Sourcing">Sourcing</SelectItem>
            <SelectItem value="Water">Water</SelectItem>
            <SelectItem value="Waste">Waste</SelectItem>
            <SelectItem value="Logistics">Logistics</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {projectQRs.length === 0 
              ? "No projects yet. Create a project to generate QR codes." 
              : "No projects found matching your search"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <div key={project.projectId} className="space-y-4">
              <QRCodeDisplay
                projectId={project.projectId}
                projectTitle={project.projectTitle}
                surveyUrl={project.surveyUrl}
              />
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-sm">Engagement Metrics</CardTitle>
                    <Badge variant="outline">{project.projectType}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Scans</span>
                    <span className="text-sm font-semibold font-mono">{project.totalScans}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Responses</span>
                    <span className="text-sm font-semibold font-mono">{project.totalResponses}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Response Rate</span>
                    <span className="text-sm font-semibold font-mono text-primary">
                      {project.responseRate.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
