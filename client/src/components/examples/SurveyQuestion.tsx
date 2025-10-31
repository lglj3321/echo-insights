import { SurveyQuestion } from '../SurveyQuestion';

export default function SurveyQuestionExample() {
  const sampleQuestion = {
    id: "q1",
    text: "How much does using 100% recycled plastic influence your decision to buy this product?",
    type: "scale" as const,
  };

  return (
    <SurveyQuestion
      projectTitle="100% Recycled Packaging Initiative"
      question={sampleQuestion}
      questionNumber={1}
      totalQuestions={3}
      onAnswer={(id, answer) => console.log('Answer:', id, answer)}
      onNext={() => console.log('Next question')}
    />
  );
}
