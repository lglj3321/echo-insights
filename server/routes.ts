import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema,
  insertGoalSchema,
  insertTeamMemberSchema,
  insertSurveyResponseSchema,
  insertCategorySchema,
  insertCategoryMetricSchema,
  insertProjectMetricSchema,
  insertUserSchema,
  insertSurveyQuestionSchema,
} from "@shared/schema";
import { registerUser, loginUser, requireAuth, optionalAuth } from "./auth";
import { calculateImpactScore } from "./impactScore";
import { z } from "zod";
import { generateToken } from "./jwt";

// 注册请求schema
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  email: z.string().email().optional(),
});

// 登录请求schema
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // 认证API
  // 获取当前用户信息
  app.get("/api/auth/user", optionalAuth, async (req, res) => {
    if (req.user) {
      const user = await storage.getUser(req.user.id);
      if (user) {
        return res.json({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          companyName: user.companyName,
        });
      }
    }
    res.status(401).json({ error: "Not authenticated" });
  });

  // 更新用户信息
  app.patch("/api/user", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.updateUser(userId, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        companyName: user.companyName,
        companyWebsite: user.companyWebsite,
        phone: user.phone,
        jobTitle: user.jobTitle,
        notificationEmail: user.notificationEmail,
        notificationResponses: user.notificationResponses,
        notificationWeekly: user.notificationWeekly,
        notificationMilestones: user.notificationMilestones,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // 用户注册
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation failed",
          details: validation.error.errors 
        });
      }

      const { username, password, email } = validation.data;
      const user = await registerUser(username, password, email);

      // 生成 JWT Token
      const token = generateToken({
        userId: user.id,
        username: user.username,
      });

      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        token, // 返回 token
      });
    } catch (error: any) {
      if (error.message === "Username already exists") {
        return res.status(409).json({ error: error.message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  // 用户登录
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Validation failed",
          details: validation.error.errors 
        });
      }

      const { username, password } = validation.data;
      const user = await loginUser(username, password);

      // 生成 JWT Token
      const token = generateToken({
        userId: user.id,
        username: user.username,
      });

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        token, // 返回 token
      });
    } catch (error: any) {
      if (error.message === "Invalid username or password") {
        return res.status(401).json({ error: error.message });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // 用户登出（JWT 是无状态的，登出主要是客户端删除 token）
  app.post("/api/auth/logout", (req: any, res: any) => {
    // JWT 是无状态的，服务端不需要做任何操作
    // 客户端应该删除存储的 token
    res.json({ 
      message: "Logged out successfully",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const projects = await storage.getProjects(userId);
      
      // Ensure all projects have up-to-date impactScore for consistency
      const projectsWithScores = await Promise.all(
        projects.map(async (project) => {
          const metrics = await storage.getProjectMetrics(project.id);
          if (metrics.length > 0) {
            const calculatedScore = calculateImpactScore(metrics);
            // Update if score changed or not set
            if (!project.impactScore || Number(project.impactScore) !== calculatedScore) {
              await storage.updateProject(project.id, { impactScore: calculatedScore.toString() });
              return { ...project, impactScore: calculatedScore.toString() };
            }
          }
          return project;
        })
      );
      
      res.json(projectsWithScores);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // Dashboard API - Get dashboard statistics
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const projects = await storage.getProjects(userId);
      
      // Calculate statistics
      const totalProjects = projects.length;
      
      // Calculate total feedback responses and average score
      let totalResponses = 0;
      let totalFeedbackScore = 0;
      let projectsWithFeedback = 0;
      
      for (const project of projects) {
        try {
          const feedbackData = await storage.getProjectFeedbackScore(project.id);
          if (feedbackData.count > 0) {
            totalResponses += feedbackData.count;
            totalFeedbackScore += feedbackData.score * feedbackData.count;
            projectsWithFeedback++;
          }
        } catch (error) {
          // Skip if feedback data not available
        }
      }
      
      const avgFeedbackScore = totalResponses > 0 ? totalFeedbackScore / totalResponses : 0;
      
      // Calculate total CO2 saved
      const totalCo2Saved = projects.reduce((sum, p) => {
        return sum + (p.co2Saved ? Number(p.co2Saved) : 0);
      }, 0);
      
      // Calculate projects added this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const projectsThisMonth = projects.filter(p => {
        if (!p.createdAt) return false;
        const createdAt = p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt);
        return createdAt >= startOfMonth;
      }).length;
      
      // Calculate response growth (this week vs last week)
      // For now, we'll use a simple calculation based on recent responses
      const recentResponses = totalResponses; // Simplified - in production, filter by date
      const responseGrowth = "+12%"; // Placeholder - would need date-based filtering
      
      res.json({
        totalProjects,
        projectsThisMonth,
        totalResponses,
        avgFeedbackScore: Math.round(avgFeedbackScore * 10) / 10,
        totalCo2Saved: Math.round(totalCo2Saved * 10) / 10,
        responseGrowth,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });

  // Dashboard API - Get project type distribution
  app.get("/api/dashboard/type-distribution", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const projects = await storage.getProjects(userId);
      
      // Count projects by type (use customCategory if available, otherwise use type)
      const typeCount: Record<string, number> = {};
      projects.forEach(project => {
        // Use customCategory if available, otherwise use type
        const category = project.customCategory || project.type || "Other";
        typeCount[category] = (typeCount[category] || 0) + 1;
      });
      
      // Convert to array format and sort by count
      const distribution = Object.entries(typeCount)
        .map(([type, count]) => ({
          type,
          count,
        }))
        .sort((a, b) => b.count - a.count);
      
      res.json(distribution);
    } catch (error) {
      console.error("Error fetching type distribution:", error);
      res.status(500).json({ error: "Failed to fetch type distribution" });
    }
  });

  // Dashboard API - Get feedback trend with time range support
  app.get("/api/dashboard/feedback-trend", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const projects = await storage.getProjects(userId);
      
      // Get time range from query params (default: 6 months)
      const timeRange = req.query.range as string || '6months';
      const projectId = req.query.projectId as string | undefined;
      
      // Calculate date range
      const now = new Date();
      let startDate: Date;
      let periodType: 'day' | 'week' | 'month' = 'month';
      let periodCount: number;
      
      switch (timeRange) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          periodType = 'day';
          periodCount = 7;
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          periodType = 'day';
          periodCount = 30;
          break;
        case '3months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          periodType = 'month';
          periodCount = 3;
          break;
        case '6months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          periodType = 'month';
          periodCount = 6;
          break;
        case '1year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
          periodType = 'month';
          periodCount = 12;
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          periodType = 'month';
          periodCount = 6;
      }
      
      // Filter projects if projectId is specified
      const targetProjects = projectId 
        ? projects.filter(p => p.id === projectId)
        : projects;
      
      // Get all survey responses for target projects within date range
      const allResponses: Array<{ date: Date; score: number; projectId: string }> = [];
        
      for (const project of targetProjects) {
          try {
          const responses = await storage.getSurveyResponses(project.id);
          for (const response of responses) {
            if (response.createdAt) {
              const responseDate = response.createdAt instanceof Date 
                ? response.createdAt 
                : new Date(response.createdAt);
              
              if (responseDate >= startDate && response.numericValue) {
                allResponses.push({
                  date: responseDate,
                  score: Number(response.numericValue),
                  projectId: project.id,
                });
              }
            }
            }
          } catch (error) {
          // Skip if responses not available
        }
      }
      
      // Group responses by period
      const trendData: { date: string; score: number; count: number }[] = [];
      const periodMap = new Map<string, { total: number; count: number }>();
      
      for (const response of allResponses) {
        let periodKey: string;
        let displayLabel: string;
        
        if (periodType === 'day') {
          const dateStr = response.date.toISOString().split('T')[0];
          periodKey = dateStr;
          displayLabel = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          const year = response.date.getFullYear();
          const month = response.date.getMonth();
          periodKey = `${year}-${month}`;
          displayLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        
        if (!periodMap.has(periodKey)) {
          periodMap.set(periodKey, { total: 0, count: 0 });
        }
        
        const period = periodMap.get(periodKey)!;
        period.total += response.score;
        period.count += 1;
      }
      
      // Generate all periods in range (even if no data)
      const periods: string[] = [];
      if (periodType === 'day') {
        for (let i = 0; i < periodCount; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          periods.push(dateStr);
        }
      } else {
        for (let i = 0; i < periodCount; i++) {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + i);
          const year = date.getFullYear();
          const month = date.getMonth();
          periods.push(`${year}-${month}`);
        }
      }
      
      // Build trend data
      for (const periodKey of periods) {
        const period = periodMap.get(periodKey);
        let displayLabel: string;
        
        if (periodType === 'day') {
          displayLabel = new Date(periodKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          const [year, month] = periodKey.split('-').map(Number);
          displayLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        
        trendData.push({
          date: displayLabel,
          score: period && period.count > 0 
            ? Math.round((period.total / period.count) * 10) / 10 
            : 0,
          count: period?.count || 0,
        });
      }
      
      // Calculate statistics
      const scores = trendData.filter(d => d.count > 0).map(d => d.score);
      const totalResponses = trendData.reduce((sum, d) => sum + d.count, 0);
      const avgScore = scores.length > 0 
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
        : 0;
      
      // Calculate trend (comparing first half vs second half)
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (scores.length >= 4) {
        const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
        const secondHalf = scores.slice(Math.floor(scores.length / 2));
        const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
        const change = secondAvg - firstAvg;
        
        if (change > 0.1) trend = 'up';
        else if (change < -0.1) trend = 'down';
      }
      
      res.json({
        data: trendData,
        statistics: {
          averageScore: Math.round(avgScore * 10) / 10,
          totalResponses,
          trend,
          periodCount: trendData.filter(d => d.count > 0).length,
        },
      });
    } catch (error) {
      console.error("Error fetching feedback trend:", error);
      res.status(500).json({ error: "Failed to fetch feedback trend" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      // Calculate impact score if not set or if metrics have changed
      const metrics = await storage.getProjectMetrics(req.params.id);
      if (metrics.length > 0) {
        const calculatedScore = calculateImpactScore(metrics);
        // Update if score changed or not set
        if (!project.impactScore || Number(project.impactScore) !== calculatedScore) {
          await storage.updateProject(req.params.id, { impactScore: calculatedScore.toString() });
          project.impactScore = calculatedScore.toString();
        }
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const validation = insertProjectSchema.safeParse({
        ...req.body,
        userId,
      });
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      const project = await storage.createProject(validation.data);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const projectId = req.params.id;
      
      // Verify project belongs to user
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (project.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized to delete this project" });
      }
      
      const deleted = await storage.deleteProject(projectId);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Project Metrics API
  app.get("/api/projects/:projectId/metrics", async (req, res) => {
    try {
      const metrics = await storage.getProjectMetrics(req.params.projectId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project metrics" });
    }
  });

  app.post("/api/projects/:projectId/metrics", async (req, res) => {
    try {
      const validation = insertProjectMetricSchema.safeParse({
        ...req.body,
        projectId: req.params.projectId,
      });
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      const metric = await storage.createProjectMetric(validation.data);
      
      // Recalculate and update impact score
      const allMetrics = await storage.getProjectMetrics(req.params.projectId);
      const impactScore = calculateImpactScore(allMetrics);
      await storage.updateProject(req.params.projectId, { impactScore: impactScore.toString() });
      
      res.status(201).json(metric);
    } catch (error) {
      res.status(500).json({ error: "Failed to create project metric" });
    }
  });

  app.patch("/api/project-metrics/:id", async (req, res) => {
    try {
      const metric = await storage.updateProjectMetric(req.params.id, req.body);
      if (!metric) {
        return res.status(404).json({ error: "Project metric not found" });
      }
      res.json(metric);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project metric" });
    }
  });

  app.delete("/api/project-metrics/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProjectMetric(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Project metric not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project metric" });
    }
  });


  // Excel File Parsing API - Reads vertically (first column = metric names)
  app.post("/api/parse-excel", async (req, res) => {
    try {
      const { fileData } = req.body;
      
      if (!fileData) {
        return res.status(400).json({ error: "fileData is required" });
      }

      // Import xlsx
      const XLSX = await import("xlsx");
      
      // Convert base64 to buffer
      const buffer = Buffer.from(fileData, "base64");
      
      // Parse Excel workbook
      const workbook = XLSX.read(buffer, { type: "buffer" });
      
      // Check if workbook has sheets
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return res.status(400).json({ 
          error: "Excel file contains no sheets",
          text: "",
          metrics: []
        });
      }
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON (array of arrays)
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Check if sheet has data
      if (!data || data.length === 0) {
        return res.json({
          text: `Excel Spreadsheet: ${sheetName}\n\nNo data found.`,
          metrics: []
        });
      }
      
      // Find header row and identify value/unit columns
      const headerRow = (data[0] as any[]) || [];
      let valueColIndex = -1;
      let unitColIndex = -1;
      
      // Detect columns by keywords (case-insensitive)
      headerRow.forEach((header: any, index: number) => {
        const headerStr = String(header || "").toLowerCase();
        if (headerStr.includes("value") || headerStr.includes("metric")) {
          valueColIndex = index;
        }
        if (headerStr.includes("unit") || headerStr.includes("measure")) {
          unitColIndex = index;
        }
      });
      
      // Extract metrics from first column (excluding header row)
      const metrics: Array<{ metricName: string; value: string }> = [];
      const rows = data.slice(1); // Skip header row
      
      rows.forEach((row: any) => {
        if (!Array.isArray(row) || row.length === 0) return;
        
        const metricName = row[0]; // First column = metric name
        if (!metricName || String(metricName).trim() === "") return;
        
        // Build value string
        let valueStr = "";
        if (valueColIndex >= 0 && row[valueColIndex]) {
          valueStr = String(row[valueColIndex]);
        }
        
        if (unitColIndex >= 0 && row[unitColIndex]) {
          const unit = String(row[unitColIndex]);
          valueStr = valueStr ? `${valueStr} ${unit}` : unit;
        }
        
        if (valueStr.trim()) {
          metrics.push({
            metricName: String(metricName),
            value: valueStr
          });
        }
      });
      
      // Build text representation for OpenAI
      let text = `Excel Spreadsheet: ${sheetName}\n\n`;
      if (metrics.length > 0) {
        text += `Metrics:\n`;
        metrics.forEach(m => {
          text += `- ${m.metricName}: ${m.value}\n`;
        });
      } else {
        text += `No metrics found.`;
      }
      
      res.json({
        text,
        metrics
      });
    } catch (error) {
      console.error("Excel parsing error:", error);
      res.status(500).json({ error: "Failed to parse Excel file" });
    }
  });


  // Project Classification API - Uses OpenAI for intelligent project categorization
  app.post("/api/classify-project", async (req, res) => {
    try {
      const { description, customMetrics, csvData, fileText } = req.body;

      if (!description) {
        return res.status(400).json({ error: "description is required" });
      }

      // Import OpenAI classification service
      const { classifyProject } = await import("./openai-service");

      // Prepare metrics for classification
      const allMetrics = [
        ...(customMetrics || []),
        ...(csvData || [])
      ];

      // Call OpenAI classification
      const result = await classifyProject(description, allMetrics, fileText);

      res.json({
        category: result.category,
        confidence: result.confidence / 100, // Convert to 0-1 range
        reasoning: result.reasoning,
        method: "ai"
      });
    } catch (error) {
      console.error("OpenAI Classification error:", error);
      
      // Fallback to simple keyword-based classification if OpenAI fails
      try {
        const { description, customMetrics, csvData } = req.body;
        const allText = `${description} ${(customMetrics || []).map((m: any) => m.name).join(" ")} ${(csvData || []).map((m: any) => m.name).join(" ")}`.toLowerCase();
        
        const keywords: Record<string, string[]> = {
          Packaging: ["packaging", "package", "container", "recyclable", "plastic"],
          Energy: ["energy", "solar", "renewable", "carbon", "emission", "kwh"],
          Sourcing: ["sourcing", "supplier", "local", "supply chain"],
          Waste: ["waste", "recycling", "compost", "landfill"],
          Water: ["water", "conservation", "wastewater"],
        };

        let bestCategory = "Other";
        let bestScore = 0;

        Object.entries(keywords).forEach(([category, words]) => {
          const score = words.filter(word => allText.includes(word)).length;
          if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
          }
        });

        res.json({
          category: bestCategory,
          confidence: bestScore > 0 ? 0.5 : 0,
          reasoning: "Fallback keyword-based classification",
          method: "keyword-fallback"
        });
      } catch (fallbackError) {
        res.status(500).json({ error: "Failed to classify project" });
      }
    }
  });

  // Goals API
  app.get("/api/goals", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const validation = insertGoalSchema.safeParse({
        ...req.body,
        userId,
      });
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      const goal = await storage.createGoal(validation.data);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.patch("/api/goals/:id", async (req, res) => {
    try {
      const goal = await storage.updateGoal(req.params.id, req.body);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteGoal(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // Team Members API
  app.get("/api/team-members", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const members = await storage.getTeamMembers(userId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.post("/api/team-members", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const validation = insertTeamMemberSchema.safeParse({
        ...req.body,
        userId,
      });
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      const member = await storage.createTeamMember(validation.data);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error creating team member:", error);
      res.status(500).json({ error: "Failed to create team member" });
    }
  });

  app.patch("/api/team-members/:id", async (req, res) => {
    try {
      const member = await storage.updateTeamMember(req.params.id, req.body);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  app.delete("/api/team-members/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTeamMember(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete team member" });
    }
  });

  // QR Code Scans API
  app.post("/api/projects/:projectId/qr-scan", async (req, res) => {
    try {
      const scan = await storage.recordQRScan(req.params.projectId);
      res.status(201).json(scan);
    } catch (error) {
      res.status(500).json({ error: "Failed to record QR scan" });
    }
  });

  app.get("/api/projects/:projectId/qr-scans", async (req, res) => {
    try {
      const count = await storage.getQRScans(req.params.projectId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch QR scans" });
    }
  });

  // Survey Questions API
  app.get("/api/projects/:projectId/survey-questions", requireAuth, async (req, res) => {
    try {
      const questions = await storage.getSurveyQuestions(req.params.projectId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching survey questions:", error);
      res.status(500).json({ error: "Failed to fetch survey questions" });
    }
  });

  app.post("/api/survey-questions", requireAuth, async (req, res) => {
    try {
      const validation = insertSurveyQuestionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      const question = await storage.createSurveyQuestion(validation.data);
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating survey question:", error);
      res.status(500).json({ error: "Failed to create survey question" });
    }
  });

  app.patch("/api/survey-questions/:id", requireAuth, async (req, res) => {
    try {
      const question = await storage.updateSurveyQuestion(req.params.id, req.body);
      if (!question) {
        return res.status(404).json({ error: "Survey question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Error updating survey question:", error);
      res.status(500).json({ error: "Failed to update survey question" });
    }
  });

  app.delete("/api/survey-questions/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteSurveyQuestion(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Survey question not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting survey question:", error);
      res.status(500).json({ error: "Failed to delete survey question" });
    }
  });

  // Survey Responses API
  app.post("/api/survey-responses", async (req, res) => {
    try {
      const validation = insertSurveyResponseSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      const response = await storage.createSurveyResponse(validation.data);
      res.status(201).json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to create survey response" });
    }
  });

  app.get("/api/projects/:projectId/survey-responses", async (req, res) => {
    try {
      const responses = await storage.getSurveyResponses(req.params.projectId);
      res.json(responses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch survey responses" });
    }
  });

  app.get("/api/projects/:projectId/feedback-score", async (req, res) => {
    try {
      const feedbackData = await storage.getProjectFeedbackScore(req.params.projectId);
      res.json(feedbackData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch feedback score" });
    }
  });

  // Surveys API - Get all surveys (projects with questions)
  app.get("/api/surveys", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const projects = await storage.getProjects(userId);
      
      // Import survey analytics utilities
      const { calculateNPS, calculateSentiment, determineSurveyStatus } = await import('./surveyAnalytics');
      
      // Get surveys (projects that have survey questions)
      const surveys = await Promise.all(
        projects.map(async (project) => {
          const questions = await storage.getSurveyQuestions(project.id);
          const responses = await storage.getSurveyResponses(project.id);
          const feedbackData = await storage.getProjectFeedbackScore(project.id);
          const qrScans = await storage.getQRScans(project.id);
          
          if (questions.length === 0) return null;
          
          // Calculate NPS using consistent function
          const npsData = calculateNPS(responses);
          
          // Determine status using consistent function
          const status = determineSurveyStatus(feedbackData.count, questions.length);
          
          return {
            id: project.id,
            title: `${project.title} Survey`,
            projectId: project.id,
            projectTitle: project.title,
            status,
            responses: feedbackData.count,
            targetResponses: questions.length * 50, // Estimate
            trustScore: feedbackData.score > 0 ? Math.round(feedbackData.score * 10) / 10 : undefined,
            satisfactionScore: feedbackData.score > 0 ? Math.round(feedbackData.score * 10) / 10 : undefined,
            npsScore: npsData.totalResponses > 0 ? npsData.score : undefined,
            createdAt: project.createdAt?.toISOString() || new Date().toISOString(),
            completedAt: status === "completed" ? new Date().toISOString() : undefined,
            questions: questions.map(q => q.questionText),
            qrCodeUrl: `${req.protocol}://${req.get('host')}/survey/${project.id}`,
          };
        })
      );
      
      // Filter out nulls and return
      res.json(surveys.filter(s => s !== null));
    } catch (error) {
      console.error("Error fetching surveys:", error);
      res.status(500).json({ error: "Failed to fetch surveys" });
    }
  });

  // Survey Results API - Get detailed survey results
  app.get("/api/surveys/:projectId/results", requireAuth, async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Import survey analytics utilities
      const { calculateNPS, calculateSentiment, calculateAverageScore, determineSurveyStatus } = await import('./surveyAnalytics');

      const questions = await storage.getSurveyQuestions(projectId);
      const responses = await storage.getSurveyResponses(projectId);
      const feedbackData = await storage.getProjectFeedbackScore(projectId);

      // Calculate question analysis with sentiment breakdown
      const questionAnalysis = questions.map(question => {
        const questionResponses = responses.filter(r => r.questionId === question.id);
        const numericResponses = questionResponses.filter(r => r.numericValue !== null);
        
        // Calculate distribution for choice questions
        const answerCounts: Record<string, number> = {};
        questionResponses.forEach(r => {
          const answer = r.answer;
          answerCounts[answer] = (answerCounts[answer] || 0) + 1;
        });

        const distribution = Object.entries(answerCounts)
          .map(([answer, count]) => ({
            answer,
            count,
            percentage: questionResponses.length > 0 
              ? Math.round((count / questionResponses.length) * 100 * 10) / 10 
              : 0,
          }))
          .sort((a, b) => b.count - a.count); // Sort by count descending

        const averageRating = numericResponses.length > 0
          ? calculateAverageScore(questionResponses)
          : undefined;

        // Calculate sentiment for this question
        const sentimentBreakdown = calculateSentiment(questionResponses);

        return {
          question: question.questionText,
          responses: questionResponses.length,
          distribution,
          averageRating,
          sentimentBreakdown,
        };
      });

      // Calculate NPS using consistent function
      const npsData = calculateNPS(responses);
      
      // Calculate sentiment using consistent function
      const sentimentData = calculateSentiment(responses);

      // Determine status using consistent function
      const status = determineSurveyStatus(feedbackData.count, questions.length);

      res.json({
        id: projectId,
        title: `${project.title} Survey`,
        projectTitle: project.title,
        status,
        totalResponses: feedbackData.count,
        targetResponses: questions.length * 50,
        createdAt: project.createdAt?.toISOString() || new Date().toISOString(),
        completedAt: status === "completed" ? new Date().toISOString() : undefined,
        trustScore: feedbackData.score > 0 ? Math.round(feedbackData.score * 10) / 10 : undefined,
        satisfactionScore: feedbackData.score > 0 ? Math.round(feedbackData.score * 10) / 10 : undefined,
        npsScore: npsData.totalResponses > 0 ? npsData.score : 0,
        npsBreakdown: {
          promoters: npsData.breakdown.promoters,
          passives: npsData.breakdown.passives,
          detractors: npsData.breakdown.detractors,
        },
        sentimentBreakdown: {
          positive: sentimentData.positive,
          neutral: sentimentData.neutral,
          negative: sentimentData.negative,
        },
        questionAnalysis,
      });
    } catch (error) {
      console.error("Error fetching survey results:", error);
      res.status(500).json({ error: "Failed to fetch survey results" });
    }
  });

  // Survey Individual Responses API
  app.get("/api/surveys/:projectId/responses", requireAuth, async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const responses = await storage.getSurveyResponses(projectId);
      const questions = await storage.getSurveyQuestions(projectId);

      // Format responses with question text
      const formattedResponses = responses.map(response => {
        const question = questions.find(q => q.id === response.questionId);
        return {
          id: response.id,
          questionText: question?.questionText || "Unknown question",
          answer: response.answer,
          rating: response.numericValue ? Number(response.numericValue) : undefined,
          timestamp: response.createdAt?.toISOString() || new Date().toISOString(),
          sentiment: response.numericValue 
            ? Number(response.numericValue) >= 4 ? "positive" 
              : Number(response.numericValue) <= 2 ? "negative" 
              : "neutral"
            : undefined,
        };
      });

      // Sort by timestamp descending
      formattedResponses.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      res.json(formattedResponses);
    } catch (error) {
      console.error("Error fetching individual responses:", error);
      res.status(500).json({ error: "Failed to fetch individual responses" });
    }
  });

  // Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validation = insertCategorySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      const category = await storage.createCategory(validation.data);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // Category Metrics API
  app.get("/api/categories/:categoryId/metrics", async (req, res) => {
    try {
      const metrics = await storage.getCategoryMetrics(req.params.categoryId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category metrics" });
    }
  });

  app.get("/api/categories/:categoryId/recommended-metrics", async (req, res) => {
    try {
      const metrics = await storage.getRecommendedMetrics(req.params.categoryId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recommended metrics" });
    }
  });

  app.post("/api/category-metrics", async (req, res) => {
    try {
      const validation = insertCategoryMetricSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      const metric = await storage.createCategoryMetric(validation.data);
      res.status(201).json(metric);
    } catch (error) {
      res.status(500).json({ error: "Failed to create category metric" });
    }
  });

  // Forecast API
  app.post("/api/projects/:projectId/forecast", requireAuth, async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const { metricIds, targetYear, scenario } = req.body;

      if (!metricIds || !Array.isArray(metricIds) || metricIds.length === 0) {
        return res.status(400).json({ error: "metricIds array is required" });
      }

      if (!targetYear || typeof targetYear !== 'number') {
        return res.status(400).json({ error: "targetYear is required and must be a number" });
      }

      const validScenario = ['optimistic', 'realistic', 'pessimistic'].includes(scenario) 
        ? scenario 
        : 'realistic';

      // Get all project metrics
      const allMetrics = await storage.getProjectMetrics(projectId);
      
      // Filter to selected metrics
      const selectedMetrics = allMetrics.filter(m => metricIds.includes(m.id));

      if (selectedMetrics.length === 0) {
        return res.status(404).json({ error: "No matching metrics found" });
      }

      // Generate forecasts
      const { generateForecasts } = await import('./forecast');
      const forecasts = generateForecasts(selectedMetrics, targetYear, validScenario);

      res.json({ forecasts });
    } catch (error) {
      console.error("Error generating forecast:", error);
      res.status(500).json({ error: "Failed to generate forecast" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
