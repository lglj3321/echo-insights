import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Users, Shield, Eye, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import type { TeamMember } from "@shared/schema";

// Helper function to get initials from email or name
const getInitials = (email: string, fullName?: string | null): string => {
  if (fullName) {
    const parts = fullName.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }
  // Extract from email
  const emailPart = email.split("@")[0];
  if (emailPart.length >= 2) {
    return emailPart.substring(0, 2).toUpperCase();
  }
  return emailPart.toUpperCase();
};

export default function Team() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: "",
    role: "viewer" as "admin" | "manager" | "viewer",
  });

  // Fetch team members from API
  const { data: teamMembers = [], isLoading: isLoadingMembers, error: membersError } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "manager":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return Shield;
      case "manager":
        return Users;
      default:
        return Eye;
    }
  };

  // Create team member mutation
  const createMemberMutation = useMutation({
    mutationFn: async (memberData: { email: string; role: string }) => {
      const response = await apiRequest("POST", "/api/team-members", {
        email: memberData.email,
        role: memberData.role,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      toast({
        title: "Invitation Sent",
        description: `Invitation has been sent to ${inviteFormData.email}`,
      });
      setIsInviteDialogOpen(false);
      setInviteFormData({ email: "", role: "viewer" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  // Update team member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const response = await apiRequest("PATCH", `/api/team-members/${memberId}`, {
        role,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      toast({
        title: "Role Updated",
        description: `Member's role has been changed to ${variables.role}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    },
  });

  // Delete team member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiRequest("DELETE", `/api/team-members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      toast({
        title: "Member Removed",
        description: "Team member has been removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  const handleInviteMember = () => {
    if (!inviteFormData.email) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    createMemberMutation.mutate(inviteFormData);
  };

  const handleRoleChange = (memberId: string, newRole: "admin" | "manager" | "viewer") => {
    updateRoleMutation.mutate({ memberId, role: newRole });
  };

  const handleDeleteMember = (memberId: string) => {
    if (confirm("Are you sure you want to remove this team member?")) {
      deleteMemberMutation.mutate(memberId);
    }
  };

  // Loading state
  if (isLoadingMembers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold">Team Collaboration</h1>
          <p className="text-muted-foreground mt-1">
            Manage team members, roles, and permissions
          </p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-invite-member">
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  data-testid="input-email"
                  value={inviteFormData.email}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={inviteFormData.role}
                  onValueChange={(value) => setInviteFormData({ ...inviteFormData, role: value as "admin" | "manager" | "viewer" })}
                >
                  <SelectTrigger data-testid="select-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin - Full access</SelectItem>
                    <SelectItem value="manager">Manager - Edit projects</SelectItem>
                    <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Admins can manage team members and settings. Managers can create and edit projects. Viewers can only view data.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  data-testid="button-send-invite"
                  onClick={handleInviteMember}
                  disabled={createMemberMutation.isPending}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {createMemberMutation.isPending ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {teamMembers.filter(m => m.status === "active").length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              {teamMembers.filter(m => m.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting acceptance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              {teamMembers.filter(m => m.role === "admin").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Full access members</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No team members yet. Invite your first team member to get started!
                  </TableCell>
                </TableRow>
              ) : (
                teamMembers.map((member) => {
                  const RoleIcon = getRoleIcon(member.role as "admin" | "manager" | "viewer");
                  const initials = getInitials(member.email);
                  const createdAt = member.createdAt 
                    ? (member.createdAt instanceof Date ? member.createdAt : new Date(member.createdAt))
                    : new Date();
                  
                  return (
                    <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{member.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.role)} className="gap-1">
                          <RoleIcon className="h-3 w-3" />
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.status === "active" ? "default" : "outline"}>
                          {member.status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" data-testid={`button-edit-${member.id}`}>
                              Edit
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(member.id, "admin")}
                              data-testid={`option-role-admin-${member.id}`}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(member.id, "manager")}
                              data-testid={`option-role-manager-${member.id}`}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Manager
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(member.id, "viewer")}
                              data-testid={`option-role-viewer-${member.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Viewer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteMember(member.id)}
                              className="text-destructive"
                              data-testid={`option-delete-${member.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
