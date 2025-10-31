import { ImpactCostMatrix } from '../ImpactCostMatrix';

export default function ImpactCostMatrixExample() {
  const sampleProjects = [
    { id: "1", title: "Recycled Packaging", type: "Packaging", estimatedCost: 45000, roi: 18, co2Saved: 2.5, description: "" },
    { id: "2", title: "Solar Panels", type: "Energy", estimatedCost: 120000, roi: 25, co2Saved: 8.2, description: "" },
    { id: "3", title: "Local Sourcing", type: "Sourcing", estimatedCost: 28000, roi: 12, co2Saved: 1.8, description: "" },
    { id: "4", title: "Water Recycling", type: "Water", estimatedCost: 75000, roi: 20, co2Saved: 3.5, description: "" },
    { id: "5", title: "Waste Reduction", type: "Waste", estimatedCost: 35000, roi: 15, co2Saved: 2.1, description: "" },
    { id: "6", title: "Electric Fleet", type: "Logistics", estimatedCost: 95000, roi: 22, co2Saved: 5.8, description: "" },
  ];

  return (
    <div className="p-6 max-w-2xl">
      <ImpactCostMatrix projects={sampleProjects} />
    </div>
  );
}
