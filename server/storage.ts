import { 
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type Goal,
  type InsertGoal,
  type TeamMember,
  type InsertTeamMember,
  type QRCodeScan,
  type SurveyResponse,
  type InsertSurveyResponse,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Projects
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  // Goals
  getGoals(userId: string): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: string): Promise<boolean>;
  
  // Team Members
  getTeamMembers(userId: string): Promise<TeamMember[]>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: string): Promise<boolean>;
  
  // QR Code Scans
  recordQRScan(projectId: string): Promise<QRCodeScan>;
  getQRScans(projectId: string): Promise<number>;
  
  // Survey Responses
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  getSurveyResponses(projectId: string): Promise<SurveyResponse[]>;
  getProjectFeedbackScore(projectId: string): Promise<{ score: number; count: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private goals: Map<string, Goal>;
  private teamMembers: Map<string, TeamMember>;
  private qrScans: Map<string, QRCodeScan[]>;
  private surveyResponses: Map<string, SurveyResponse[]>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.goals = new Map();
    this.teamMembers = new Map();
    this.qrScans = new Map();
    this.surveyResponses = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      fullName: null,
      email: null,
      phone: null,
      jobTitle: null,
      profilePicture: null,
      companyName: null,
      companyWebsite: null,
      companyLogo: null,
      notificationEmail: true,
      notificationResponses: true,
      notificationWeekly: true,
      notificationMilestones: true,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // Project methods
  async getProjects(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.userId === userId);
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = randomUUID();
    const newProject: Project = {
      ...project,
      id,
      actualCost: null,
      status: "active",
      assignedTo: null,
      startDate: null,
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    const updated = { ...project, ...updates, updatedAt: new Date() };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Goal methods
  async getGoals(userId: string): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(g => g.userId === userId);
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const id = randomUUID();
    const newGoal: Goal = {
      ...goal,
      id,
      status: "active",
      createdAt: new Date(),
    };
    this.goals.set(id, newGoal);
    return newGoal;
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    const updated = { ...goal, ...updates };
    this.goals.set(id, updated);
    return updated;
  }

  async deleteGoal(id: string): Promise<boolean> {
    return this.goals.delete(id);
  }

  // Team Member methods
  async getTeamMembers(userId: string): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values()).filter(tm => tm.userId === userId);
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const id = randomUUID();
    const newMember: TeamMember = {
      ...member,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.teamMembers.set(id, newMember);
    return newMember;
  }

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember | undefined> {
    const member = this.teamMembers.get(id);
    if (!member) return undefined;
    const updated = { ...member, ...updates };
    this.teamMembers.set(id, updated);
    return updated;
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    return this.teamMembers.delete(id);
  }

  // QR Code Scan methods
  async recordQRScan(projectId: string): Promise<QRCodeScan> {
    const scan: QRCodeScan = {
      id: randomUUID(),
      projectId,
      scannedAt: new Date(),
      metadata: null,
    };
    const scans = this.qrScans.get(projectId) || [];
    scans.push(scan);
    this.qrScans.set(projectId, scans);
    return scan;
  }

  async getQRScans(projectId: string): Promise<number> {
    return (this.qrScans.get(projectId) || []).length;
  }

  // Survey Response methods
  async createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
    const id = randomUUID();
    const newResponse: SurveyResponse = {
      ...response,
      id,
      createdAt: new Date(),
    };
    const responses = this.surveyResponses.get(response.projectId) || [];
    responses.push(newResponse);
    this.surveyResponses.set(response.projectId, responses);
    return newResponse;
  }

  async getSurveyResponses(projectId: string): Promise<SurveyResponse[]> {
    return this.surveyResponses.get(projectId) || [];
  }

  async getProjectFeedbackScore(projectId: string): Promise<{ score: number; count: number }> {
    const responses = this.surveyResponses.get(projectId) || [];
    if (responses.length === 0) return { score: 0, count: 0 };
    
    const numericResponses = responses.filter(r => r.numericValue !== null);
    if (numericResponses.length === 0) return { score: 0, count: 0 };
    
    const sum = numericResponses.reduce((acc, r) => acc + parseFloat(r.numericValue as string), 0);
    const avg = sum / numericResponses.length;
    
    return { score: avg, count: numericResponses.length };
  }
}

export const storage = new MemStorage();
