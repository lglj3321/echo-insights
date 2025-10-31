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

const projectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["Packaging", "Energy", "Sourcing", "Waste", "Water", "Logistics"]),
  estimatedCost: z.coerce.number().min(0, "Cost must be positive"),
  roi: z.coerce.number().min(0, "ROI must be positive"),
  co2Saved: z.coerce.number().min(0, "CO₂ saved must be positive"),
  waterSaved: z.coerce.number().min(0).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => void;
  initialData?: Partial<ProjectFormData>;
}

export function ProjectForm({ onSubmit, initialData }: ProjectFormProps) {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      type: initialData?.type || "Packaging",
      estimatedCost: initialData?.estimatedCost || 0,
      roi: initialData?.roi || 0,
      co2Saved: initialData?.co2Saved || 0,
      waterSaved: initialData?.waterSaved || 0,
    },
  });

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-type">
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Packaging">Packaging</SelectItem>
                        <SelectItem value="Energy">Energy</SelectItem>
                        <SelectItem value="Sourcing">Sourcing</SelectItem>
                        <SelectItem value="Waste">Waste</SelectItem>
                        <SelectItem value="Water">Water</SelectItem>
                        <SelectItem value="Logistics">Logistics</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

              <FormField
                control={form.control}
                name="co2Saved"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CO₂ Saved (Tons/Year)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        {...field}
                        data-testid="input-co2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="waterSaved"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Water Saved (Gallons/Year) - Optional</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        data-testid="input-water"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
