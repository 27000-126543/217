import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { config } from "../config";
import { UserRole } from "../entities/enums";

class AuthController {
  private userRepo = AppDataSource.getRepository(User);

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      const user = await this.userRepo.findOne({ where: { username } });

      if (!user || !user.isActive) {
        return res.status(401).json({ message: "用户名或密码错误" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "用户名或密码错误" });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.realName,
          phone: user.phone,
          email: user.email,
          role: user.role,
          department: user.department,
          team: user.team,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "登录失败", error });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { username, password, realName, phone, email, role, department, team } = req.body;

      const existingUser = await this.userRepo.findOne({
        where: [{ username }, { phone }],
      });

      if (existingUser) {
        return res.status(400).json({ message: "用户名或手机号已存在" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = this.userRepo.create({
        username,
        password: hashedPassword,
        realName,
        phone,
        email,
        role: role || UserRole.MAINTENANCE_WORKER,
        department,
        team,
      });

      const savedUser = await this.userRepo.save(user);

      res.status(201).json({
        id: savedUser.id,
        username: savedUser.username,
        realName: savedUser.realName,
      });
    } catch (error) {
      res.status(500).json({ message: "注册失败", error });
    }
  }

  async getCurrentUser(req: any, res: Response) {
    try {
      const user = req.user;
      res.json({
        id: user.id,
        username: user.username,
        realName: user.realName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        department: user.department,
        team: user.team,
      });
    } catch (error) {
      res.status(500).json({ message: "获取用户信息失败", error });
    }
  }
}

export const authController = new AuthController();
