import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, Building2, User, Bell, Shield, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";

interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  fullName: string | null;
  companyName: string | null;
  companyWebsite: string | null;
  phone: string | null;
  jobTitle: string | null;
  notificationEmail: boolean | null;
  notificationResponses: boolean | null;
  notificationWeekly: boolean | null;
  notificationMilestones: boolean | null;
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch user profile
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery<UserProfile>({
    queryKey: ['/api/auth/user'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    jobTitle: "",
    companyName: "",
    companyWebsite: "",
    notificationEmail: true,
    notificationResponses: true,
    notificationWeekly: true,
    notificationMilestones: false,
  });

  // Update form data when user profile loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        jobTitle: userProfile.jobTitle || "",
        companyName: userProfile.companyName || "",
        companyWebsite: userProfile.companyWebsite || "",
        notificationEmail: userProfile.notificationEmail ?? true,
        notificationResponses: userProfile.notificationResponses ?? true,
        notificationWeekly: userProfile.notificationWeekly ?? true,
        notificationMilestones: userProfile.notificationMilestones ?? false,
      });
    }
  }, [userProfile]);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await apiRequest("PATCH", "/api/user", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateUserMutation.mutate(formData);
  };

  const handleFileUpload = (type: string) => {
    toast({
      title: "Upload Started",
      description: `${type} upload initiated`,
    });
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account, company information, and preferences
        </p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Branding</CardTitle>
              <p className="text-sm text-muted-foreground">
                Customize your company's appearance in the platform
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileUpload('Logo')}
                      data-testid="button-upload-logo"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Recommended: PNG or SVG, max 2MB
                    </p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  data-testid="input-company-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-website">Website URL</Label>
                <Input
                  id="company-website"
                  type="url"
                  value={formData.companyWebsite}
                  onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                  data-testid="input-company-website"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarFallback className="text-lg">
                      {formData.fullName 
                        ? formData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        : formData.email 
                        ? formData.email.substring(0, 2).toUpperCase()
                        : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileUpload('Profile picture')}
                      data-testid="button-upload-profile"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Picture
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG or PNG, max 5MB
                    </p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input
                    id="full-name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    data-testid="input-full-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    data-testid="input-email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    data-testid="input-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-title">Job Title</Label>
                  <Input
                    id="job-title"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    data-testid="input-job-title"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose how you want to be notified about important updates
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive general updates via email
                  </p>
                </div>
                <Switch
                  checked={formData.notificationEmail}
                  onCheckedChange={(checked) => setFormData({ ...formData, notificationEmail: checked })}
                  data-testid="switch-email"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Survey Responses</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when consumers complete surveys
                  </p>
                </div>
                <Switch
                  checked={formData.notificationResponses}
                  onCheckedChange={(checked) => setFormData({ ...formData, notificationResponses: checked })}
                  data-testid="switch-responses"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Performance Summaries</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly digest of project performance
                  </p>
                </div>
                <Switch
                  checked={formData.notificationWeekly}
                  onCheckedChange={(checked) => setFormData({ ...formData, notificationWeekly: checked })}
                  data-testid="switch-weekly"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Project Milestones</Label>
                  <p className="text-sm text-muted-foreground">
                    Alerts when projects reach important milestones
                  </p>
                </div>
                <Switch
                  checked={formData.notificationMilestones}
                  onCheckedChange={(checked) => setFormData({ ...formData, notificationMilestones: checked })}
                  data-testid="switch-milestones"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Password</Label>
                  <p className="text-sm text-muted-foreground">
                    Last changed 3 months ago
                  </p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-change-password">
                  Change Password
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-base">Active Sessions</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  You're currently logged in on 1 device
                </p>
                <Button variant="outline" size="sm" data-testid="button-view-sessions">
                  View All Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2">
        <Button 
          onClick={handleSave} 
          data-testid="button-save-settings"
          disabled={updateUserMutation.isPending}
        >
          {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="outline">Cancel</Button>
      </div>
    </div>
  );
}
