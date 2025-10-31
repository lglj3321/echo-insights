import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

interface ProjectQR {
  projectId: string;
  projectTitle: string;
  surveyUrl: string;
}

export default function QRCodes() {
  const [searchQuery, setSearchQuery] = useState("");

  // TODO: Remove mock data - replace with actual API data
  const mockProjectQRs: ProjectQR[] = [
    {
      projectId: "1",
      projectTitle: "100% Recycled Packaging",
      surveyUrl: "https://echo-insights.app/survey/project-1",
    },
    {
      projectId: "2",
      projectTitle: "Solar Energy Installation",
      surveyUrl: "https://echo-insights.app/survey/project-2",
    },
    {
      projectId: "3",
      projectTitle: "Local Sourcing Initiative",
      surveyUrl: "https://echo-insights.app/survey/project-3",
    },
    {
      projectId: "4",
      projectTitle: "Water Recycling System",
      surveyUrl: "https://echo-insights.app/survey/project-4",
    },
  ];

  const filteredProjects = mockProjectQRs.filter(project =>
    project.projectTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">QR Codes</h1>
        <p className="text-muted-foreground mt-1">
          Generate and download QR codes for consumer surveys
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-qr"
        />
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects found matching your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <QRCodeDisplay
              key={project.projectId}
              projectId={project.projectId}
              projectTitle={project.projectTitle}
              surveyUrl={project.surveyUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
