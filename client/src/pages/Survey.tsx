import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SurveyQuestion } from "@/components/SurveyQuestion";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SurveyQuestion as SurveyQuestionType } from "@shared/schema";

interface SurveyProps {
  projectId?: string;
}

export default function Survey({ projectId: propProjectId }: SurveyProps) {
  const [, params] = useLocation();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [isComplete, setIsComplete] = useState(false);

  // Get projectId from URL params or props
  const projectId = propProjectId || (params as any)?.projectId;

  // Fetch survey questions from API
  const { data: questions = [], isLoading, error } = useQuery<SurveyQuestionType[]>({
    queryKey: ['/api/projects', projectId, 'survey-questions'],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await fetch(`/api/projects/${projectId}/survey-questions`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated");
        }
        throw new Error("Failed to load survey questions");
      }
      return response.json();
    },
    enabled: !!projectId,
    retry: false,
  });

  // Submit survey response mutation
  const submitResponseMutation = useMutation({
    mutationFn: async (data: { questionId: string; answer: number | string; numericValue?: number }) => {
      if (!projectId) throw new Error("Project ID is required");
      
      const response = await apiRequest("POST", "/api/survey-responses", {
        projectId,
        questionId: data.questionId,
        answer: String(data.answer),
        numericValue: data.numericValue,
      });
      return response.json();
    },
  });

  // Convert database question to component format
  const formatQuestion = (q: SurveyQuestionType) => {
    const questionType = q.questionType.toLowerCase();
    let type: "scale" | "rating" | "choice" = "scale";
    let options: string[] | undefined;

    if (questionType === "rating" || questionType === "star") {
      type = "rating";
    } else if (questionType === "choice" || questionType === "multiple" || questionType === "select") {
      type = "choice";
      options = q.options || [];
    } else {
      type = "scale";
    }

    return {
      id: q.id,
      text: q.questionText,
      type,
      options,
    };
  };

  const formattedQuestions = questions.map(formatQuestion);

  const handleAnswer = (questionId: string, answer: number | string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = async () => {
    const currentQ = formattedQuestions[currentQuestion];
    if (!currentQ) return;

    // Submit current answer
    const numericValue = typeof answers[currentQ.id] === "number" 
      ? answers[currentQ.id] as number 
      : undefined;

    try {
      await submitResponseMutation.mutateAsync({
        questionId: currentQ.id,
        answer: answers[currentQ.id] || "",
        numericValue,
      });
    } catch (error) {
      console.error("Failed to submit answer:", error);
      // Continue even if submission fails
    }

    if (currentQuestion < formattedQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setIsComplete(true);
      toast({
        title: "Survey Completed",
        description: "Thank you for your feedback!",
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading survey questions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error || !projectId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-lg font-semibold">Survey Not Found</p>
            <p className="text-muted-foreground">
              {error ? "Failed to load survey questions" : "No project ID provided"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show empty state
  if (formattedQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-lg font-semibold">No Questions Available</p>
            <p className="text-muted-foreground">
              This survey doesn't have any questions yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">Thank You!</h2>
            <p className="text-muted-foreground">
              Your feedback has been submitted successfully. We appreciate your time in helping us
              make more sustainable choices.
            </p>
            <Button
              onClick={() => {
                setCurrentQuestion(0);
                setAnswers({});
                setIsComplete(false);
              }}
              variant="outline"
              data-testid="button-restart"
            >
              Take Another Survey
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SurveyQuestion
      projectTitle="Survey"
      question={formattedQuestions[currentQuestion]}
      questionNumber={currentQuestion + 1}
      totalQuestions={formattedQuestions.length}
      onAnswer={handleAnswer}
      onNext={handleNext}
    />
  );
}
