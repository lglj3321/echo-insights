import { useState } from "react";
import { useRoute, Link } from "wouter";
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
  Minus
} from "lucide-react";

interface ResponseData {
  id: string;
  questionText: string;
  answer: string;
  rating?: number;
  timestamp: string;
  sentiment?: "positive" | "negative" | "neutral";
}

interface QuestionAnalysis {
  question: string;
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
  const [, params] = useRoute("/feedback/:id");
  const surveyId = params?.id;

  // Mock survey database - keyed by ID
  const surveyDatabase: Record<string, any> = {
    "1": {
      id: "1",
      title: "Packaging Sustainability Feedback",
      projectTitle: "100% Recycled Packaging Initiative",
      status: "completed" as const,
      totalResponses: 150,
      targetResponses: 150,
      createdAt: "2024-10-15",
      completedAt: "2024-11-01",
      trustScore: 8.4,
      satisfactionScore: 8.7,
      npsScore: 72,
      npsBreakdown: {
        promoters: 120, // 80%
        passives: 18,   // 12%
        detractors: 12, // 8%
      },
      sentimentBreakdown: {
        positive: 117,  // 78%
        neutral: 24,    // 16%
        negative: 9,    // 6%
      },
    },
    "2": {
      id: "2",
      title: "Solar Energy Consumer Trust Survey",
      projectTitle: "Solar Panel Installation",
      status: "completed" as const,
      totalResponses: 150,
      targetResponses: 150,
      createdAt: "2024-09-20",
      completedAt: "2024-10-01",
      trustScore: 8.4,
      satisfactionScore: 8.7,
      npsScore: 72,
      npsBreakdown: {
        promoters: 120, // 80%
        passives: 18,   // 12%
        detractors: 12, // 8%
      },
      sentimentBreakdown: {
        positive: 117,  // 78%
        neutral: 24,    // 16%
        negative: 9,    // 6%
      },
    },
    "3": {
      id: "3",
      title: "Local Sourcing Perception Study",
      projectTitle: "Local Sourcing Program",
      status: "completed" as const,
      totalResponses: 203,
      targetResponses: 200,
      createdAt: "2024-09-01",
      completedAt: "2024-09-25",
      trustScore: 7.9,
      satisfactionScore: 8.2,
      npsScore: 65,
      npsBreakdown: {
        promoters: 146, // 72% (rounded)
        passives: 43,   // 21%
        detractors: 14, // 7%
      },
      sentimentBreakdown: {
        positive: 151,  // 74%
        neutral: 38,    // 19%
        negative: 14,   // 7%
      },
    },
  };

  const survey = surveyId && surveyDatabase[surveyId];

