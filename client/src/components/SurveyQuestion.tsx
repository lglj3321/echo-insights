import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";

interface Question {
  id: string;
  text: string;
  type: "rating" | "scale" | "choice";
  options?: string[];
}

interface SurveyQuestionProps {
  projectTitle: string;
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (questionId: string, answer: number | string) => void;
  onNext: () => void;
}

export function SurveyQuestion({
  projectTitle,
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  onNext,
}: SurveyQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
  const [sliderValue, setSliderValue] = useState([3]);

  const handleSubmit = () => {
    if (question.type === "scale") {
      onAnswer(question.id, sliderValue[0]);
    } else if (selectedAnswer !== null) {
      onAnswer(question.id, selectedAnswer);
    }
    onNext();
  };

  const progress = (questionNumber / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="w-full bg-card border-b">
        <div className="max-w-2xl mx-auto p-4">
          <h1 className="text-lg font-bold text-primary">Echo Insights</h1>
          <p className="text-xs text-muted-foreground">{projectTitle}</p>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Question {questionNumber} of {totalQuestions}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-1" />
            </div>
            <CardTitle className="text-xl mt-6">{question.text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {question.type === "rating" && (
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant={selectedAnswer === rating ? "default" : "outline"}
                    size="lg"
                    onClick={() => setSelectedAnswer(rating)}
                    className="w-16 h-16 text-lg font-bold"
                    data-testid={`button-rating-${rating}`}
                  >
                    {rating}
                  </Button>
                ))}
              </div>
            )}

            {question.type === "scale" && (
              <div className="space-y-4 px-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Not at all</span>
                  <span>Extremely</span>
                </div>
                <Slider
                  value={sliderValue}
                  onValueChange={setSliderValue}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                  data-testid="slider-scale"
                />
                <div className="text-center">
                  <span className="text-4xl font-bold font-mono">{sliderValue[0]}</span>
                  <span className="text-muted-foreground"> / 5</span>
                </div>
              </div>
            )}

            {question.type === "choice" && question.options && (
              <div className="space-y-2">
                {question.options.map((option, idx) => (
                  <Button
                    key={idx}
                    variant={selectedAnswer === option ? "default" : "outline"}
                    size="lg"
                    onClick={() => setSelectedAnswer(option)}
                    className="w-full min-h-14 text-base justify-start"
                    data-testid={`button-choice-${idx}`}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={question.type !== "scale" && selectedAnswer === null}
              size="lg"
              className="w-full"
              data-testid="button-next"
            >
              {questionNumber === totalQuestions ? "Submit" : "Next"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
