import { ProjectTypeChart } from '../ProjectTypeChart';

export default function ProjectTypeChartExample() {
  const sampleData = [
    { type: "Packaging", count: 8 },
    { type: "Energy", count: 5 },
    { type: "Sourcing", count: 6 },
    { type: "Waste", count: 3 },
    { type: "Water", count: 2 },
  ];

  return (
    <div className="p-6 max-w-2xl">
      <ProjectTypeChart data={sampleData} />
    </div>
  );
}