  // Question analysis data by survey ID
  const questionAnalysisDatabase: Record<string, QuestionAnalysis[]> = {
    "1": [
      {
        question: "How satisfied are you with the sustainability of our packaging?",
        responses: 150,
        distribution: [
          { answer: "Very Satisfied", count: 65, percentage: 43 },
          { answer: "Satisfied", count: 52, percentage: 35 },
          { answer: "Neutral", count: 23, percentage: 15 },
          { answer: "Dissatisfied", count: 7, percentage: 5 },
          { answer: "Very Dissatisfied", count: 3, percentage: 2 },
        ],
        averageRating: 8.3,
        sentimentBreakdown: { positive: 117, neutral: 23, negative: 10 },
      },
      {
        question: "Would you prefer products with biodegradable packaging?",
        responses: 150,
        distribution: [
          { answer: "Definitely Yes", count: 95, percentage: 63 },
          { answer: "Probably Yes", count: 38, percentage: 25 },
          { answer: "Not Sure", count: 12, percentage: 8 },
          { answer: "Probably No", count: 3, percentage: 2 },
          { answer: "Definitely No", count: 2, percentage: 1 },
        ],
        averageRating: 9.1,
        sentimentBreakdown: { positive: 133, neutral: 12, negative: 5 },
      },
      {
        question: "How important is recyclable packaging in your purchase decision?",
        responses: 150,
        distribution: [
          { answer: "Extremely Important", count: 72, percentage: 48 },
          { answer: "Very Important", count: 48, percentage: 32 },
          { answer: "Moderately Important", count: 22, percentage: 15 },
          { answer: "Slightly Important", count: 6, percentage: 4 },
          { answer: "Not Important", count: 2, percentage: 1 },
        ],
        averageRating: 8.8,
        sentimentBreakdown: { positive: 120, neutral: 22, negative: 8 },
      },
    ],
    "2": [
      {
        question: "How aware are you of our renewable energy initiatives?",
        responses: 150,
        distribution: [
          { answer: "Very Aware", count: 58, percentage: 39 },
          { answer: "Somewhat Aware", count: 62, percentage: 41 },
          { answer: "Not Very Aware", count: 22, percentage: 15 },
          { answer: "Not Aware at All", count: 8, percentage: 5 },
        ],
        averageRating: 7.9,
        sentimentBreakdown: { positive: 120, neutral: 22, negative: 8 },
      },
      {
        question: "Do our energy-saving efforts influence your trust in our brand?",
        responses: 150,
        distribution: [
          { answer: "Significantly", count: 75, percentage: 50 },
          { answer: "Moderately", count: 48, percentage: 32 },
          { answer: "Slightly", count: 18, percentage: 12 },
          { answer: "Not at All", count: 9, percentage: 6 },
        ],
        averageRating: 8.6,
        sentimentBreakdown: { positive: 123, neutral: 18, negative: 9 },
      },
      {
        question: "Would you recommend our brand based on our sustainability efforts?",
        responses: 150,
        distribution: [
          { answer: "Definitely Yes", count: 82, percentage: 55 },
          { answer: "Probably Yes", count: 45, percentage: 30 },
          { answer: "Not Sure", count: 15, percentage: 10 },
          { answer: "Probably No", count: 5, percentage: 3 },
          { answer: "Definitely No", count: 3, percentage: 2 },
        ],
        averageRating: 8.9,
        sentimentBreakdown: { positive: 127, neutral: 15, negative: 8 },
      },
    ],
    "3": [
      {
        question: "How important is local sourcing to you?",
        responses: 203,
        distribution: [
          { answer: "Extremely Important", count: 88, percentage: 43 },
          { answer: "Very Important", count: 71, percentage: 35 },
          { answer: "Moderately Important", count: 32, percentage: 16 },
          { answer: "Slightly Important", count: 8, percentage: 4 },
          { answer: "Not Important", count: 4, percentage: 2 },
        ],
        averageRating: 8.5,
        sentimentBreakdown: { positive: 159, neutral: 32, negative: 12 },
      },
      {
        question: "Do you value products with ethical supply chains?",
        responses: 203,
        distribution: [
          { answer: "Strongly Agree", count: 105, percentage: 52 },
          { answer: "Agree", count: 68, percentage: 33 },
          { answer: "Neutral", count: 22, percentage: 11 },
          { answer: "Disagree", count: 6, percentage: 3 },
          { answer: "Strongly Disagree", count: 2, percentage: 1 },
        ],
        averageRating: 8.7,
        sentimentBreakdown: { positive: 173, neutral: 22, negative: 8 },
      },
      {
        question: "How much do you trust our sourcing practices?",
        responses: 203,
        distribution: [
          { answer: "Completely Trust", count: 62, percentage: 31 },
          { answer: "Mostly Trust", count: 89, percentage: 44 },
          { answer: "Somewhat Trust", count: 38, percentage: 19 },
          { answer: "Don't Trust Much", count: 10, percentage: 5 },
          { answer: "Don't Trust at All", count: 4, percentage: 2 },
        ],
        averageRating: 7.8,
        sentimentBreakdown: { positive: 151, neutral: 38, negative: 14 },
      },
    ],
  };

  const mockQuestionAnalysis = (surveyId && questionAnalysisDatabase[surveyId]) || [];

