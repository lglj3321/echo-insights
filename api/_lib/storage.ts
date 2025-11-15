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
  type SurveyQuestion,
  type InsertSurveyQuestion,
  type Category,
  type InsertCategory,
  type CategoryMetric,
  type InsertCategoryMetric,
  type ProjectMetric,
  type InsertProjectMetric,
} from "../../shared/schema";
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
  
  // Survey Questions
  getSurveyQuestions(projectId: string): Promise<SurveyQuestion[]>;
  getSurveyQuestion(id: string): Promise<SurveyQuestion | undefined>;
  createSurveyQuestion(question: InsertSurveyQuestion): Promise<SurveyQuestion>;
  updateSurveyQuestion(id: string, updates: Partial<SurveyQuestion>): Promise<SurveyQuestion | undefined>;
  deleteSurveyQuestion(id: string): Promise<boolean>;
  
  // Survey Responses
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  getSurveyResponses(projectId: string): Promise<SurveyResponse[]>;
  getProjectFeedbackScore(projectId: string): Promise<{ score: number; count: number }>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Category Metrics
  getCategoryMetrics(categoryId: string): Promise<CategoryMetric[]>;
  getRecommendedMetrics(categoryId: string): Promise<CategoryMetric[]>;
  createCategoryMetric(metric: InsertCategoryMetric): Promise<CategoryMetric>;
  
  // Project Metrics
  getProjectMetrics(projectId: string): Promise<ProjectMetric[]>;
  createProjectMetric(metric: InsertProjectMetric): Promise<ProjectMetric>;
  deleteProjectMetric(id: string): Promise<boolean>;
  updateProjectMetric(id: string, updates: Partial<ProjectMetric>): Promise<ProjectMetric | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private goals: Map<string, Goal>;
  private teamMembers: Map<string, TeamMember>;
  private qrScans: Map<string, QRCodeScan[]>;
  private surveyQuestions: Map<string, SurveyQuestion>;
  private surveyResponses: Map<string, SurveyResponse[]>;
  private categories: Map<string, Category>;
  private categoryMetrics: Map<string, CategoryMetric>;
  private projectMetrics: Map<string, ProjectMetric[]>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.goals = new Map();
    this.teamMembers = new Map();
    this.qrScans = new Map();
    this.surveyQuestions = new Map();
    this.surveyResponses = new Map();
    this.categories = new Map();
    this.categoryMetrics = new Map();
    this.projectMetrics = new Map();
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
      customCategory: project.customCategory ?? null,
      waterSaved: project.waterSaved ?? null,
      actualCost: project.actualCost ?? null,
      co2Saved: project.co2Saved ?? null,
      impactScore: project.impactScore ?? null,
      status: project.status ?? "active",
      assignedTo: project.assignedTo ?? null,
      startDate: project.startDate ?? null,
      endDate: project.endDate ?? null,
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
      description: goal.description ?? null,
      currentValue: goal.currentValue ?? "0",
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
      invitedBy: member.invitedBy ?? null,
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

  // Survey Question methods
  async getSurveyQuestions(projectId: string): Promise<SurveyQuestion[]> {
    return Array.from(this.surveyQuestions.values())
      .filter(q => q.projectId === projectId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async getSurveyQuestion(id: string): Promise<SurveyQuestion | undefined> {
    return this.surveyQuestions.get(id);
  }

  async createSurveyQuestion(insertQuestion: InsertSurveyQuestion): Promise<SurveyQuestion> {
    const id = randomUUID();
    const question: SurveyQuestion = {
      ...insertQuestion,
      id,
      options: insertQuestion.options ?? null,
      isTemplate: insertQuestion.isTemplate ?? false,
      createdAt: new Date(),
    };
    this.surveyQuestions.set(id, question);
    return question;
  }

  async updateSurveyQuestion(id: string, updates: Partial<SurveyQuestion>): Promise<SurveyQuestion | undefined> {
    const question = this.surveyQuestions.get(id);
    if (!question) return undefined;
    const updated = { ...question, ...updates };
    this.surveyQuestions.set(id, updated);
    return updated;
  }

  async deleteSurveyQuestion(id: string): Promise<boolean> {
    return this.surveyQuestions.delete(id);
  }

  // Survey Response methods
  async createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
    const id = randomUUID();
    
    // Support custom createdAt from metadata (for testing purposes)
    let createdAt = new Date();
    if (response.metadata && typeof response.metadata === 'object' && 'createdAt' in response.metadata) {
      const customDate = response.metadata.createdAt;
      if (typeof customDate === 'string') {
        createdAt = new Date(customDate);
      } else if (customDate instanceof Date) {
        createdAt = customDate;
      }
    }
    
    const newResponse: SurveyResponse = {
      ...response,
      id,
      numericValue: response.numericValue ?? null,
      metadata: response.metadata ?? null,
      createdAt,
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
    
    const numericResponses = responses.filter(r => r.numericValue !== null && r.numericValue !== undefined);
    if (numericResponses.length === 0) return { score: 0, count: 0 };
    
    const sum = numericResponses.reduce((acc, r) => {
      const value = typeof r.numericValue === 'string' ? parseFloat(r.numericValue) : Number(r.numericValue);
      return acc + (isNaN(value) ? 0 : value);
    }, 0);
    const avg = sum / numericResponses.length;
    
    return { score: avg, count: numericResponses.length };
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const newCategory: Category = {
      ...category,
      id,
      description: category.description ?? null,
      icon: category.icon ?? null,
      createdAt: new Date(),
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Category Metric methods
  async getCategoryMetrics(categoryId: string): Promise<CategoryMetric[]> {
    return Array.from(this.categoryMetrics.values()).filter(m => m.categoryId === categoryId);
  }

  async getRecommendedMetrics(categoryId: string): Promise<CategoryMetric[]> {
    return Array.from(this.categoryMetrics.values()).filter(
      m => m.categoryId === categoryId && m.isRecommended === true
    );
  }

  async createCategoryMetric(metric: InsertCategoryMetric): Promise<CategoryMetric> {
    const id = randomUUID();
    const newMetric: CategoryMetric = {
      ...metric,
      id,
      unit: metric.unit ?? null,
      normalizationMethod: metric.normalizationMethod ?? null,
      normalizationMetadata: metric.normalizationMetadata ?? null,
      weight: metric.weight ?? "1.0",
      isRecommended: metric.isRecommended ?? true,
      createdAt: new Date(),
    };
    this.categoryMetrics.set(id, newMetric);
    return newMetric;
  }

  // Project Metric methods
  async getProjectMetrics(projectId: string): Promise<ProjectMetric[]> {
    return this.projectMetrics.get(projectId) || [];
  }

  async createProjectMetric(metric: InsertProjectMetric): Promise<ProjectMetric> {
    const id = randomUUID();
    const newMetric: ProjectMetric = {
      ...metric,
      id,
      normalizedScore: metric.normalizedScore ?? null,
      unit: metric.unit ?? null,
      source: metric.source ?? null,
      metadata: metric.metadata ?? null,
      createdAt: new Date(),
    };
    const metrics = this.projectMetrics.get(metric.projectId) || [];
    metrics.push(newMetric);
    this.projectMetrics.set(metric.projectId, metrics);
    return newMetric;
  }

  async deleteProjectMetric(id: string): Promise<boolean> {
    const entries = Array.from(this.projectMetrics.entries());
    for (const [projectId, metrics] of entries) {
      const index = metrics.findIndex((m: ProjectMetric) => m.id === id);
      if (index !== -1) {
        metrics.splice(index, 1);
        this.projectMetrics.set(projectId, metrics);
        return true;
      }
    }
    return false;
  }

  async updateProjectMetric(id: string, updates: Partial<ProjectMetric>): Promise<ProjectMetric | undefined> {
    const entries = Array.from(this.projectMetrics.entries());
    for (const [projectId, metrics] of entries) {
      const metric = metrics.find((m: ProjectMetric) => m.id === id);
      if (metric) {
        const updated = { ...metric, ...updates };
        const index = metrics.findIndex((m: ProjectMetric) => m.id === id);
        metrics[index] = updated;
        this.projectMetrics.set(projectId, metrics);
        return updated;
      }
    }
    return undefined;
  }
}

import { db } from "./db";
import * as schema from "../../shared/schema";
import { eq, and, sql as drizzleSql, asc } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  private dbInstance: NonNullable<typeof db>;

  constructor() {
    if (!db) {
      throw new Error("Database not initialized. DATABASE_URL must be set.");
    }
    this.dbInstance = db;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.dbInstance.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.dbInstance.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.dbInstance.insert(schema.users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await this.dbInstance.update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, id))
      .returning();
    return result[0];
  }

  // Projects
  async getProjects(userId: string): Promise<Project[]> {
    return await this.dbInstance.select().from(schema.projects).where(eq(schema.projects.userId, userId));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await this.dbInstance.select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1);
    return result[0];
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const result = await this.dbInstance.insert(schema.projects).values(insertProject).returning();
    return result[0];
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const result = await this.dbInstance.update(schema.projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.projects.id, id))
      .returning();
    return result[0];
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await this.dbInstance.delete(schema.projects).where(eq(schema.projects.id, id)).returning();
    return result.length > 0;
  }

  // Goals
  async getGoals(userId: string): Promise<Goal[]> {
    return await this.dbInstance.select().from(schema.goals).where(eq(schema.goals.userId, userId));
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    const result = await this.dbInstance.select().from(schema.goals).where(eq(schema.goals.id, id)).limit(1);
    return result[0];
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const result = await this.dbInstance.insert(schema.goals).values(insertGoal).returning();
    return result[0];
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | undefined> {
    const result = await this.dbInstance.update(schema.goals)
      .set(updates)
      .where(eq(schema.goals.id, id))
      .returning();
    return result[0];
  }

  async deleteGoal(id: string): Promise<boolean> {
    const result = await this.dbInstance.delete(schema.goals).where(eq(schema.goals.id, id)).returning();
    return result.length > 0;
  }

  // Team Members
  async getTeamMembers(userId: string): Promise<TeamMember[]> {
    return await this.dbInstance.select().from(schema.teamMembers).where(eq(schema.teamMembers.userId, userId));
  }

  async createTeamMember(insertMember: InsertTeamMember): Promise<TeamMember> {
    const result = await this.dbInstance.insert(schema.teamMembers).values(insertMember).returning();
    return result[0];
  }

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember | undefined> {
    const result = await this.dbInstance.update(schema.teamMembers)
      .set(updates)
      .where(eq(schema.teamMembers.id, id))
      .returning();
    return result[0];
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    const result = await this.dbInstance.delete(schema.teamMembers).where(eq(schema.teamMembers.id, id)).returning();
    return result.length > 0;
  }

  // QR Code Scans
  async recordQRScan(projectId: string): Promise<QRCodeScan> {
    const result = await this.dbInstance.insert(schema.qrCodeScans).values({ projectId }).returning();
    return result[0];
  }

  async getQRScans(projectId: string): Promise<number> {
    const result = await this.dbInstance.select({ count: drizzleSql<number>`count(*)::int` })
      .from(schema.qrCodeScans)
      .where(eq(schema.qrCodeScans.projectId, projectId));
    return result[0]?.count || 0;
  }

  // Survey Questions
  async getSurveyQuestions(projectId: string): Promise<SurveyQuestion[]> {
    return await this.dbInstance.select()
      .from(schema.surveyQuestions)
      .where(eq(schema.surveyQuestions.projectId, projectId))
      .orderBy(asc(schema.surveyQuestions.orderIndex));
  }

  async getSurveyQuestion(id: string): Promise<SurveyQuestion | undefined> {
    const result = await this.dbInstance.select()
      .from(schema.surveyQuestions)
      .where(eq(schema.surveyQuestions.id, id))
      .limit(1);
    return result[0];
  }

  async createSurveyQuestion(insertQuestion: InsertSurveyQuestion): Promise<SurveyQuestion> {
    const result = await this.dbInstance.insert(schema.surveyQuestions)
      .values(insertQuestion)
      .returning();
    return result[0];
  }

  async updateSurveyQuestion(id: string, updates: Partial<SurveyQuestion>): Promise<SurveyQuestion | undefined> {
    const result = await this.dbInstance.update(schema.surveyQuestions)
      .set(updates)
      .where(eq(schema.surveyQuestions.id, id))
      .returning();
    return result[0];
  }

  async deleteSurveyQuestion(id: string): Promise<boolean> {
    const result = await this.dbInstance.delete(schema.surveyQuestions)
      .where(eq(schema.surveyQuestions.id, id))
      .returning();
    return result.length > 0;
  }

  // Survey Responses
  async createSurveyResponse(insertResponse: InsertSurveyResponse): Promise<SurveyResponse> {
    const result = await this.dbInstance.insert(schema.surveyResponses).values(insertResponse).returning();
    return result[0];
  }

  async getSurveyResponses(projectId: string): Promise<SurveyResponse[]> {
    return await this.dbInstance.select().from(schema.surveyResponses).where(eq(schema.surveyResponses.projectId, projectId));
  }

  async getProjectFeedbackScore(projectId: string): Promise<{ score: number; count: number }> {
    const result = await this.dbInstance.select({
      avg: drizzleSql<number>`COALESCE(AVG(numeric_value::numeric), 0)`,
      count: drizzleSql<number>`count(*)::int`
    })
      .from(schema.surveyResponses)
      .where(eq(schema.surveyResponses.projectId, projectId));
    
    return {
      score: Number(result[0]?.avg || 0),
      count: result[0]?.count || 0
    };
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await this.dbInstance.select().from(schema.categories);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const result = await this.dbInstance.select().from(schema.categories).where(eq(schema.categories.id, id)).limit(1);
    return result[0];
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = await this.dbInstance.insert(schema.categories).values(insertCategory).returning();
    return result[0];
  }

  // Category Metrics
  async getCategoryMetrics(categoryId: string): Promise<CategoryMetric[]> {
    return await this.dbInstance.select().from(schema.categoryMetrics).where(eq(schema.categoryMetrics.categoryId, categoryId));
  }

  async getRecommendedMetrics(categoryId: string): Promise<CategoryMetric[]> {
    return await this.dbInstance.select().from(schema.categoryMetrics)
      .where(and(
        eq(schema.categoryMetrics.categoryId, categoryId),
        eq(schema.categoryMetrics.isRecommended, true)
      ));
  }

  async createCategoryMetric(insertMetric: InsertCategoryMetric): Promise<CategoryMetric> {
    const result = await this.dbInstance.insert(schema.categoryMetrics).values(insertMetric).returning();
    return result[0];
  }

  // Project Metrics
  async getProjectMetrics(projectId: string): Promise<ProjectMetric[]> {
    return await this.dbInstance.select().from(schema.projectMetrics).where(eq(schema.projectMetrics.projectId, projectId));
  }

  async createProjectMetric(insertMetric: InsertProjectMetric): Promise<ProjectMetric> {
    const result = await this.dbInstance.insert(schema.projectMetrics).values(insertMetric).returning();
    return result[0];
  }

  async deleteProjectMetric(id: string): Promise<boolean> {
    const result = await this.dbInstance.delete(schema.projectMetrics).where(eq(schema.projectMetrics.id, id)).returning();
    return result.length > 0;
  }

  async updateProjectMetric(id: string, updates: Partial<ProjectMetric>): Promise<ProjectMetric | undefined> {
    const result = await this.dbInstance.update(schema.projectMetrics)
      .set(updates)
      .where(eq(schema.projectMetrics.id, id))
      .returning();
    return result[0];
  }
}

// 根据环境变量选择存储方式
// 如果没有DATABASE_URL，使用内存存储（用于测试）
// 如果有DATABASE_URL，使用数据库存储（生产环境）
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
