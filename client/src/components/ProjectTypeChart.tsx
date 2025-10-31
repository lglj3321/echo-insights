import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectTypeChartProps {
  data: Array<{ type: string; count: number }>;
}

export function ProjectTypeChart({ data }: ProjectTypeChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  const typeColors: Record<string, string> = {
    Packaging: "fill-chart-1",
    Energy: "fill-chart-2",
    Sourcing: "fill-chart-3",
    Waste: "fill-chart-4",
    Water: "fill-chart-5",
    Logistics: "fill-muted",
  };

  let currentAngle = 0;
  const segments = data.map(item => {
    const percentage = (item.count / total) * 100;
    const angle = (percentage / 100) * 360;
    const segment = {
      ...item,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
    };
    currentAngle += angle;
    return segment;
  });

  const polarToCartesian = (angle: number, radius: number = 40) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: 50 + radius * Math.cos(rad),
      y: 50 + radius * Math.sin(rad),
    };
  };

  const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M 50 50 L ${start.x} ${start.y} A 40 40 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects by Type</CardTitle>
        <p className="text-sm text-muted-foreground">Distribution across categories</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-48 h-48">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {segments.map((segment, idx) => (
                <path
                  key={idx}
                  d={createArc(segment.startAngle, segment.endAngle)}
                  className={`${typeColors[segment.type] || "fill-muted"} hover-elevate cursor-pointer`}
                  opacity="0.9"
                  data-testid={`segment-${segment.type.toLowerCase()}`}
                >
                  <title>{segment.type}: {segment.percentage.toFixed(1)}%</title>
                </path>
              ))}
              <circle cx="50" cy="50" r="20" className="fill-background" />
            </svg>
          </div>
          <div className="flex-1 space-y-2">
            {segments.map((segment) => (
              <div key={segment.type} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm ${typeColors[segment.type] || "fill-muted"}`} />
                  <span className="text-sm">{segment.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-semibold">{segment.count}</span>
                  <span className="text-xs text-muted-foreground">
                    ({segment.percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