  // Individual responses by survey ID
  const individualResponsesDatabase: Record<string, ResponseData[]> = {
    "1": [
      {
        id: "1",
        questionText: "How satisfied are you with the sustainability of our packaging?",
        answer: "Very Satisfied",
        rating: 9,
        timestamp: "2024-10-16 14:23:00",
        sentiment: "positive",
      },
      {
        id: "2",
        questionText: "Would you prefer products with biodegradable packaging?",
        answer: "Definitely Yes",
        rating: 10,
        timestamp: "2024-10-16 14:23:15",
        sentiment: "positive",
      },
      {
        id: "3",
        questionText: "How important is recyclable packaging in your purchase decision?",
        answer: "Extremely Important",
        rating: 10,
        timestamp: "2024-10-16 14:23:30",
        sentiment: "positive",
      },
      {
        id: "4",
        questionText: "How satisfied are you with the sustainability of our packaging?",
        answer: "Satisfied",
        rating: 8,
        timestamp: "2024-10-17 09:15:00",
        sentiment: "positive",
      },
      {
        id: "5",
        questionText: "Would you prefer products with biodegradable packaging?",
        answer: "Probably Yes",
        rating: 8,
        timestamp: "2024-10-17 09:15:20",
        sentiment: "positive",
      },
    ],
    "2": [
      {
        id: "1",
        questionText: "How aware are you of our renewable energy initiatives?",
        answer: "Very Aware",
        rating: 9,
        timestamp: "2024-09-21 10:30:00",
        sentiment: "positive",
      },
      {
        id: "2",
        questionText: "Do our energy-saving efforts influence your trust in our brand?",
        answer: "Significantly",
        rating: 9,
        timestamp: "2024-09-21 10:30:45",
        sentiment: "positive",
      },
      {
        id: "3",
        questionText: "Would you recommend our brand based on our sustainability efforts?",
        answer: "Definitely Yes",
        rating: 10,
        timestamp: "2024-09-21 10:31:10",
        sentiment: "positive",
      },
      {
        id: "4",
        questionText: "How aware are you of our renewable energy initiatives?",
        answer: "Somewhat Aware",
        rating: 7,
        timestamp: "2024-09-22 15:20:00",
        sentiment: "neutral",
      },
      {
        id: "5",
        questionText: "Do our energy-saving efforts influence your trust in our brand?",
        answer: "Moderately",
        rating: 8,
        timestamp: "2024-09-22 15:20:30",
        sentiment: "positive",
      },
    ],
    "3": [
      {
        id: "1",
        questionText: "How important is local sourcing to you?",
        answer: "Extremely Important",
        rating: 9,
        timestamp: "2024-09-05 12:15:00",
        sentiment: "positive",
      },
      {
        id: "2",
        questionText: "Do you value products with ethical supply chains?",
        answer: "Strongly Agree",
        rating: 10,
        timestamp: "2024-09-05 12:15:30",
        sentiment: "positive",
      },
      {
        id: "3",
        questionText: "How much do you trust our sourcing practices?",
        answer: "Completely Trust",
        rating: 9,
        timestamp: "2024-09-05 12:16:00",
        sentiment: "positive",
      },
      {
        id: "4",
        questionText: "How important is local sourcing to you?",
        answer: "Very Important",
        rating: 8,
        timestamp: "2024-09-06 09:45:00",
        sentiment: "positive",
      },
      {
        id: "5",
        questionText: "Do you value products with ethical supply chains?",
        answer: "Agree",
        rating: 8,
        timestamp: "2024-09-06 09:45:40",
        sentiment: "positive",
      },
    ],
  };

  const mockIndividualResponses = (surveyId && individualResponsesDatabase[surveyId]) || [];

  const getNPSCategory = (score: number): string => {
    if (score >= 9) return "Promoter";
    if (score >= 7) return "Passive";
    return "Detractor";
  };

  const getNPSColor = (score: number): string => {
    if (score >= 9) return "text-primary";
    if (score >= 7) return "text-chart-2";
    return "text-destructive";
  };

