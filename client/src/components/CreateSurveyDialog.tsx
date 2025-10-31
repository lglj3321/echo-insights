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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Plus, X } from "lucide-react";

const surveySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  gatheringMethod: z.enum(["duration", "responses"]),
  duration: z.string().optional(),
  responseCount: z.number().optional(),
});

type SurveyFormData = z.infer<typeof surveySchema>;

interface CreateSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectCategory: string;
  onSubmit: (data: any) => void;
}

const RECOMMENDED_QUESTIONS: Record<string, string[]> = {
  Packaging: [
    "How satisfied are you with the sustainability of our packaging?",
    "Would you prefer products with biodegradable packaging?",
    "How important is recyclable packaging in your purchase decision?",
    "Do you find our packaging instructions clear and helpful?",
    "Would you pay more for eco-friendly packaging?",
  ],
  Energy: [
    "How aware are you of our renewable energy initiatives?",
    "Do our energy-saving efforts influence your trust in our brand?",
    "How important is a company's carbon footprint to you?",
    "Would you recommend our brand based on our sustainability efforts?",
    "How satisfied are you with our transparency about energy usage?",
  ],
  Sourcing: [
    "How important is local sourcing to you?",
    "Do you value products with ethical supply chains?",
    "How much do you trust our sourcing practices?",
    "Would you like more information about product origins?",
    "How satisfied are you with our supplier transparency?",
  ],
  Waste: [
    "How satisfied are you with our waste reduction efforts?",
    "Do you notice our zero-waste initiatives?",
    "How likely are you to participate in our recycling programs?",
    "Would you like more information about our waste management?",
    "How important is waste reduction in your brand loyalty?",
  ],
  Water: [
    "How aware are you of our water conservation efforts?",
    "Do our water-saving initiatives impact your purchasing decisions?",
    "How satisfied are you with our environmental responsibility?",
    "Would you like to see more water conservation information?",
    "How much do you trust our water usage reporting?",
  ],
  Logistics: [
    "How satisfied are you with our delivery methods?",
    "Do you value eco-friendly shipping options?",
    "Would you choose slower shipping for reduced emissions?",
    "How important is carbon-neutral delivery to you?",
    "How satisfied are you with our packaging for deliveries?",
  ],
};

export function CreateSurveyDialog({
  open,
  onOpenChange,
  projectId,
  projectCategory,
  onSubmit,
}: CreateSurveyDialogProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");

  const form = useForm<SurveyFormData>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      title: "",
      description: "",
      gatheringMethod: "responses",
      duration: "7",
      responseCount: 100,
    },
  });

  const recommendedQuestions = RECOMMENDED_QUESTIONS[projectCategory] || [];
  const watchGatheringMethod = form.watch("gatheringMethod");

  const toggleQuestion = (question: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(question)) {
      newSelected.delete(question);
    } else {
      newSelected.add(question);
    }
    setSelectedQuestions(newSelected);
  };

  const addCustomQuestion = () => {
    if (newQuestion.trim()) {
      setCustomQuestions([...customQuestions, newQuestion.trim()]);
      setNewQuestion("");
    }
  };

  const removeCustomQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== index));
  };

  const handleSubmit = (data: SurveyFormData) => {
    const allQuestions = [
      ...Array.from(selectedQuestions),
      ...customQuestions,
    ];

    if (allQuestions.length === 0) {
      form.setError("root", {
        message: "Please select or add at least one question",
      });
      return;
    }

    const surveyData = {
      ...data,
      projectId,
      questions: allQuestions,
      createdAt: new Date().toISOString(),
    };

    onSubmit(surveyData);
    onOpenChange(false);
    
    // Reset form
    form.reset();
    setSelectedQuestions(new Set());
    setCustomQuestions([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Create Consumer Feedback Survey
          </DialogTitle>
          <DialogDescription>
            Design a survey to gather consumer feedback about your sustainability project
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Survey Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Packaging Sustainability Feedback" data-testid="input-survey-title" />
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe the purpose of this survey..." rows={3} data-testid="input-survey-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Recommended Questions for {projectCategory}
                </Label>
                <Badge variant="outline">
                  {recommendedQuestions.length} available
                </Badge>
              </div>
              
              <div className="space-y-2">
                {recommendedQuestions.map((question, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover-elevate ${
                      selectedQuestions.has(question) ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => toggleQuestion(question)}
                    data-testid={`question-${idx}`}
                  >
                    <Checkbox
                      checked={selectedQuestions.has(question)}
                      className="mt-0.5"
                    />
                    <p className="flex-1 text-sm">{question}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-base font-semibold">Custom Questions</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your own question..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomQuestion())}
                  data-testid="input-custom-question"
                />
                <Button
                  type="button"
                  onClick={addCustomQuestion}
                  data-testid="button-add-question"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {customQuestions.length > 0 && (
                <div className="space-y-2">
                  {customQuestions.map((question, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                      <p className="flex-1 text-sm">{question}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCustomQuestion(idx)}
                        data-testid={`button-remove-custom-${idx}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="gatheringMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Response Collection Method</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-gathering-method">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="responses">Target Number of Responses</SelectItem>
                          <SelectItem value="duration">Time Duration</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchGatheringMethod === "responses" && (
                  <FormField
                    control={form.control}
                    name="responseCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Response Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            min={1}
                            data-testid="input-response-count"
                          />
                        </FormControl>
                        <FormDescription>
                          Survey will close after reaching this many responses
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchGatheringMethod === "duration" && (
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collection Duration (Days)</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-duration">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="60">60 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Survey will remain active for this duration
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}

            <DialogFooter>
              <div className="flex items-center justify-between w-full">
                <p className="text-sm text-muted-foreground">
                  {selectedQuestions.size + customQuestions.length} question{selectedQuestions.size + customQuestions.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="button-create-survey">
                    Create Survey
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
