import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";

interface Metric {
  metricName: string;
  value: string;
}

const projectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  estimatedCost: z.coerce.number().min(0, "Cost must be positive"),
  roi: z.coerce.number().min(0, "ROI must be positive"),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => void;
  initialData?: Partial<ProjectFormData>;
}

export function ProjectForm({ onSubmit, initialData }: ProjectFormProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([
    { metricName: "", value: "" }
  ]);
  
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      estimatedCost: initialData?.estimatedCost || 0,
      roi: initialData?.roi || 0,
    },
  });

  // Initialize metrics from initialData when component mounts or initialData changes
  useEffect(() => {
    if (initialData && (initialData as any).metrics && (initialData as any).metrics.length > 0) {
      setMetrics((initialData as any).metrics);
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const addMetric = () => {
    setMetrics([...metrics, { metricName: "", value: "" }]);
  };

  const removeMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index));
  };

  const updateMetric = (index: number, field: 'metricName' | 'value', value: string) => {
    const updated = [...metrics];
    updated[index][field] = value;
    setMetrics(updated);
  };

  const handleFormSubmit = (data: ProjectFormData) => {
    const formDataWithMetrics = {
      ...data,
      metrics: metrics.filter(m => m.metricName && m.value),
      uploadedFile: uploadedFile
    };
    onSubmit(formDataWithMetrics as any);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Sustainability Project</CardTitle>
        <p className="text-sm text-muted-foreground">
          Add details about your new sustainability initiative
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 100% Recycled Packaging"
                      {...field}
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the sustainability initiative..."
                      className="min-h-24"
                      {...field}
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Cost ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        data-testid="input-cost"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected ROI (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        data-testid="input-roi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel>Existing Metrics</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Add custom sustainability metrics for this project
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMetric}
                  data-testid="button-add-metric"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Metric
                </Button>
              </div>

              <div className="space-y-3">
                {metrics.map((metric, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        placeholder="Metric name (e.g., CO₂ Saved)"
                        value={metric.metricName}
                        onChange={(e) => updateMetric(index, 'metricName', e.target.value)}
                        data-testid={`input-metric-name-${index}`}
                      />
                      <Input
                        placeholder="Value (e.g., 2 Tons/Quarter)"
                        value={metric.value}
                        onChange={(e) => updateMetric(index, 'value', e.target.value)}
                        data-testid={`input-metric-value-${index}`}
                      />
                    </div>
                    {metrics.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMetric(index)}
                        data-testid={`button-remove-metric-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <FormLabel>Upload Supporting Documents (Optional)</FormLabel>
              <div className="flex items-center gap-4">
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-2 px-4 h-9 rounded-md border border-input bg-background hover-elevate active-elevate-2 cursor-pointer text-sm"
                  data-testid="label-file-upload"
                >
                  <Upload className="h-4 w-4" />
                  {uploadedFile ? "Change File" : "Upload File"}
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="input-file"
                />
                {uploadedFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span className="truncate max-w-xs">{uploadedFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                      className="h-6 px-2"
                      data-testid="button-remove-file"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload CSV or Excel files to extract metrics (max 10MB)
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" data-testid="button-submit">
                Create Project
              </Button>
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
