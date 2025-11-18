import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Clock,
  Download,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Loader2
} from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface ResponseData {
  id: string;
  questionText: string;
  questionType?: string;
  answer: string;
  rating?: number;
  npsCategory?: "Promoter" | "Passive" | "Detractor";
  timestamp: string;
  sentiment?: "positive" | "negative" | "neutral";
}

interface QuestionAnalysis {
  question: string;
  questionType?: string;
  options?: string[];
  responses: number;
  distribution: {
    answer: string;
    count: number;
    percentage: number;
  }[];
  averageRating?: number;
  sentimentBreakdown?: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export default function SurveyResults() {
  const { user } = useAuth();
  const [, params] = useRoute("/feedback/:id");
  const surveyId = params?.id;

  // Fetch survey results from API with auto-refresh
  const { data: survey, isLoading: isLoadingSurvey, error: surveyError, refetch } = useQuery({
    queryKey: ['/api/surveys', surveyId, 'results'],
    queryFn: async () => {
      if (!surveyId) throw new Error("Survey ID is required");
      
      // Get token from localStorage
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/surveys/${surveyId}/results`, {
        credentials: "include",
        headers,
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Survey not found");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load survey results");
      }
      return response.json();
    },
    enabled: !!user && !!surveyId,
    retry: false,
    refetchInterval: 3000, // Auto-refresh every 3 seconds to show new responses
  });

  // Fetch individual responses with auto-refresh
  const { data: individualResponses = [], isLoading: isLoadingResponses } = useQuery<ResponseData[]>({
    queryKey: ['/api/surveys', surveyId, 'responses'],
    queryFn: async () => {
      if (!surveyId) return [];
      
      // Get token from localStorage
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/surveys/${surveyId}/responses`, {
        credentials: "include",
        headers,
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user && !!surveyId && !!survey,
    retry: false,
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  const isLoading = isLoadingSurvey || isLoadingResponses;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading survey results...</p>
        </div>
      </div>
    );
  }

  if (surveyError || !surveyId || !survey) {
    const errorMessage = surveyError instanceof Error 
      ? surveyError.message 
      : surveyError 
        ? "Failed to load survey results" 
        : "The requested survey could not be found.";
    
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-2xl font-bold">Survey not found</p>
          <p className="text-muted-foreground">
            {errorMessage}
          </p>
          <p className="text-sm text-muted-foreground">
            Make sure the survey exists and you have permission to view it.
          </p>
          <Link href="/feedback">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Feedback
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Use real question analysis from API
  const questionAnalysis = survey.questionAnalysis || [];

  // Helper to convert 1-5 scale to 0-10 scale for NPS classification
  const convertToNPSScale = (score: number): number => {
    // If score is on 1-5 scale, convert to 0-10 scale
    if (score >= 1 && score <= 5) {
      return (score - 1) * 2 + 2; // Map: 5->10, 4->8, 3->6, 2->4, 1->2
    }
    // If already on 0-10 scale, use as is
    return Math.max(0, Math.min(10, score));
  };

  const getNPSCategory = (score: number): string => {
    const npsScore = convertToNPSScale(score);
    if (npsScore >= 9) return "Promoter";
    if (npsScore >= 7) return "Passive";
    return "Detractor";
  };

  const getNPSColor = (score: number): string => {
    const npsScore = convertToNPSScale(score);
    if (npsScore >= 9) return "text-primary";
    if (npsScore >= 7) return "text-chart-2";
    return "text-destructive";
  };

  const downloadCSV = () => {
    const headers = ["Question", "Answer", "Rating", "Timestamp", "Sentiment"];
    const rows = individualResponses.map(r => [
      r.questionText,
      r.answer,
      r.rating?.toString() || "",
      r.timestamp,
      r.sentiment || ""
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `survey-results-${survey.title.replace(/\s+/g, "-").toLowerCase()}.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center gap-4">
        <Link href="/feedback">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-4xl font-bold">{survey.title}</h1>
            <Badge variant={survey.status === "completed" ? "secondary" : "outline"}>
              {survey.status === "completed" ? "Completed" : "Gathering"}
            </Badge>
            {refetch && (
              <Badge variant="outline" className="text-xs">
                Auto-refreshing...
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Project: {survey.projectTitle}
          </p>
          <p className="text-sm text-muted-foreground">
            Created: {new Date(survey.createdAt).toLocaleDateString()}
            {survey.completedAt && ` • Completed: ${new Date(survey.completedAt).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch?.()} data-testid="button-refresh">
            <Loader2 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={downloadCSV} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-3xl font-bold font-mono">{survey.totalResponses}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed surveys</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trust Score</p>
                <p className="text-3xl font-bold font-mono text-primary">{survey.trustScore?.toFixed(1) || "N/A"}</p>
                <p className="text-xs text-muted-foreground">out of 10</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
                <p className="text-3xl font-bold font-mono text-chart-3">{survey.satisfactionScore?.toFixed(1) || "N/A"}</p>
                <p className="text-xs text-muted-foreground">out of 10</p>
              </div>
              <BarChart3 className="h-8 w-8 text-chart-3 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">NPS Score</p>
                <p className="text-3xl font-bold font-mono text-chart-2">{survey.npsScore}</p>
                <p className="text-xs text-muted-foreground">Net Promoter</p>
              </div>
              <MessageSquare className="h-8 w-8 text-chart-2 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="questions" data-testid="tab-questions">Question Analysis</TabsTrigger>
          <TabsTrigger value="responses" data-testid="tab-responses">Individual Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>NPS Breakdown</CardTitle>
              <CardDescription>
                Net Promoter Score distribution across all responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg border border-primary bg-primary/5">
                  <ThumbsUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold font-mono text-primary">
                    {survey.totalNumericResponses > 0 
                      ? Math.round((survey.npsBreakdown.promoters / survey.totalNumericResponses) * 100) 
                      : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Promoters (9-10)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {survey.npsBreakdown.promoters} {survey.npsBreakdown.promoters === 1 ? 'response' : 'responses'}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg border bg-muted">
                  <Minus className="h-6 w-6 mx-auto mb-2 text-chart-2" />
                  <p className="text-2xl font-bold font-mono text-chart-2">
                    {survey.totalNumericResponses > 0 
                      ? Math.round((survey.npsBreakdown.passives / survey.totalNumericResponses) * 100) 
                      : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Passives (7-8)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {survey.npsBreakdown.passives} {survey.npsBreakdown.passives === 1 ? 'response' : 'responses'}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg border border-destructive bg-destructive/5">
                  <ThumbsDown className="h-6 w-6 mx-auto mb-2 text-destructive" />
                  <p className="text-2xl font-bold font-mono text-destructive">
                    {survey.totalNumericResponses > 0 
                      ? Math.round((survey.npsBreakdown.detractors / survey.totalNumericResponses) * 100) 
                      : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Detractors (0-6)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {survey.npsBreakdown.detractors} {survey.npsBreakdown.detractors === 1 ? 'response' : 'responses'}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall NPS Score</span>
                  <span className="text-2xl font-bold font-mono text-chart-2">{survey.npsScore}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {survey.totalNumericResponses > 0 ? (
                    <>
                      Calculation: % Promoters ({Math.round((survey.npsBreakdown.promoters / survey.totalNumericResponses) * 100)}%) - % Detractors ({Math.round((survey.npsBreakdown.detractors / survey.totalNumericResponses) * 100)}%) = {survey.npsScore}
                    </>
                  ) : (
                    'No responses yet'
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis</CardTitle>
              <CardDescription>
                Overall sentiment across all survey responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      <span>Positive</span>
                    </div>
                    <span className="font-semibold">
                      {survey.totalSentimentResponses > 0
                        ? Math.round((survey.sentimentBreakdown.positive / survey.totalSentimentResponses) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={survey.totalSentimentResponses > 0 
                      ? (survey.sentimentBreakdown.positive / survey.totalSentimentResponses) * 100 
                      : 0} 
                    className="h-2" 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-chart-2" />
                      <span>Neutral</span>
                    </div>
                    <span className="font-semibold">
                      {survey.totalSentimentResponses > 0
                        ? Math.round((survey.sentimentBreakdown.neutral / survey.totalSentimentResponses) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={survey.totalSentimentResponses > 0 
                      ? (survey.sentimentBreakdown.neutral / survey.totalSentimentResponses) * 100 
                      : 0} 
                    className="h-2" 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-destructive" />
                      <span>Negative</span>
                    </div>
                    <span className="font-semibold">
                      {survey.totalSentimentResponses > 0
                        ? Math.round((survey.sentimentBreakdown.negative / survey.totalSentimentResponses) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={survey.totalSentimentResponses > 0 
                      ? (survey.sentimentBreakdown.negative / survey.totalSentimentResponses) * 100 
                      : 0} 
                    className="h-2" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          {questionAnalysis.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <p className="text-muted-foreground">No question analysis available yet</p>
              </CardContent>
            </Card>
          ) : (
            questionAnalysis.map((qa: QuestionAnalysis, idx: number) => (
            <Card key={idx} data-testid={`question-analysis-${idx}`}>
              <CardHeader>
                <CardTitle className="text-lg">{qa.question}</CardTitle>
                <CardDescription>
                  {qa.responses} responses {qa.averageRating !== undefined && `• Average rating: ${qa.averageRating.toFixed(1)}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Show all options for choice questions */}
                {qa.options && qa.options.length > 0 && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Available Options:</p>
                    <div className="flex flex-wrap gap-2">
                      {qa.options.map((option, optIdx) => {
                        const dist = qa.distribution.find(d => d.answer === option);
                        const hasResponse = dist && dist.count > 0;
                        return (
                          <Badge 
                            key={optIdx} 
                            variant={hasResponse ? "default" : "outline"}
                            className={hasResponse ? "" : "opacity-50"}
                          >
                            {option}
                            {hasResponse && ` (${dist.count})`}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {qa.options && qa.options.length > 0 ? (
                    // For choice questions, show all options in order
                    qa.options.map((option, optIdx) => {
                      const dist = qa.distribution.find(d => d.answer === option) || {
                        answer: option,
                        count: 0,
                        percentage: 0,
                      };
                      return (
                        <div key={optIdx} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className={`font-medium ${dist.count === 0 ? "text-muted-foreground opacity-60" : ""}`}>
                              {dist.answer}
                              {dist.count === 0 && " (No responses)"}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{dist.count}</span>
                              <span className="text-muted-foreground">
                                ({dist.percentage}%)
                              </span>
                            </div>
                          </div>
                          <Progress 
                            value={dist.percentage} 
                            className={`h-2 ${dist.count === 0 ? "opacity-30" : ""}`} 
                          />
                        </div>
                      );
                    })
                  ) : qa.distribution.length > 0 ? (
                    // For non-choice questions, show distribution
                    qa.distribution.map((dist, distIdx) => (
                      <div key={distIdx} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{dist.answer}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{dist.count}</span>
                            <span className="text-muted-foreground">({dist.percentage}%)</span>
                          </div>
                        </div>
                        <Progress value={dist.percentage} className="h-2" />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No responses yet for this question
                    </p>
                  )}
                </div>

                {qa.sentimentBreakdown && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <ThumbsUp className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-xl font-bold font-mono text-primary">{qa.sentimentBreakdown.positive}</p>
                        <p className="text-xs text-muted-foreground">Positive</p>
                      </div>
                      <div>
                        <Minus className="h-5 w-5 mx-auto mb-1 text-chart-2" />
                        <p className="text-xl font-bold font-mono text-chart-2">{qa.sentimentBreakdown.neutral}</p>
                        <p className="text-xs text-muted-foreground">Neutral</p>
                      </div>
                      <div>
                        <ThumbsDown className="h-5 w-5 mx-auto mb-1 text-destructive" />
                        <p className="text-xl font-bold font-mono text-destructive">{qa.sentimentBreakdown.negative}</p>
                        <p className="text-xs text-muted-foreground">Negative</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual Responses</CardTitle>
              <CardDescription>
                Showing {individualResponses.length} most recent responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {individualResponses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No responses available yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {individualResponses.map((response, idx) => {
                    // Get NPS category (use provided or calculate)
                    const npsCategory = response.npsCategory || (response.rating ? getNPSCategory(response.rating) : undefined);
                    const npsColor = response.rating ? getNPSColor(response.rating) : undefined;
                    
                    return (
                      <div
                        key={response.id}
                        className="p-4 rounded-lg border hover-elevate"
                        data-testid={`response-${idx}`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <p className="text-sm font-medium flex-1">{response.questionText}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {response.rating !== undefined && (
                              <Badge variant="outline" className={npsColor}>
                                {response.rating}/10
                              </Badge>
                            )}
                            {npsCategory && (
                              <Badge 
                                variant={npsCategory === "Promoter" ? "default" : npsCategory === "Passive" ? "secondary" : "destructive"}
                                className="text-xs"
                              >
                                {npsCategory === "Promoter" && <ThumbsUp className="h-3 w-3 mr-1" />}
                                {npsCategory === "Detractor" && <ThumbsDown className="h-3 w-3 mr-1" />}
                                {npsCategory === "Passive" && <Minus className="h-3 w-3 mr-1" />}
                                {npsCategory}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-semibold">Answer:</span>{" "}
                            <span className={response.answer ? "" : "text-muted-foreground italic"}>
                              {response.answer || "No answer provided"}
                            </span>
                          </p>
                          {response.questionType && (
                            <p className="text-xs text-muted-foreground">
                              Question Type: {response.questionType}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(response.timestamp).toLocaleString()}
                          </div>
                          {response.sentiment && (
                            <Badge variant="secondary" className="text-xs">
                              {response.sentiment === "positive" && <ThumbsUp className="h-3 w-3 mr-1" />}
                              {response.sentiment === "negative" && <ThumbsDown className="h-3 w-3 mr-1" />}
                              {response.sentiment === "neutral" && <Minus className="h-3 w-3 mr-1" />}
                              {response.sentiment}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
