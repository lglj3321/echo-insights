import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SurveyQuestion } from "@/components/SurveyQuestion";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getQueryFn, apiRequest, authFetch } from "@/lib/queryClient";
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
  
  // Generate a unique sessionId for this survey completion
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(7)}`);

  // Get projectId from URL params or props
  const projectId = propProjectId || (params as any)?.projectId;

  // Fetch survey questions from API
  const { data: questions = [], isLoading, error } = useQuery<SurveyQuestionType[]>({
    queryKey: ['/api/projects', projectId, 'survey-questions'],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await authFetch(`/api/projects/${projectId}/survey-questions`, {
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
      
      // Get token from localStorage
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await authFetch("/api/survey-responses", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          projectId,
          questionId: data.questionId,
          answer: String(data.answer || ""),
          numericValue: data.numericValue !== undefined ? data.numericValue : null,
          sessionId, // Include sessionId to group responses from same survey completion
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to submit response" }));
        const error = new Error(errorData.error || "Failed to submit response");
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }
      
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

    // Check if answer is provided
    if (answers[currentQ.id] === undefined || answers[currentQ.id] === "") {
      toast({
        title: "Answer Required",
        description: "Please provide an answer before continuing.",
        variant: "destructive",
      });
      return;
    }

    // Submit current answer
    // For choice questions, answer is the selected option string
    // For rating/scale questions, answer is the numeric value as string, and we also set numericValue
    const answerValue = answers[currentQ.id];
    const numericValue = typeof answerValue === "number" 
      ? answerValue 
      : undefined;
    
    // For choice questions, use the option text; for numeric questions, convert to string
    const answerText = currentQ.type === "choice" 
      ? String(answerValue) // Choice: use the option text directly
      : typeof answerValue === "number" 
        ? String(answerValue) // Rating/Scale: convert number to string
        : String(answerValue || ""); // Fallback

    try {
      await submitResponseMutation.mutateAsync({
        questionId: currentQ.id,
        answer: answerText,
        numericValue,
      });
    } catch (error: any) {
      console.error("Failed to submit answer:", error);
      
      // Extract error message
      let errorMessage = "Failed to save your answer. Please try again.";
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Check for validation errors
      if (error?.response?.data?.details) {
        const details = error.response.data.details;
        errorMessage = `Validation error: ${details.map((d: any) => d.message).join(", ")}`;
      }
      
      // Check for invalid option error
      if (error?.response?.data?.validOptions) {
        errorMessage = `Invalid option selected. Please choose from: ${error.response.data.validOptions.join(", ")}`;
      }
      
      toast({
        title: "Submission Error",
        description: errorMessage,
        variant: "destructive",
      });
      return; // Don't continue if submission fails
    }

    // Move to next question or complete
    if (currentQuestion < formattedQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setIsComplete(true);
      toast({
        title: "Survey Completed",
        description: "Thank you for your feedback! Your responses have been saved.",
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
          <CardContent className="pt-6 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Thank You!</h2>
              <p className="text-muted-foreground text-lg">
                Your feedback has been submitted successfully.
              </p>
              <p className="text-sm text-muted-foreground">
                We appreciate your time in helping us make more sustainable choices.
              </p>
            </div>
            <div className="pt-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                You've completed {formattedQuestions.length} question{formattedQuestions.length !== 1 ? 's' : ''}
              </p>
              <Button
                onClick={() => {
                  setCurrentQuestion(0);
                  setAnswers({});
                  setIsComplete(false);
                }}
                variant="outline"
                data-testid="button-restart"
                className="w-full"
              >
                Take Another Survey
              </Button>
            </div>
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

