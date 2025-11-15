// api/index.ts (Vercel Handler)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app, registerRoutes, errorHandler } from '../server/index'; // 导入 app 和
 
// Vercel Serverless Functions 在两次调用之间会“冻结”
// 我们需要一个变量来跟踪是否已经初始化了路由
let routesInitialized = false;
 
export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (!routesInitialized) {
      // 这是“冷启动”
      // 1. 等待所有异步路由注册完成
      await registerRoutes(app);
      
      // 2. 在路由 *之后* 添加错误处理器
      app.use(errorHandler);
      
      // 3. 标记为已初始化
      routesInitialized = true;
      console.log("Routes initialized (cold start)");
    }
    
    // 4. 将请求交给配置好的 Express app 处理
    // (req as any, res as any) 是必需的类型转换
    await app(req as any, res as any);

  } catch (error) {
    console.error("Unhandled Vercel handler error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};