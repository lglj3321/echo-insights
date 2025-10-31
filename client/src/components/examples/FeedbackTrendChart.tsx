import { FeedbackTrendChart } from '../FeedbackTrendChart';

export default function FeedbackTrendChartExample() {
  const sampleData = [
    { date: "Jan", score: 3.8 },
    { date: "Feb", score: 4.1 },
    { date: "Mar", score: 4.3 },
    { date: "Apr", score: 4.2 },
    { date: "May", score: 4.6 },
    { date: "Jun", score: 4.5 },
  ];

  return (
    <div className="p-6 max-w-2xl">
      <FeedbackTrendChart
        data={sampleData}
        projectTitle="100% Recycled Packaging"
      />
    </div>
  );
}
