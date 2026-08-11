/**
 * 测试数据种子脚本
 * 用于填充数据库以测试完整工作流
 * 
 * 使用方法:
 * 1. 确保设置了 DATABASE_URL 环境变量（通过 .env 文件或环境变量）
 * 2. 运行: npx tsx scripts/seed-test-data.ts
 * 
 * 或者使用环境变量:
 * DATABASE_URL=your_database_url npx tsx scripts/seed-test-data.ts
 */

import * as schema from "../shared/schema";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

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
import { hashPassword } from "../api/_lib/auth.js";
import { eq } from "drizzle-orm";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

// 初始化数据库连接
function initDb() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ 错误: DATABASE_URL 环境变量未设置\n");
    console.error("📝 解决方案（选择其中一种）:\n");
    console.error("方法 1: 创建 .env 文件（推荐）");
    console.error("  1. 在项目根目录创建 .env 文件");
    console.error("  2. 添加以下内容:");
    console.error("     DATABASE_URL=postgresql://username:password@host:port/database\n");
    console.error("方法 2: 使用环境变量");
    console.error("  export DATABASE_URL='postgresql://username:password@host:port/database'");
    console.error("  npx tsx scripts/seed-test-data.ts\n");
    console.error("方法 3: 在命令中直接设置");
    console.error("  DATABASE_URL='postgresql://username:password@host:port/database' npx tsx scripts/seed-test-data.ts\n");
    console.error("💡 数据库连接字符串示例:");
    console.error("  - Neon PostgreSQL: postgresql://user:pass@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require");
    console.error("  - 本地 PostgreSQL: postgresql://postgres:password@localhost:5432/ecofeedback");
    console.error("  - Supabase: postgresql://postgres:password@db.xxx.supabase.co:5432/postgres\n");
    process.exit(1);
  }

  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return drizzle({ client: pool, schema });
}

