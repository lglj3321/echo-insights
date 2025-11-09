import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, User, CheckCircle2 } from "lucide-react";

export interface MetricItem {
  metricName: string;
  value: string;
  source: "user" | "file";
}

interface MetricsSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: MetricItem[];
  onSubmit: (selectedMetrics: MetricItem[]) => void;
}

export function MetricsSelectionDialog({
  open,
  onOpenChange,
  metrics,
  onSubmit,
}: MetricsSelectionDialogProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<Set<number>>(
    new Set(metrics.map((_, index) => index))
  );

  const toggleMetric = (index: number) => {
    const newSelected = new Set(selectedMetrics);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedMetrics(newSelected);
  };

  const handleSubmit = () => {
    const selected = metrics.filter((_, index) => selectedMetrics.has(index));
    onSubmit(selected);
    onOpenChange(false);
  };

  const userMetrics = metrics.filter(m => m.source === "user");
  const fileMetrics = metrics.filter(m => m.source === "file");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Select Project Metrics
          </DialogTitle>
          <DialogDescription>
            Review and select the metrics you want to track for this project.
            Metrics have been extracted from your input and uploaded file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {userMetrics.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Manually Entered Metrics</h3>
                <Badge variant="outline" className="ml-auto">
                  {userMetrics.length} metric{userMetrics.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="space-y-2">
                {metrics.map((metric, index) => {
                  if (metric.source !== "user") return null;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border hover-elevate"
                      data-testid={`metric-user-${index}`}
                    >
                      <Checkbox
                        checked={selectedMetrics.has(index)}
                        onCheckedChange={() => toggleMetric(index)}
                        data-testid={`checkbox-metric-${index}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{metric.metricName}</p>
                        <p className="text-sm text-muted-foreground">{metric.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {userMetrics.length > 0 && fileMetrics.length > 0 && <Separator />}

          {fileMetrics.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Extracted from File</h3>
                <Badge variant="outline" className="ml-auto">
                  {fileMetrics.length} metric{fileMetrics.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="space-y-2">
                {metrics.map((metric, index) => {
                  if (metric.source !== "file") return null;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border hover-elevate"
                      data-testid={`metric-file-${index}`}
                    >
                      <Checkbox
                        checked={selectedMetrics.has(index)}
                        onCheckedChange={() => toggleMetric(index)}
                        data-testid={`checkbox-metric-${index}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{metric.metricName}</p>
                        <p className="text-sm text-muted-foreground">{metric.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {metrics.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No metrics available</p>
              <p className="text-sm mt-1">You can add metrics later in project settings</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full gap-2">
            <p className="text-sm text-muted-foreground">
              {selectedMetrics.size} of {metrics.length} metrics selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-metrics"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={selectedMetrics.size === 0}
                data-testid="button-submit-metrics"
              >
                Confirm Metrics
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
