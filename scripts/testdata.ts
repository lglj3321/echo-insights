/**
 * 完整测试数据生成脚本
 * 生成：2个用户，6个不同类型的项目，3个调查
 * 
 * 使用方法:
 * 1. 确保设置了 DATABASE_URL 环境变量（通过 .env 文件或环境变量）
 * 2. 运行: npx tsx scripts/testdata.ts
 * 
 * 或者使用环境变量:
 * DATABASE_URL=your_database_url npx tsx scripts/testdata.ts
 */

import * as schema from "../shared/schema";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { hashPassword } from "../server/auth";
import { calculateImpactScore } from "../server/impactScore";
import { eq, and } from "drizzle-orm";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

// 尝试加载 .env 文件（如果存在）
try {
  const envPath = join(process.cwd(), ".env");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const [key, ...values] = trimmedLine.split("=");
        if (key && values.length > 0) {
          const value = values.join("=").trim().replace(/^["']|["']$/g, "");
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
    });
  }
} catch (error) {
  // 忽略错误，继续执行
}

// 初始化数据库连接
function initDb() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
    console.error("❌ 错误: DATABASE_URL 环境变量未设置\n");
    console.error("📝 快速解决方案:\n");
    console.error("✨ 方法 1: 使用交互式设置脚本（最简单）");
    console.error("  npm run setup:env\n");
    console.error("📝 方法 2: 手动编辑 .env 文件");
    console.error("  1. 打开项目根目录的 .env 文件");
    console.error("  2. 添加以下内容:");
    console.error("     DATABASE_URL=postgresql://username:password@host:port/database\n");
    console.error("💡 如果没有数据库，可以使用内存存储测试:");
    console.error("  运行: npm run test:seed:memory\n");
    process.exit(1);
  }

  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return drizzle({ client: pool, schema });
}