async function seedTestData() {
  console.log("🌱 开始填充测试数据...\n");

  // 初始化数据库连接
  const db = initDb();

  try {
    // 测试数据库连接
    console.log("🔌 测试数据库连接...");
    try {
      // 简单的查询测试连接
      await db.select().from(schema.users).limit(1);
      console.log("   ✅ 数据库连接成功\n");
    } catch (error: any) {
      console.error("   ❌ 数据库连接失败:", error.message);
      throw error;
    }

    // 1. 创建测试用户（如果已存在则跳过）
    console.log("1. 创建测试用户...");
    const hashedPassword = await hashPassword("test123");
    
    // 检查用户是否已存在
    const existingUser = await db.select().from(schema.users).where(eq(schema.users.username, "testuser")).limit(1);
    
    let testUser;
    if (existingUser.length > 0) {
      console.log("   ⚠️  测试用户已存在，使用现有用户");
      testUser = existingUser[0];
      console.log(`   ✅ 使用现有用户: ${testUser.username} (ID: ${testUser.id})\n`);
    } else {
      const [newUser] = await db.insert(schema.users).values({
        username: "testuser",
        password: hashedPassword,
        email: "test@example.com",
      }).returning();
      testUser = newUser;
      console.log(`   ✅ 创建用户: ${testUser.username} (ID: ${testUser.id})\n`);
    }

    // 2. 创建项目
    console.log("2. 创建测试项目...");
    const projects = [
      {
        userId: testUser.id,
        title: "100% Recycled Packaging Initiative",
        description: "Switch all product packaging to 100% recycled materials to reduce environmental impact",
        type: "Packaging",
        customCategory: "Packaging",
        estimatedCost: "45000",
        roi: "18",
        co2Saved: "2.5",
        waterSaved: "500",
        status: "active" as const,
      },
      {
        userId: testUser.id,
        title: "Solar Energy Installation",
        description: "Install solar panels on manufacturing facilities to reduce carbon footprint",
        type: "Energy",
        customCategory: "Energy",
        estimatedCost: "120000",
        roi: "25",
        co2Saved: "8.2",
        status: "active" as const,
      },
      {
        userId: testUser.id,
        title: "Local Sourcing Initiative",
        description: "Source 80% of ingredients from local suppliers within 100km radius",
        type: "Sourcing",
        customCategory: "Sourcing",
        estimatedCost: "28000",
        roi: "12",
        co2Saved: "1.8",
        status: "active" as const,
      },
      {
        userId: testUser.id,
        title: "Water Recycling System",
        description: "Implement advanced water recycling in production to reduce water consumption",
        type: "Water",
        customCategory: "Water",
        estimatedCost: "75000",
        roi: "20",
        co2Saved: "3.5",
        waterSaved: "1200",
        status: "active" as const,
      },
    ];

    const createdProjects = await db.insert(schema.projects).values(projects).returning();
    console.log(`   ✅ 创建了 ${createdProjects.length} 个项目\n`);

    // 3. 为第一个项目创建调查问题
    console.log("3. 创建调查问题...");
    const project1 = createdProjects[0];
    const surveyQuestions = [
      {
        projectId: project1.id,
        questionText: "How satisfied are you with the sustainability of our packaging?",
        questionType: "rating",
        options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
        orderIndex: 1,
        isTemplate: false,
      },
      {
        projectId: project1.id,
        questionText: "Would you prefer products with biodegradable packaging?",
        questionType: "choice",
        options: ["Definitely Yes", "Probably Yes", "Not Sure", "Probably No", "Definitely No"],
        orderIndex: 2,
        isTemplate: false,
      },
      {
        projectId: project1.id,
        questionText: "How important is recyclable packaging in your purchase decision?",
        questionType: "scale",
        options: ["Extremely Important", "Very Important", "Moderately Important", "Slightly Important", "Not Important"],
        orderIndex: 3,
        isTemplate: false,
      },
    ];

    const createdQuestions = await db.insert(schema.surveyQuestions).values(surveyQuestions).returning();
    console.log(`   ✅ 为项目 "${project1.title}" 创建了 ${createdQuestions.length} 个调查问题\n`);

    // 4. 创建调查响应
    console.log("4. 创建调查响应...");
    const responses = [];
    const answerOptions = [
      ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied"],
      ["Definitely Yes", "Probably Yes", "Not Sure"],
      ["Extremely Important", "Very Important", "Moderately Important"],
    ];
    const numericValues = [
      [9, 8, 6, 4],
      [10, 8, 5],
      [10, 8, 6],
    ];

    // 为每个问题创建多个响应
    for (let i = 0; i < createdQuestions.length; i++) {
      const question = createdQuestions[i];
      const options = answerOptions[i];
      const values = numericValues[i];
      
      // 每个问题创建20-30个响应
      const responseCount = 20 + Math.floor(Math.random() * 11);
      
      for (let j = 0; j < responseCount; j++) {
        const optionIndex = Math.floor(Math.random() * options.length);
        responses.push({
          projectId: project1.id,
          questionId: question.id,
          answer: options[optionIndex],
          numericValue: values[optionIndex].toString(),
          metadata: {
            timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        });
      }
    }

    await db.insert(schema.surveyResponses).values(responses);
    console.log(`   ✅ 创建了 ${responses.length} 个调查响应\n`);

    // 5. 创建QR码扫描记录
    console.log("5. 创建QR码扫描记录...");
    const qrScans = [];
    // 创建比响应数更多的扫描（模拟有人扫描但未完成调查）
    const scanCount = responses.length + Math.floor(responses.length * 0.3);
    
    for (let i = 0; i < scanCount; i++) {
      qrScans.push({
        projectId: project1.id,
        metadata: {
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          userAgent: "Mobile Device",
        },
      });
    }

    await db.insert(schema.qrCodeScans).values(qrScans);
    console.log(`   ✅ 创建了 ${qrScans.length} 个QR码扫描记录\n`);

    // 6. 为其他项目创建一些调查问题
    console.log("6. 为其他项目创建调查问题...");
    const project2 = createdProjects[1];
    const project2Questions = [
      {
        projectId: project2.id,
        questionText: "How aware are you of our renewable energy initiatives?",
        questionType: "rating",
        options: ["Very Aware", "Somewhat Aware", "Not Very Aware", "Not Aware at All"],
        orderIndex: 1,
        isTemplate: false,
      },
      {
        projectId: project2.id,
        questionText: "Do our energy-saving efforts influence your trust in our brand?",
        questionType: "scale",
        options: ["Significantly", "Moderately", "Slightly", "Not at All"],
        orderIndex: 2,
        isTemplate: false,
      },
    ];

    const project2CreatedQuestions = await db.insert(schema.surveyQuestions).values(project2Questions).returning();
    
    // 为项目2创建一些响应
    const project2Responses = [];
    for (let i = 0; i < project2CreatedQuestions.length; i++) {
      const question = project2CreatedQuestions[i];
      const responseCount = 15 + Math.floor(Math.random() * 10);
      
      for (let j = 0; j < responseCount; j++) {
        project2Responses.push({
          projectId: project2.id,
          questionId: question.id,
          answer: i === 0 ? ["Very Aware", "Somewhat Aware"][Math.floor(Math.random() * 2)] : ["Significantly", "Moderately"][Math.floor(Math.random() * 2)],
          numericValue: i === 0 ? ["9", "7"][Math.floor(Math.random() * 2)] : ["9", "8"][Math.floor(Math.random() * 2)],
        });
      }
    }

    await db.insert(schema.surveyResponses).values(project2Responses);
    console.log(`   ✅ 为项目 "${project2.title}" 创建了 ${project2CreatedQuestions.length} 个问题和 ${project2Responses.length} 个响应\n`);

    // 7. 创建项目指标
    console.log("7. 创建项目指标...");
    const metrics = [
      {
        projectId: project1.id,
        metricName: "Packaging Recyclability Rate",
        value: "100%",
        unit: "percentage",
        targetValue: "100",
        currentValue: "95",
      },
      {
        projectId: project1.id,
        metricName: "Plastic Waste Reduction",
        value: "2.5",
        unit: "tons",
        targetValue: "3.0",
        currentValue: "2.5",
      },
      {
        projectId: project2.id,
        metricName: "Solar Energy Generation",
        value: "500",
        unit: "kWh",
        targetValue: "600",
        currentValue: "500",
      },
      {
        projectId: project2.id,
        metricName: "Carbon Emission Reduction",
        value: "8.2",
        unit: "tons CO2",
        targetValue: "10.0",
        currentValue: "8.2",
      },
    ];

    await db.insert(schema.projectMetrics).values(metrics);
    console.log(`   ✅ 创建了 ${metrics.length} 个项目指标\n`);

    // 8. 创建目标
    console.log("8. 创建目标...");
    const goals = [
      {
        userId: testUser.id,
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
        userId: testUser.id,
        title: "Reduce Carbon Footprint by 20%",
        description: "Implement energy-saving measures to reduce overall carbon emissions",
        targetValue: "20",
        currentValue: "15",
        unit: "percentage",
        category: "Energy",
        targetDate: new Date("2025-12-31"),
        status: "active" as const,
      },
    ];

    await db.insert(schema.goals).values(goals);
    console.log(`   ✅ 创建了 ${goals.length} 个目标\n`);

    // 9. 创建团队成员
    console.log("9. 创建团队成员...");
    const teamMembers = [
      {
        userId: testUser.id,
        email: "john.smith@example.com",
        role: "Sustainability Manager",
      },
      {
        userId: testUser.id,
        email: "sarah.johnson@example.com",
        role: "Environmental Analyst",
      },
    ];

    await db.insert(schema.teamMembers).values(teamMembers);
    console.log(`   ✅ 创建了 ${teamMembers.length} 个团队成员\n`);

    console.log("✅ 测试数据填充完成！\n");
    console.log("📋 测试账户信息:");
    console.log("   用户名: testuser");
    console.log("   密码: test123");
    console.log("   邮箱: test@example.com\n");
    console.log("📊 创建的数据:");
    console.log(`   - ${createdProjects.length} 个项目`);
    console.log(`   - ${createdQuestions.length + project2CreatedQuestions.length} 个调查问题`);
    console.log(`   - ${responses.length + project2Responses.length} 个调查响应`);
    console.log(`   - ${qrScans.length} 个QR码扫描`);
    console.log(`   - ${metrics.length} 个项目指标`);
    console.log(`   - ${goals.length} 个目标`);
    console.log(`   - ${teamMembers.length} 个团队成员\n`);

  } catch (error) {
    console.error("❌ 填充测试数据时出错:", error);
    throw error;
  }
}

// 运行脚本
seedTestData()
  .then(() => {
    console.log("✨ 脚本执行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 脚本执行失败:", error);
    process.exit(1);
  });

