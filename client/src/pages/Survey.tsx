import { useState } from "react";
import { SurveyQuestion } from "@/components/SurveyQuestion";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Survey() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [isComplete, setIsComplete] = useState(false);

  // TODO: Remove mock data - load actual questions from API
  const questions = [
    {
      id: "q1",
      text: "How much does using 100% recycled plastic influence your decision to buy this product?",
      type: "scale" as const,
    },
    {
      id: "q2",
      text: "How likely are you to recommend this product to others?",
      type: "rating" as const,
    },
    {
      id: "q3",
      text: "Which sustainability factor matters most to you?",
      type: "choice" as const,
      options: [
        "Recyclable packaging",
        "Lower carbon footprint",
        "Local sourcing",
        "Water conservation",
      ],
    },
  ];

  const handleAnswer = (questionId: string, answer: number | string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    console.log('Answer recorded:', { questionId, answer });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setIsComplete(true);
      console.log('Survey completed:', answers);
    }
  };

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
      projectTitle="100% Recycled Packaging Initiative"
      question={questions[currentQuestion]}
      questionNumber={currentQuestion + 1}
      totalQuestions={questions.length}
      onAnswer={handleAnswer}
      onNext={handleNext}
    />
  );
}