async function generateTestData() {
  console.log("🌱 开始生成完整测试数据...\n");
  console.log("📋 将创建:");
  console.log("   - 2 个用户");
  console.log("   - 6 个不同类型的项目");
  console.log("   - 3 个完整的调查（包含问题和响应）\n");

  // 初始化数据库连接
  const db = initDb();

  try {
    // 测试数据库连接
    console.log("🔌 测试数据库连接...");
    try {
      await db.select().from(schema.users).limit(1);
      console.log("   ✅ 数据库连接成功\n");
    } catch (error: any) {
      console.error("   ❌ 数据库连接失败:", error.message);
      throw error;
    }

    // ========== 1. 创建2个用户 ==========
    console.log("1️⃣  创建用户...");
    const users = [
      {
        username: "alice",
        password: await hashPassword("alice123"),
        email: "alice@example.com",
        fullName: "Alice Johnson",
        companyName: "GreenTech Solutions",
        jobTitle: "Sustainability Director",
      },
      {
        username: "bob",
        password: await hashPassword("bob123"),
        email: "bob@example.com",
        fullName: "Bob Smith",
        companyName: "EcoInnovate Inc",
        jobTitle: "Environmental Manager",
      },
    ];

    const createdUsers: typeof schema.users.$inferSelect[] = [];
    for (const userData of users) {
      const existing = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, userData.username))
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`   ⚠️  用户 "${userData.username}" 已存在，使用现有用户`);
        createdUsers.push(existing[0]);
      } else {
        const [newUser] = await db.insert(schema.users).values(userData).returning();
        createdUsers.push(newUser);
        console.log(`   ✅ 创建用户: ${newUser.username} (${newUser.fullName || newUser.email})`);
      }
    }
    console.log(`\n   ✅ 共 ${createdUsers.length} 个用户\n`);

    // ========== 2. 创建6个不同类型的项目 ==========
    console.log("2️⃣  创建项目...");
    const projects = [
      // Alice 的项目
      {
        userId: createdUsers[0].id,
        title: "100% Recycled Packaging Initiative",
        description: "Transition all product packaging to 100% recycled materials to reduce waste and environmental impact. This initiative will eliminate plastic waste and promote circular economy principles.",
        type: "Packaging",
        customCategory: "Packaging",
        estimatedCost: "45000",
        roi: "18",
        co2Saved: "2.5",
        waterSaved: "500",
        status: "active" as const,
      },
      {
        userId: createdUsers[0].id,
        title: "Solar Energy Installation",
        description: "Install solar panels on manufacturing facilities to reduce carbon footprint and energy costs. Expected to generate 500 kWh annually and reduce grid dependency by 40%.",
        type: "Energy",
        customCategory: "Energy",
        estimatedCost: "120000",
        roi: "25",
        co2Saved: "8.2",
        status: "active" as const,
      },
      {
        userId: createdUsers[0].id,
        title: "Water Recycling System",
        description: "Implement advanced water recycling in production to reduce water consumption by 60%. Includes filtration and treatment systems for process water reuse.",
        type: "Water",
        customCategory: "Water",
        estimatedCost: "75000",
        roi: "20",
        co2Saved: "3.5",
        waterSaved: "1200",
        status: "active" as const,
      },
      // Bob 的项目
      {
        userId: createdUsers[1].id,
        title: "Local Sourcing Initiative",
        description: "Source 80% of ingredients from local suppliers within 100km radius to reduce transportation emissions and support local economy. Reduces supply chain carbon footprint significantly.",
        type: "Sourcing",
        customCategory: "Sourcing",
        estimatedCost: "28000",
        roi: "12",
        co2Saved: "1.8",
        status: "active" as const,
      },
      {
        userId: createdUsers[1].id,
        title: "Waste Reduction Program",
        description: "Comprehensive waste reduction program including composting, recycling, and waste-to-energy conversion. Targets 50% reduction in landfill waste within first year.",
        type: "Waste",
        customCategory: "Waste Management",
        estimatedCost: "55000",
        roi: "15",
        co2Saved: "4.2",
        status: "active" as const,
      },
      {
        userId: createdUsers[1].id,
        title: "Employee Sustainability Training",
        description: "Launch comprehensive sustainability training program for all employees to increase awareness and engagement. Includes workshops, certifications, and incentive programs.",
        type: "Education",
        customCategory: "Social Impact",
        estimatedCost: "35000",
        roi: "22",
        co2Saved: "1.2",
        status: "active" as const,
      },
    ];

    const createdProjects: typeof schema.projects.$inferSelect[] = [];
    for (const projectData of projects) {
      const existing = await db.select()
        .from(schema.projects)
        .where(and(
          eq(schema.projects.userId, projectData.userId),
          eq(schema.projects.title, projectData.title)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`   ⚠️  项目 "${projectData.title}" 已存在，使用现有项目`);
        createdProjects.push(existing[0]);
      } else {
        const [newProject] = await db.insert(schema.projects).values(projectData).returning();
        createdProjects.push(newProject);
        console.log(`   ✅ 创建项目: ${newProject.title} (${newProject.type})`);
      }
    }
    console.log(`\n   ✅ 共 ${createdProjects.length} 个项目\n`);

    // ========== 3. 为3个项目创建完整的调查 ==========
    console.log("3️⃣  创建调查（Survey）...");
    
    // 调查1: 第一个项目（Packaging）
    const survey1Project = createdProjects[0];
    console.log(`\n   📝 调查 1: "${survey1Project.title}"`);
    
    const survey1Questions = [
      {
        projectId: survey1Project.id,
        questionText: "How satisfied are you with the sustainability of our packaging?",
        questionType: "rating",
        options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
        orderIndex: 1,
        isTemplate: false,
      },
      {
        projectId: survey1Project.id,
        questionText: "Would you prefer products with biodegradable packaging?",
        questionType: "choice",
        options: ["Definitely Yes", "Probably Yes", "Not Sure", "Probably No", "Definitely No"],
        orderIndex: 2,
        isTemplate: false,
      },
      {
        projectId: survey1Project.id,
        questionText: "How important is recyclable packaging in your purchase decision?",
        questionType: "scale",
        options: ["Extremely Important", "Very Important", "Moderately Important", "Slightly Important", "Not Important"],
        orderIndex: 3,
        isTemplate: false,
      },
      {
        projectId: survey1Project.id,
        questionText: "Have you noticed our packaging improvements?",
        questionType: "choice",
        options: ["Yes, definitely", "Somewhat", "Not really", "Not at all"],
        orderIndex: 4,
        isTemplate: false,
      },
    ];

    const existingSurvey1Questions = await db.select()
      .from(schema.surveyQuestions)
      .where(eq(schema.surveyQuestions.projectId, survey1Project.id));
    
    let survey1CreatedQuestions: typeof schema.surveyQuestions.$inferSelect[];
    if (existingSurvey1Questions.length > 0) {
      survey1CreatedQuestions = existingSurvey1Questions;
      console.log(`      ⚠️  已存在 ${existingSurvey1Questions.length} 个问题，使用现有问题`);
    } else {
      survey1CreatedQuestions = await db.insert(schema.surveyQuestions).values(survey1Questions).returning();
      console.log(`      ✅ 创建了 ${survey1CreatedQuestions.length} 个问题`);
    }

    // 为调查1创建响应
    const survey1Responses: Array<{
      projectId: string;
      questionId: string;
      answer: string;
      numericValue: string;
      metadata?: Record<string, any>;
    }> = [];
    const survey1AnswerOptions = [
      ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied"],
      ["Definitely Yes", "Probably Yes", "Not Sure"],
      ["Extremely Important", "Very Important", "Moderately Important"],
      ["Yes, definitely", "Somewhat", "Not really"],
    ];
    const survey1NumericValues = [
      [9, 8, 6, 4],
      [10, 8, 5],
      [10, 8, 6],
      [9, 7, 4],
    ];

    for (let i = 0; i < survey1CreatedQuestions.length; i++) {
      const question = survey1CreatedQuestions[i];
      const options = survey1AnswerOptions[i] || survey1AnswerOptions[0];
      const values = survey1NumericValues[i] || [5];
      const responseCount = 25 + Math.floor(Math.random() * 15);
      
      for (let j = 0; j < responseCount; j++) {
        const optionIndex = Math.floor(Math.random() * options.length);
        survey1Responses.push({
          projectId: survey1Project.id,
          questionId: question.id,
          answer: options[optionIndex],
          numericValue: values[optionIndex].toString(),
          metadata: {
            timestamp: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
        });
      }
    }

    const existingSurvey1Responses = await db.select()
      .from(schema.surveyResponses)
      .where(eq(schema.surveyResponses.projectId, survey1Project.id));
    
    if (existingSurvey1Responses.length === 0) {
      await db.insert(schema.surveyResponses).values(survey1Responses);
      console.log(`      ✅ 创建了 ${survey1Responses.length} 个响应`);
    } else {
      console.log(`      ⚠️  已存在 ${existingSurvey1Responses.length} 个响应，跳过创建`);
    }

    // 调查2: 第二个项目（Energy）
    const survey2Project = createdProjects[1];
    console.log(`\n   📝 调查 2: "${survey2Project.title}"`);
    
    const survey2Questions = [
      {
        projectId: survey2Project.id,
        questionText: "How aware are you of our renewable energy initiatives?",
        questionType: "rating",
        options: ["Very Aware", "Somewhat Aware", "Not Very Aware", "Not Aware at All"],
        orderIndex: 1,
        isTemplate: false,
      },
      {
        projectId: survey2Project.id,
        questionText: "Do our energy-saving efforts influence your trust in our brand?",
        questionType: "scale",
        options: ["Significantly", "Moderately", "Slightly", "Not at All"],
        orderIndex: 2,
        isTemplate: false,
      },
      {
        projectId: survey2Project.id,
        questionText: "Would you pay more for products made with renewable energy?",
        questionType: "choice",
        options: ["Yes, definitely", "Probably", "Maybe", "Probably not", "Definitely not"],
        orderIndex: 3,
        isTemplate: false,
      },
    ];

    const existingSurvey2Questions = await db.select()
      .from(schema.surveyQuestions)
      .where(eq(schema.surveyQuestions.projectId, survey2Project.id));
    
    let survey2CreatedQuestions: typeof schema.surveyQuestions.$inferSelect[];
    if (existingSurvey2Questions.length > 0) {
      survey2CreatedQuestions = existingSurvey2Questions;
      console.log(`      ⚠️  已存在 ${existingSurvey2Questions.length} 个问题，使用现有问题`);
    } else {
      survey2CreatedQuestions = await db.insert(schema.surveyQuestions).values(survey2Questions).returning();
      console.log(`      ✅ 创建了 ${survey2CreatedQuestions.length} 个问题`);
    }

    // 为调查2创建响应
    const survey2Responses: Array<{
      projectId: string;
      questionId: string;
      answer: string;
      numericValue: string;
    }> = [];
    const survey2AnswerOptions = [
      ["Very Aware", "Somewhat Aware", "Not Very Aware"],
      ["Significantly", "Moderately", "Slightly"],
      ["Yes, definitely", "Probably", "Maybe"],
    ];
    const survey2NumericValues = [
      [9, 7, 4],
      [9, 8, 5],
      [10, 8, 6],
    ];

    for (let i = 0; i < survey2CreatedQuestions.length; i++) {
      const question = survey2CreatedQuestions[i];
      const options = survey2AnswerOptions[i];
      const values = survey2NumericValues[i];
      const responseCount = 20 + Math.floor(Math.random() * 15);
      
      for (let j = 0; j < responseCount; j++) {
        const optionIndex = Math.floor(Math.random() * options.length);
        survey2Responses.push({
          projectId: survey2Project.id,
          questionId: question.id,
          answer: options[optionIndex],
          numericValue: values[optionIndex].toString(),
        });
      }
    }

    const existingSurvey2Responses = await db.select()
      .from(schema.surveyResponses)
      .where(eq(schema.surveyResponses.projectId, survey2Project.id));
    
    if (existingSurvey2Responses.length === 0) {
      await db.insert(schema.surveyResponses).values(survey2Responses);
      console.log(`      ✅ 创建了 ${survey2Responses.length} 个响应`);
    } else {
      console.log(`      ⚠️  已存在 ${existingSurvey2Responses.length} 个响应，跳过创建`);
    }

    // 调查3: 第三个项目（Water）
    const survey3Project = createdProjects[2];
    console.log(`\n   📝 调查 3: "${survey3Project.title}"`);
    
    const survey3Questions = [
      {
        projectId: survey3Project.id,
        questionText: "How important is water conservation to you?",
        questionType: "scale",
        options: ["Extremely Important", "Very Important", "Moderately Important", "Slightly Important", "Not Important"],
        orderIndex: 1,
        isTemplate: false,
      },
      {
        projectId: survey3Project.id,
        questionText: "Are you aware of our water recycling initiatives?",
        questionType: "choice",
        options: ["Yes, very aware", "Somewhat aware", "Not really", "Not at all"],
        orderIndex: 2,
        isTemplate: false,
      },
      {
        projectId: survey3Project.id,
        questionText: "How would you rate our water conservation efforts?",
        questionType: "rating",
        options: ["Excellent", "Good", "Average", "Below Average", "Poor"],
        orderIndex: 3,
        isTemplate: false,
      },
      {
        projectId: survey3Project.id,
        questionText: "Would you support stricter water conservation regulations?",
        questionType: "choice",
        options: ["Strongly Support", "Support", "Neutral", "Oppose", "Strongly Oppose"],
        orderIndex: 4,
        isTemplate: false,
      },
    ];

    const existingSurvey3Questions = await db.select()
      .from(schema.surveyQuestions)
      .where(eq(schema.surveyQuestions.projectId, survey3Project.id));
    
    let survey3CreatedQuestions: typeof schema.surveyQuestions.$inferSelect[];
    if (existingSurvey3Questions.length > 0) {
      survey3CreatedQuestions = existingSurvey3Questions;
      console.log(`      ⚠️  已存在 ${existingSurvey3Questions.length} 个问题，使用现有问题`);
    } else {
      survey3CreatedQuestions = await db.insert(schema.surveyQuestions).values(survey3Questions).returning();
      console.log(`      ✅ 创建了 ${survey3CreatedQuestions.length} 个问题`);
    }

    // 为调查3创建响应
    const survey3Responses: Array<{
      projectId: string;
      questionId: string;
      answer: string;
      numericValue: string;
    }> = [];
    const survey3AnswerOptions = [
      ["Extremely Important", "Very Important", "Moderately Important"],
      ["Yes, very aware", "Somewhat aware", "Not really"],
      ["Excellent", "Good", "Average"],
      ["Strongly Support", "Support", "Neutral"],
    ];
    const survey3NumericValues = [
      [10, 8, 6],
      [9, 7, 4],
      [9, 8, 6],
      [10, 8, 5],
    ];

    for (let i = 0; i < survey3CreatedQuestions.length; i++) {
      const question = survey3CreatedQuestions[i];
      const options = survey3AnswerOptions[i];
      const values = survey3NumericValues[i];
      const responseCount = 22 + Math.floor(Math.random() * 18);
      
      for (let j = 0; j < responseCount; j++) {
        const optionIndex = Math.floor(Math.random() * options.length);
        survey3Responses.push({
          projectId: survey3Project.id,
          questionId: question.id,
          answer: options[optionIndex],
          numericValue: values[optionIndex].toString(),
        });
      }
    }

    const existingSurvey3Responses = await db.select()
      .from(schema.surveyResponses)
      .where(eq(schema.surveyResponses.projectId, survey3Project.id));
    
    if (existingSurvey3Responses.length === 0) {
      await db.insert(schema.surveyResponses).values(survey3Responses);
      console.log(`      ✅ 创建了 ${survey3Responses.length} 个响应`);
    } else {
      console.log(`      ⚠️  已存在 ${existingSurvey3Responses.length} 个响应，跳过创建`);
    }

    console.log(`\n   ✅ 共创建了 3 个完整的调查\n`);

    // ========== 4. 创建项目指标 ==========
    console.log("4️⃣  创建项目指标...");
    const metrics = [
      // 项目1的指标
      {
        projectId: createdProjects[0].id,
        metricName: "Packaging Recyclability Rate",
        value: "100%",
        unit: "percentage",
        targetValue: "100",
        currentValue: "95",
      },
      {
        projectId: createdProjects[0].id,
        metricName: "Plastic Waste Reduction",
        value: "2.5",
        unit: "tons",
        targetValue: "3.0",
        currentValue: "2.5",
      },
      // 项目2的指标
      {
        projectId: createdProjects[1].id,
        metricName: "Solar Energy Generation",
        value: "500",
        unit: "kWh",
        targetValue: "600",
        currentValue: "500",
      },
      {
        projectId: createdProjects[1].id,
        metricName: "Carbon Emission Reduction",
        value: "8.2",
        unit: "tons CO2",
        targetValue: "10.0",
        currentValue: "8.2",
      },
      // 项目3的指标
      {
        projectId: createdProjects[2].id,
        metricName: "Water Usage Reduction",
        value: "60%",
        unit: "percentage",
        targetValue: "60",
        currentValue: "55",
      },
      {
        projectId: createdProjects[2].id,
        metricName: "Water Recycled",
        value: "1200",
        unit: "liters",
        targetValue: "1500",
        currentValue: "1200",
      },
      // 项目4的指标
      {
        projectId: createdProjects[3].id,
        metricName: "Local Supplier Percentage",
        value: "80%",
        unit: "percentage",
        targetValue: "80",
        currentValue: "75",
      },
      {
        projectId: createdProjects[3].id,
        metricName: "Transportation CO2 Reduction",
        value: "1.8",
        unit: "tons CO2",
        targetValue: "2.0",
        currentValue: "1.8",
      },
      // 项目5的指标
      {
        projectId: createdProjects[4].id,
        metricName: "Waste Reduction Rate",
        value: "50%",
        unit: "percentage",
        targetValue: "50",
        currentValue: "45",
      },
      {
        projectId: createdProjects[4].id,
        metricName: "Landfill Waste Reduction",
        value: "4.2",
        unit: "tons",
        targetValue: "5.0",
        currentValue: "4.2",
      },
      // 项目6的指标
      {
        projectId: createdProjects[5].id,
        metricName: "Employee Training Completion",
        value: "85%",
        unit: "percentage",
        targetValue: "100",
        currentValue: "85",
      },
      {
        projectId: createdProjects[5].id,
        metricName: "Sustainability Awareness Score",
        value: "8.5",
        unit: "points",
        targetValue: "10",
        currentValue: "8.5",
      },
    ];

    const existingMetrics = await db.select()
      .from(schema.projectMetrics)
      .where(eq(schema.projectMetrics.projectId, createdProjects[0].id));
    
    let createdMetrics: typeof schema.projectMetrics.$inferSelect[];
    if (existingMetrics.length > 0) {
      createdMetrics = existingMetrics;
      console.log(`   ⚠️  已存在指标，使用现有指标`);
    } else {
      createdMetrics = await db.insert(schema.projectMetrics).values(metrics).returning();
      console.log(`   ✅ 创建了 ${createdMetrics.length} 个项目指标`);
    }
    console.log("");

    // ========== 5. 计算并更新项目的 impactScore ==========
    console.log("5️⃣  计算项目 Impact Score...");
    for (const project of createdProjects) {
      const projectMetrics = createdMetrics.filter(m => m.projectId === project.id);
      if (projectMetrics.length > 0) {
        const impactScore = calculateImpactScore(projectMetrics);
        await db.update(schema.projects)
          .set({ impactScore: impactScore.toString() })
          .where(eq(schema.projects.id, project.id));
        console.log(`   ✅ "${project.title}": Impact Score = ${impactScore}`);
      }
    }
    console.log("");

    // ========== 6. 创建QR码扫描记录 ==========
    console.log("6️⃣  创建QR码扫描记录...");
    const qrScans: Array<{
      projectId: string;
      metadata?: Record<string, any>;
    }> = [];
    
    // 为3个有调查的项目创建扫描记录
    const surveyProjects = [survey1Project, survey2Project, survey3Project];
    for (const project of surveyProjects) {
      const scanCount = 30 + Math.floor(Math.random() * 20);
      for (let i = 0; i < scanCount; i++) {
        qrScans.push({
          projectId: project.id,
          metadata: {
            timestamp: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
            userAgent: ["Mobile Device", "Desktop", "Tablet"][Math.floor(Math.random() * 3)],
          },
        });
      }
    }

    const existingScans = await db.select()
      .from(schema.qrCodeScans)
      .where(eq(schema.qrCodeScans.projectId, survey1Project.id));
    
    if (existingScans.length === 0) {
      await db.insert(schema.qrCodeScans).values(qrScans);
      console.log(`   ✅ 创建了 ${qrScans.length} 个QR码扫描记录\n`);
    } else {
      console.log(`   ⚠️  已存在扫描记录，跳过创建\n`);
    }

    // ========== 7. 创建目标 ==========
    console.log("7️⃣  创建目标...");
    const goals = [
      {
        userId: createdUsers[0].id,
        title: "Achieve 100% Recycled Packaging by Q2 2025",
        description: "Complete transition to 100% recycled packaging materials across all product lines",
        targetValue: "100",
        currentValue: "95",
        unit: "percentage",
        category: "Packaging",
        targetDate: new Date("2025-06-30"),
        status: "active" as const,
      },
      {
        userId: createdUsers[0].id,
        title: "Reduce Carbon Footprint by 20%",
        description: "Implement energy-saving measures to reduce overall carbon emissions",
        targetValue: "20",
        currentValue: "15",
        unit: "percentage",
        category: "Energy",
        targetDate: new Date("2025-12-31"),
        status: "active" as const,
      },
      {
        userId: createdUsers[1].id,
        title: "Increase Local Sourcing to 80%",
        description: "Source 80% of materials from local suppliers within 100km",
        targetValue: "80",
        currentValue: "75",
        unit: "percentage",
        category: "Sourcing",
        targetDate: new Date("2025-09-30"),
        status: "active" as const,
      },
    ];

    const existingGoals = await db.select()
      .from(schema.goals)
      .where(eq(schema.goals.userId, createdUsers[0].id));
    
    if (existingGoals.length === 0) {
      await db.insert(schema.goals).values(goals);
      console.log(`   ✅ 创建了 ${goals.length} 个目标\n`);
    } else {
      console.log(`   ⚠️  已存在目标，跳过创建\n`);
    }

    // ========== 8. 创建团队成员 ==========
    console.log("8️⃣  创建团队成员...");
    const teamMembers = [
      {
        userId: createdUsers[0].id,
        email: "john.smith@example.com",
        role: "Sustainability Manager",
      },
      {
        userId: createdUsers[0].id,
        email: "sarah.johnson@example.com",
        role: "Environmental Analyst",
      },
      {
        userId: createdUsers[1].id,
        email: "mike.williams@example.com",
        role: "Sustainability Coordinator",
      },
    ];

    const existingTeamMembers = await db.select()
      .from(schema.teamMembers)
      .where(eq(schema.teamMembers.userId, createdUsers[0].id));
    
    if (existingTeamMembers.length === 0) {
      await db.insert(schema.teamMembers).values(teamMembers);
      console.log(`   ✅ 创建了 ${teamMembers.length} 个团队成员\n`);
    } else {
      console.log(`   ⚠️  已存在团队成员，跳过创建\n`);
    }

    // ========== 总结 ==========
    console.log("✅ 测试数据生成完成！\n");
    console.log("📋 测试账户信息:");
    console.log("   用户 1:");
    console.log("     用户名: alice");
    console.log("     密码: alice123");
    console.log("     邮箱: alice@example.com");
    console.log("     公司: GreenTech Solutions");
    console.log("");
    console.log("   用户 2:");
    console.log("     用户名: bob");
    console.log("     密码: bob123");
    console.log("     邮箱: bob@example.com");
    console.log("     公司: EcoInnovate Inc");
    console.log("");
    console.log("📊 生成的数据统计:");
    console.log(`   - ${createdUsers.length} 个用户`);
    console.log(`   - ${createdProjects.length} 个项目（${createdProjects.map(p => p.type).join(", ")})`);
    console.log(`   - 3 个完整的调查（包含问题和响应）`);
    const totalQuestions = (survey1CreatedQuestions.length + survey2CreatedQuestions.length + survey3CreatedQuestions.length);
    const totalResponses = (existingSurvey1Responses.length > 0 ? existingSurvey1Responses.length : survey1Responses.length) +
                          (existingSurvey2Responses.length > 0 ? existingSurvey2Responses.length : survey2Responses.length) +
                          (existingSurvey3Responses.length > 0 ? existingSurvey3Responses.length : survey3Responses.length);
    console.log(`   - ${totalQuestions} 个调查问题`);
    console.log(`   - ${totalResponses} 个调查响应`);
    console.log(`   - ${qrScans.length} 个QR码扫描记录`);
    console.log(`   - ${createdMetrics.length} 个项目指标`);
    console.log(`   - ${goals.length} 个目标`);
    console.log(`   - ${teamMembers.length} 个团队成员\n`);

  } catch (error) {
    console.error("❌ 生成测试数据时出错:", error);
    throw error;
  }
}

// 运行脚本
generateTestData()
  .then(() => {
    console.log("✨ 脚本执行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 脚本执行失败:", error);
    process.exit(1);
  });

