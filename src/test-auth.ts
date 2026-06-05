import "reflect-metadata";
import * as dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { User } from "./entities/User";
import * as bcrypt from "bcryptjs";

dotenv.config();

async function test() {
  try {
    await AppDataSource.initialize();
    console.log("数据库连接成功");

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { username: "admin" } });
    
    if (user) {
      console.log("找到用户:", user.username, user.role);
      console.log("密码哈希长度:", user.password.length);
      
      const testPassword = "123456";
      const result = await bcrypt.compare(testPassword, user.password);
      console.log("密码验证结果:", result);
      
      if (!result) {
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log("重新生成的哈希:", newHash);
        user.password = newHash;
        await userRepo.save(user);
        console.log("密码已重置为 123456");
        
        const result2 = await bcrypt.compare(testPassword, newHash);
        console.log("重置后验证结果:", result2);
      }
    } else {
      console.log("未找到用户 admin");
      const users = await userRepo.find();
      console.log("所有用户:", users.map(u => u.username));
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error("测试失败:", error);
  }
}

test();
