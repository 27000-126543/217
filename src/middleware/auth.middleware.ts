import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { config } from "../config";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { UserRole } from "../entities/enums";

interface AuthRequest extends Request {
  user?: User;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    const token = authHeader.substring(7);
    const decoded: any = jwt.verify(token, config.jwt.secret);

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: decoded.userId } });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "用户不存在或已被禁用" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "认证令牌无效或已过期" });
  }
};

export const roleMiddleware = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "未认证" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "权限不足" });
    }

    next();
  };
};
