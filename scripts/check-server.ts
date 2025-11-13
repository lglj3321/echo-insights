/**
 * 服务器检查脚本
 * 检查服务器是否运行以及API是否可访问
 */

const BASE_URL = process.env.TEST_BASE_URL || `http://localhost:${process.env.PORT || '3000'}`;

async function checkServer() {
  console.log(`\n🔍 检查服务器: ${BASE_URL}\n`);

  // 测试1: 检查服务器是否运行
  try {
    const response = await fetch(`${BASE_URL}/api/auth/user`, {
      credentials: 'include',
    });
    
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    
    if (contentType.includes('text/html')) {
      console.log('❌ 服务器返回HTML而不是JSON');
      console.log('   这可能意味着：');
      console.log('   1. API路由未正确配置');
      console.log('   2. 服务器端口错误');
      console.log('   3. 请求被重定向到HTML页面\n');
      return false;
    }
    
    if (response.status === 401 || response.ok) {
      console.log('✅ 服务器运行正常，API可访问\n');
      return true;
    }
    
    console.log(`⚠️  服务器响应状态: ${response.status}\n`);
    return true;
  } catch (error: any) {
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      console.log('❌ 无法连接到服务器');
      console.log(`   错误: ${error.message}\n`);
      console.log('请确保：');
      console.log('  1. 开发服务器正在运行: npm run dev');
      console.log(`  2. 服务器地址正确: ${BASE_URL}`);
      console.log('  3. 端口没有被其他程序占用\n');
      return false;
    }
    console.log(`❌ 错误: ${error.message}\n`);
    return false;
  }
}

checkServer().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('错误:', error);
  process.exit(1);
});

