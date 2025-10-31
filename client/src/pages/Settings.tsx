import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and application preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              defaultValue="Sustainable Foods Inc."
              data-testid="input-company-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-email">Contact Email</Label>
            <Input
              id="company-email"
              type="email"
              defaultValue="contact@sustainablefoods.com"
              data-testid="input-company-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-website">Website</Label>
            <Input
              id="company-website"
              type="url"
              defaultValue="https://sustainablefoods.com"
              data-testid="input-company-website"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Survey Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="survey-url">Base Survey URL</Label>
            <Input
              id="survey-url"
              defaultValue="https://echo-insights.app/survey/"
              data-testid="input-survey-url"
            />
            <p className="text-xs text-muted-foreground">
              This URL will be used as the base for all QR code links
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Default Survey Questions</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Configure template questions that appear in all new surveys
            </p>
            <Button variant="outline" size="sm" data-testid="button-manage-questions">
              Manage Questions
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive updates about new feedback
              </p>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Reports</p>
              <p className="text-sm text-muted-foreground">
                Get a summary of project performance
              </p>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave} data-testid="button-save-settings">
          Save Changes
        </Button>
        <Button variant="outline">Cancel</Button>
      </div>
    </div>
  );
}
