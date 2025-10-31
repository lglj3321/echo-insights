import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { MetricCard } from "@/components/MetricCard";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, QrCode, Users, TrendingUp, Eye } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // TODO: Remove mock data - replace with actual API data
  const mockProjectQRs: ProjectQR[] = [
    {
      projectId: "1",
      projectTitle: "100% Recycled Packaging",
      projectType: "Packaging",
      surveyUrl: "https://echo-insights.app/survey/project-1",
      totalScans: 523,
      totalResponses: 234,
      responseRate: 44.7,
    },
    {
      projectId: "2",
      projectTitle: "Solar Energy Installation",
      projectType: "Energy",
      surveyUrl: "https://echo-insights.app/survey/project-2",
      totalScans: 312,
      totalResponses: 156,
      responseRate: 50.0,
    },
    {
      projectId: "3",
      projectTitle: "Local Sourcing Initiative",
      projectType: "Sourcing",
      surveyUrl: "https://echo-insights.app/survey/project-3",
      totalScans: 687,
      totalResponses: 312,
      responseRate: 45.4,
    },
    {
      projectId: "4",
      projectTitle: "Water Recycling System",
      projectType: "Water",
      surveyUrl: "https://echo-insights.app/survey/project-4",
      totalScans: 445,
      totalResponses: 189,
      responseRate: 42.5,
    },
  ];

  const filteredProjects = mockProjectQRs.filter(project => {
    const matchesSearch = project.projectTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || project.projectType === filterType;
    return matchesSearch && matchesType;
  });

  const totalScans = mockProjectQRs.reduce((sum, p) => sum + p.totalScans, 0);
  const totalResponses = mockProjectQRs.reduce((sum, p) => sum + p.totalResponses, 0);
  const overallResponseRate = totalScans > 0 ? (totalResponses / totalScans) * 100 : 0;

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
          value={mockProjectQRs.length.toString()}
          icon={QrCode}
          subtitle="Active survey links"
        />
        <MetricCard
          title="Total Scans"
          value={totalScans.toLocaleString()}
          icon={Eye}
          subtitle="All-time QR code scans"
          trend={{ value: "+127 this week", isPositive: true }}
        />
        <MetricCard
          title="Total Responses"
          value={totalResponses.toLocaleString()}
          icon={Users}
          subtitle="Completed surveys"
          trend={{ value: "+64 this week", isPositive: true }}
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
          <p className="text-muted-foreground">No projects found matching your search</p>
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
