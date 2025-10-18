import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import userService from "../services/userService.js"

const userController = {
  getAllUsers: async (req, res) => {
    try{
      const users = await userService.getAllUsers()
      res.status(200).json(users)
    } catch(err) {
      res.status(500).json(err)
    }
  },
  getUserById: async (req, res) => {
    try {
      const id = req.params.id
      const user = await userService.getUserById(id)
      res.status(200).json(user)
    } catch(err) {
      res.status(500).json(err)
    }
    
  },
  register: async (req, res) => {
    try{
      const { name, password, employeeId, email, department, position, salary, phone } = req.body
      
      // Check if employee ID already exists
      const existingEmployee = await userService.getByEmployeeId(employeeId);
      if (existingEmployee) {
        return res.status(400).json({
          message: "รหัสพนักงานนี้มีอยู่แล้ว"
        });
      }
      
      // Check if email already exists
      const existingEmail = await userService.getByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          message: "อีเมลนี้ถูกใช้งานแล้ว"
        });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await userService.create({
        name, password: hashedPassword, employeeId, email, 
        department, position, salary, phone
      })
      
      // Remove password from response
      const userResponse = { ...user.toObject() };
      delete userResponse.password;
      
      res.status(201).json({
        message: "ลงทะเบียนพนักงานสำเร็จ",
        user: userResponse
      })
    } catch(err){
      res.status(500).json({
        message: "เกิดข้อผิดพลาดในการลงทะเบียน",
        error: err.message
      })
    }
  },
  login: async (req, res) => {
    try {
      const { employeeId, password } = req.body
      
      // Try to find user by employeeId or email
      let user = await userService.getByEmployeeId(employeeId);
      if (!user) {
        user = await userService.getByEmail(employeeId);
      }
      
      if(!user){
        return res.status(401).json({
          message: "รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง"
        });
      }
      
      if (!user.isActive) {
        return res.status(401).json({
          message: "บัญชีผู้ใช้ถูกระงับการใช้งาน"
        });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if(!isMatch){
        return res.status(401).json({
          message: "รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง"
        });
      }
      
      const jwt_secret = process.env.JWT_SECRET;
      const payload = { 
        name: user.name, 
        userId: user._id, 
        employeeId: user.employeeId,
        role: user.role,
        department: user.department
      }
      const token = jwt.sign(payload, jwt_secret, { expiresIn: "8h" });
      
      // Remove password from response
      const userResponse = { ...user.toObject() };
      delete userResponse.password;
      
      res.status(200).json({
        message: "เข้าสู่ระบบสำเร็จ",
        token: token,
        user: userResponse
      })
    } catch(err) {
      res.status(500).json({ 
        message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
        error: err.message 
      })
    }
  }
}

export default userController