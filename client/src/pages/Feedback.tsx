import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, BarChart3, Users, TrendingUp, Clock, CheckCircle2, QrCode, Download, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface Survey {
  id: string;
  title: string;
  projectId: string;
  projectTitle: string;
  status: "gathering" | "completed";
  responses: number;
  targetResponses?: number;
  trustScore?: number;
  satisfactionScore?: number;
  npsScore?: number;
  createdAt: string;
  completedAt?: string;
  questions: string[];
  qrCodeUrl?: string;
}

const downloadQRCode = (surveyId: string, surveyTitle: string) => {
  const svg = document.getElementById(`qr-${surveyId}`);
  if (svg && svg instanceof SVGSVGElement) {
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement("a");
    link.download = `survey-qr-${surveyTitle.replace(/\s+/g, '-').toLowerCase()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }
};

export default function Feedback() {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Fetch surveys from API
  const { data: surveys = [], isLoading, error } = useQuery<Survey[]>({
    queryKey: ['/api/surveys'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading surveys...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">Error Loading Surveys</p>
          <p className="text-muted-foreground">Failed to load survey data. Please try again.</p>
        </div>
      </div>
    );
  }


  const filteredSurveys = filterStatus === "all"
    ? surveys
    : surveys.filter(s => s.status === filterStatus);

  const stats = {
    total: surveys.length,
    gathering: surveys.filter(s => s.status === "gathering").length,
    completed: surveys.filter(s => s.status === "completed").length,
    avgTrustScore: surveys.filter(s => s.trustScore).length > 0
      ? (surveys
          .filter(s => s.trustScore)
          .reduce((acc, s) => acc + (s.trustScore || 0), 0) / surveys.filter(s => s.trustScore).length).toFixed(1)
      : "0.0",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold">Consumer Feedback</h1>
          <p className="text-muted-foreground mt-1">
            Manage and analyze surveys for gathering consumer insights
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Surveys</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gathering Responses</p>
                <p className="text-3xl font-bold">{stats.gathering}</p>
              </div>
              <Clock className="h-8 w-8 text-chart-2 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Trust Score</p>
                <p className="text-3xl font-bold">{stats.avgTrustScore}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-chart-3 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("all")}
          data-testid="filter-all"
        >
          All Surveys
        </Button>
        <Button
          variant={filterStatus === "gathering" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("gathering")}
          data-testid="filter-gathering"
        >
          Gathering
        </Button>
        <Button
          variant={filterStatus === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterStatus("completed")}
          data-testid="filter-completed"
        >
          Completed
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredSurveys.map((survey) => (
          <Card key={survey.id} data-testid={`survey-card-${survey.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{survey.title}</CardTitle>
                    <Badge variant={survey.status === "gathering" ? "default" : "secondary"}>
                      {survey.status === "gathering" ? "Gathering Responses" : "Completed"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Project: {survey.projectTitle}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created: {new Date(survey.createdAt).toLocaleDateString()}
                    {survey.completedAt && ` • Completed: ${new Date(survey.completedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {survey.qrCodeUrl && (
                    <Card className="p-3">
                      <div className="space-y-2">
                        <QRCodeSVG
                          id={`qr-${survey.id}`}
                          value={survey.qrCodeUrl}
                          size={120}
                          level="H"
                          includeMargin
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => downloadQRCode(survey.id, survey.title)}
                          data-testid={`button-download-qr-${survey.id}`}
                        >
                          <Download className="h-3 w-3 mr-2" />
                          Download QR
                        </Button>
                      </div>
                    </Card>
                  )}
                  <div className="flex flex-col gap-2">
                    <Link href={`/feedback/${survey.id}`}>
                      <Button variant="outline" size="sm" data-testid={`button-view-${survey.id}`}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Results
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {survey.status === "gathering" && survey.targetResponses && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Response Progress</span>
                    <span className="font-medium">
                      {survey.responses} / {survey.targetResponses}
                    </span>
                  </div>
                  <Progress value={(survey.responses / survey.targetResponses) * 100} className="h-2" />
                </div>
              )}

              {survey.status === "completed" && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-2xl font-bold font-mono">{survey.responses}</p>
                    <p className="text-xs text-muted-foreground">Responses</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold font-mono text-primary">{survey.trustScore}</p>
                    <p className="text-xs text-muted-foreground">Trust Score</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <BarChart3 className="h-5 w-5 mx-auto mb-1 text-chart-3" />
                    <p className="text-2xl font-bold font-mono text-chart-3">{survey.satisfactionScore}</p>
                    <p className="text-xs text-muted-foreground">Satisfaction</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <MessageSquare className="h-5 w-5 mx-auto mb-1 text-chart-2" />
                    <p className="text-2xl font-bold font-mono text-chart-2">{survey.npsScore}</p>
                    <p className="text-xs text-muted-foreground">NPS Score</p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-sm font-medium">Survey Questions:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {survey.questions.slice(0, 3).map((q, idx) => (
                    <li key={idx}>• {q}</li>
                  ))}
                  {survey.questions.length > 3 && (
                    <li className="font-medium">+ {survey.questions.length - 3} more questions</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredSurveys.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Surveys Found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {filterStatus === "all"
                  ? "No surveys have been created yet. Create a survey from a project details page."
                  : `No ${filterStatus} surveys found.`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
