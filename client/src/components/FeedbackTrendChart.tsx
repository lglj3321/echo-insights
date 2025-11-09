import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataPoint {
  date: string;
  score: number;
}

interface FeedbackTrendChartProps {
  data: DataPoint[];
  projectTitle?: string;
}

export function FeedbackTrendChart({ data, projectTitle }: FeedbackTrendChartProps) {
  if (data.length === 0) return null;

  const maxScore = 5;
  const minScore = 0;
  const padding = 10;

  const points = data.map((point, idx) => ({
    x: (idx / (data.length - 1)) * (100 - 2 * padding) + padding,
    y: ((maxScore - point.score) / (maxScore - minScore)) * (100 - 2 * padding) + padding,
    ...point,
  }));

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaData = `${pathData} L ${points[points.length - 1].x} ${100 - padding} L ${points[0].x} ${100 - padding} Z`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Trend</CardTitle>
        {projectTitle && (
          <p className="text-sm text-muted-foreground">{projectTitle}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="w-full aspect-square">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="feedbackGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            
            {[0, 1, 2, 3, 4, 5].map((score) => {
              const y = ((maxScore - score) / (maxScore - minScore)) * (100 - 2 * padding) + padding;
              return (
                <g key={score}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={100 - padding}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="0.3"
                    strokeDasharray="2,2"
                    className="text-border"
                  />
                  <text
                    x={padding - 3}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="text-[3.5px] fill-muted-foreground"
                  >
                    {score}
                  </text>
                </g>
              );
            })}
            
            <path d={areaData} fill="url(#feedbackGradient)" />
            
            <path
              d={pathData}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {points.map((point, idx) => (
              <circle
                key={idx}
                cx={point.x}
                cy={point.y}
                r="1.5"
                className="fill-primary hover-elevate cursor-pointer"
                data-testid={`point-${idx}`}
              >
                <title>{point.date}: {point.score.toFixed(1)}</title>
              </circle>
            ))}
            
            {points.map((point, idx) => (
              <text
                key={idx}
                x={point.x}
                y={100 - padding + 4}
                textAnchor="middle"
                className="text-[3.5px] fill-muted-foreground"
              >
                {point.date}
              </text>
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
