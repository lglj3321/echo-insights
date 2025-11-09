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
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects API
  app.get("/api/projects", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validation = insertProjectSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      const project = await storage.createProject(validation.data);
      res.status(201).json(project);
    } catch (error) {
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

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
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

  // Project Classification API
  app.post("/api/classify-project", async (req, res) => {
    try {
      const { description, customMetrics, csvData } = req.body;

      if (!description) {
        return res.status(400).json({ error: "description is required" });
      }

      // Prepare all text for analysis
      const desc = description.toLowerCase();
      const metricNames = (customMetrics || [])
        .map((m: any) => m.name.toLowerCase())
        .join(" ");
      const csvHeaders = (csvData || [])
        .map((m: any) => m.name.toLowerCase())
        .join(" ");
      const allText = `${desc} ${metricNames} ${csvHeaders}`;

      // Enhanced keyword-based classification
      // TODO: Replace with OpenAI classification once integration is confirmed
      const categoryScores: Record<string, number> = {
        Packaging: 0,
        Energy: 0,
        Sourcing: 0,
        Waste: 0,
        Water: 0,
      };

      const keywords: Record<string, string[]> = {
        Packaging: [
          "packaging", "package", "container", "wrap", "box", "bottle",
          "recyclable", "biodegradable", "plastic", "material", "compostable"
        ],
        Energy: [
          "energy", "solar", "renewable", "power", "electricity", "kwh",
          "efficiency", "consumption", "carbon", "emission", "co2", "fuel"
        ],
        Sourcing: [
          "sourcing", "supplier", "local", "supply chain", "procurement",
          "ingredients", "materials", "fair trade", "organic", "sustainable"
        ],
        Waste: [
          "waste", "recycling", "compost", "landfill", "disposal",
          "zero waste", "diversion", "reduction", "trash"
        ],
        Water: [
          "water", "conservation", "recycling", "wastewater", "consumption",
          "gallons", "rainwater", "aquifer", "irrigation"
        ],
      };

      // Score each category
      Object.entries(keywords).forEach(([category, words]) => {
        words.forEach((keyword) => {
          if (allText.includes(keyword)) {
            categoryScores[category] += 1;
          }
        });
      });

      // Find top category
      const sortedCategories = Object.entries(categoryScores).sort(
        ([, a], [, b]) => b - a
      );

      const topCategory = sortedCategories[0];
      const totalKeywords = Object.values(categoryScores).reduce((a, b) => a + b, 0);
      
      // Calculate confidence score (0-1)
      const confidence = totalKeywords > 0 
        ? topCategory[1] / totalKeywords 
        : 0;

      res.json({
        category: topCategory[1] > 0 ? topCategory[0] : "Other",
        confidence: Math.round(confidence * 100) / 100,
        method: "keyword-based", // Will be "ai" once OpenAI is integrated
      });
    } catch (error) {
      console.error("Classification error:", error);
      res.status(500).json({ error: "Failed to classify project" });
    }
  });

  // Goals API
  app.get("/api/goals", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const validation = insertGoalSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      const goal = await storage.createGoal(validation.data);
      res.status(201).json(goal);
    } catch (error) {
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
  app.get("/api/team-members", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const members = await storage.getTeamMembers(userId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.post("/api/team-members", async (req, res) => {
    try {
      const validation = insertTeamMemberSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      const member = await storage.createTeamMember(validation.data);
      res.status(201).json(member);
    } catch (error) {
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

  const httpServer = createServer(app);

  return httpServer;
}
