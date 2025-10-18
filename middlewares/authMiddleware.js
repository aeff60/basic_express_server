import jwt from "jsonwebtoken"
import userService from "../services/userService.js";

const authMiddleware = () => {
  return async (req, res, next) => {
    try {
      const jwt_secret = process.env.JWT_SECRET;
      const authHeader = req.headers['authorization'];
      
      if (!authHeader) {
        return res.status(401).json({
          message: "ไม่พบ Token การยืนยันตัวตน"
        });
      }
      
      const tokenArray = authHeader.split(' ');
      if (tokenArray.length !== 2 || tokenArray[0] !== 'Bearer') {
        return res.status(401).json({
          message: "รูปแบบ Token ไม่ถูกต้อง"
        });
      }
      
      const decodedToken = jwt.verify(tokenArray[1], jwt_secret);
      const user = await userService.getUserById(decodedToken.userId);
      
      if(!user || !user.isActive){
        return res.status(401).json({
          message: "ผู้ใช้ไม่มีสิทธิ์หรือบัญชีถูกระงับ"
        });
      }
      
      // Attach full user info to request
      req.user = {
        userId: decodedToken.userId,
        name: decodedToken.name,
        employeeId: decodedToken.employeeId,
        role: decodedToken.role,
        department: decodedToken.department
      };
      
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: "Token หมดอายุ กรุณาเข้าสู่ระบบใหม่"
        });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          message: "Token ไม่ถูกต้อง"
        });
      } else {
        return res.status(401).json({
          message: "ไม่มีสิทธิ์เข้าถึง"
        });
      }
    }
  }
}

export default authMiddleware
