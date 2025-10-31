import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const updateSchema = z.object({
  period: z.string().min(1, "Period is required"),
  year: z.string().min(1, "Year is required"),
  notes: z.string().optional(),
  uploadedFile: z.any().optional(),
});

type UpdateFormData = z.infer<typeof updateSchema>;

interface MetricUpdate {
  name: string;
  value: string;
}

interface ProjectUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  existingMetrics: string[];
  onSubmit: (data: any) => void;
}

export function ProjectUpdateDialog({
  open,
  onOpenChange,
  projectId,
  existingMetrics,
  onSubmit,
}: ProjectUpdateDialogProps) {
  const { toast } = useToast();
  const [metricUpdates, setMetricUpdates] = useState<MetricUpdate[]>([]);
  const [newMetrics, setNewMetrics] = useState<MetricUpdate[]>([]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear - 2 + i).toString());
  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  const form = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      period: "Q1",
      year: currentYear.toString(),
      notes: "",
    },
  });

  const addMetricUpdate = (metricName: string) => {
    if (!metricUpdates.find(m => m.name === metricName)) {
      setMetricUpdates([...metricUpdates, { name: metricName, value: "" }]);
    }
  };

  const updateMetricValue = (metricName: string, value: string) => {
    setMetricUpdates(
      metricUpdates.map(m => 
        m.name === metricName ? { ...m, value } : m
      )
    );
  };

  const removeMetricUpdate = (metricName: string) => {
    setMetricUpdates(metricUpdates.filter(m => m.name !== metricName));
  };

  const addNewMetric = () => {
    setNewMetrics([...newMetrics, { name: "", value: "" }]);
  };

  const updateNewMetric = (index: number, field: 'name' | 'value', value: string) => {
    setNewMetrics(
      newMetrics.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      )
    );
  };

  const removeNewMetric = (index: number) => {
    setNewMetrics(newMetrics.filter((_, i) => i !== index));
  };

  const handleSubmit = (data: UpdateFormData) => {
    const validMetricUpdates = metricUpdates.filter(m => m.value.trim() !== "");
    const validNewMetrics = newMetrics.filter(m => m.name.trim() !== "" && m.value.trim() !== "");

    if (validMetricUpdates.length === 0 && validNewMetrics.length === 0) {
      toast({
        title: "No Data Provided",
        description: "Please add at least one metric update or new metric.",
        variant: "destructive",
      });
      return;
    }

    const updateData = {
      ...data,
      metricUpdates: validMetricUpdates,
      newMetrics: validNewMetrics,
      timestamp: new Date().toISOString(),
    };

    onSubmit(updateData);
    onOpenChange(false);
    
    // Reset form
    form.reset();
    setMetricUpdates([]);
    setNewMetrics([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Project Data
          </DialogTitle>
          <DialogDescription>
            Add new quarterly data to track your project's progress over time. Update existing metrics or add new ones.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-period">
                              <SelectValue placeholder="Select quarter" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {quarters.map((q) => (
                              <SelectItem key={q} value={q}>
                                {q}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-year">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {years.map((y) => (
                              <SelectItem key={y} value={y}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Update Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe what changed in this period..."
                          rows={3}
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="uploadedFile"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Upload Supporting Documents (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="file"
                          accept=".pdf,.xlsx,.csv,.docx"
                          onChange={(e) => onChange(e.target.files?.[0])}
                          data-testid="input-file"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Update Existing Metrics</Label>
                <Badge variant="outline">{existingMetrics.length} available</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {existingMetrics.map((metric) => (
                  <Button
                    key={metric}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addMetricUpdate(metric)}
                    disabled={metricUpdates.some(m => m.name === metric)}
                    data-testid={`button-add-metric-${metric}`}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    {metric}
                  </Button>
                ))}
              </div>

              {metricUpdates.length > 0 && (
                <div className="space-y-2 mt-4">
                  {metricUpdates.map((metric, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        value={metric.name}
                        disabled
                        className="flex-1"
                      />
                      <Input
                        placeholder="New value"
                        value={metric.value}
                        onChange={(e) => updateMetricValue(metric.name, e.target.value)}
                        className="flex-1"
                        data-testid={`input-metric-value-${idx}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMetricUpdate(metric.name)}
                        data-testid={`button-remove-metric-${idx}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Add New Metrics</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewMetric}
                  data-testid="button-add-new-metric"
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Add New Metric
                </Button>
              </div>

              {newMetrics.length > 0 && (
                <div className="space-y-2">
                  {newMetrics.map((metric, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        placeholder="Metric name"
                        value={metric.name}
                        onChange={(e) => updateNewMetric(idx, 'name', e.target.value)}
                        className="flex-1"
                        data-testid={`input-new-metric-name-${idx}`}
                      />
                      <Input
                        placeholder="Value"
                        value={metric.value}
                        onChange={(e) => updateNewMetric(idx, 'value', e.target.value)}
                        className="flex-1"
                        data-testid={`input-new-metric-value-${idx}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeNewMetric(idx)}
                        data-testid={`button-remove-new-metric-${idx}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit-update">
                <Calendar className="h-4 w-4 mr-2" />
                Submit Update
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
