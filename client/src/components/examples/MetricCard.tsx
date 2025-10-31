import { MetricCard } from '../MetricCard';
import { FolderKanban, Users, TrendingUp, Leaf } from 'lucide-react';

export default function MetricCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
      <MetricCard
        title="Total Projects"
        value="24"
        icon={FolderKanban}
        subtitle="Active sustainability initiatives"
        trend={{ value: "+3 this month", isPositive: true }}
      />
      <MetricCard
        title="Consumer Responses"
        value="1,847"
        icon={Users}
        subtitle="Feedback collected"
        trend={{ value: "+12% this week", isPositive: true }}
      />
      <MetricCard
        title="Avg. Feedback Score"
        value="4.2"
        icon={TrendingUp}
        subtitle="Out of 5.0"
      />
      <MetricCard
        title="CO₂ Reduction"
        value="3.2T"
        icon={Leaf}
        subtitle="Estimated annual impact"
        trend={{ value: "+0.8T planned", isPositive: true }}
      />
    </div>
  );
}