  const downloadCSV = () => {
    const headers = ["Question", "Answer", "Rating", "Timestamp", "Sentiment"];
    const rows = mockIndividualResponses.map(r => [
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

  if (!surveyId || !survey) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold">Survey not found</p>
          <p className="text-muted-foreground">The requested survey could not be found.</p>
          <Link href="/feedback">
            <Button variant="outline" className="mt-4">
              Back to Feedback
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
            <Badge variant="secondary">Completed</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Project: {survey.projectTitle}
          </p>
          <p className="text-sm text-muted-foreground">
            {new Date(survey.createdAt).toLocaleDateString()} - {new Date(survey.completedAt).toLocaleDateString()}
          </p>
        </div>
        <Button variant="outline" onClick={downloadCSV} data-testid="button-export-csv">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-3xl font-bold font-mono">{survey.totalResponses}</p>
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
                <p className="text-3xl font-bold font-mono text-primary">{survey.trustScore}</p>
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
                <p className="text-3xl font-bold font-mono text-chart-3">{survey.satisfactionScore}</p>
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
                    {Math.round((survey.npsBreakdown.promoters / survey.totalResponses) * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Promoters (9-10)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {survey.npsBreakdown.promoters} responses
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg border bg-muted">
                  <Minus className="h-6 w-6 mx-auto mb-2 text-chart-2" />
                  <p className="text-2xl font-bold font-mono text-chart-2">
                    {Math.round((survey.npsBreakdown.passives / survey.totalResponses) * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Passives (7-8)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {survey.npsBreakdown.passives} responses
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg border border-destructive bg-destructive/5">
                  <ThumbsDown className="h-6 w-6 mx-auto mb-2 text-destructive" />
                  <p className="text-2xl font-bold font-mono text-destructive">
                    {Math.round((survey.npsBreakdown.detractors / survey.totalResponses) * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Detractors (0-6)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {survey.npsBreakdown.detractors} responses
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
                  Calculation: % Promoters ({Math.round((survey.npsBreakdown.promoters / survey.totalResponses) * 100)}%) - % Detractors ({Math.round((survey.npsBreakdown.detractors / survey.totalResponses) * 100)}%) = {survey.npsScore}
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
                      {Math.round((survey.sentimentBreakdown.positive / survey.totalResponses) * 100)}%
                    </span>
                  </div>
                  <Progress value={(survey.sentimentBreakdown.positive / survey.totalResponses) * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-chart-2" />
                      <span>Neutral</span>
                    </div>
                    <span className="font-semibold">
                      {Math.round((survey.sentimentBreakdown.neutral / survey.totalResponses) * 100)}%
                    </span>
                  </div>
                  <Progress value={(survey.sentimentBreakdown.neutral / survey.totalResponses) * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-destructive" />
                      <span>Negative</span>
                    </div>
                    <span className="font-semibold">
                      {Math.round((survey.sentimentBreakdown.negative / survey.totalResponses) * 100)}%
                    </span>
                  </div>
                  <Progress value={(survey.sentimentBreakdown.negative / survey.totalResponses) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          {mockQuestionAnalysis.map((qa, idx) => (
            <Card key={idx} data-testid={`question-analysis-${idx}`}>
              <CardHeader>
                <CardTitle className="text-lg">{qa.question}</CardTitle>
                <CardDescription>
                  {qa.responses} responses • Average rating: {qa.averageRating?.toFixed(1) || "N/A"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {qa.distribution.map((dist, distIdx) => (
                    <div key={distIdx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{dist.answer}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{dist.count}</span>
                          <span className="text-muted-foreground">({dist.percentage}%)</span>
                        </div>
                      </div>
                      <Progress value={dist.percentage} className="h-2" />
                    </div>
                  ))}
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
          ))}
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual Responses</CardTitle>
              <CardDescription>
                Showing {mockIndividualResponses.length} most recent responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockIndividualResponses.map((response, idx) => (
                  <div
                    key={response.id}
                    className="p-4 rounded-lg border hover-elevate"
                    data-testid={`response-${idx}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <p className="text-sm font-medium flex-1">{response.questionText}</p>
                      <div className="flex items-center gap-2">
                        {response.rating && (
                          <Badge variant="outline" className={getNPSColor(response.rating)}>
                            {response.rating}/10 • {getNPSCategory(response.rating)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm mb-2">
                      <span className="font-semibold">Answer:</span> {response.answer}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {response.timestamp}
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
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
