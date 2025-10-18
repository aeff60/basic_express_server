import Attendance from "../models/Attendance.js"
import User from "../models/User.js"

const attendanceController = {
  // Clock In
  clockIn: async (req, res) => {
    try {
      const { userId } = req.user; // From JWT token
      const { location } = req.body;
      
      const today = new Date();
      const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Check if already clocked in today
      let attendance = await Attendance.findOne({
        employeeId: userId,
        date: dateOnly
      });
      
      if (attendance && attendance.checkIn) {
        return res.status(400).json({
          message: "คุณได้ลงเวลาเข้างานวันนี้แล้ว"
        });
      }
      
      // Create or update attendance record
      if (!attendance) {
        attendance = new Attendance({
          employeeId: userId,
          date: dateOnly
        });
      }
      
      attendance.checkIn = new Date();
      attendance.status = 'present';
      
      if (location) {
        attendance.location = {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        };
      }
      
      await attendance.save();
      
      const user = await User.findById(userId).select('name employeeId department');
      
      res.status(200).json({
        message: "ลงเวลาเข้างานสำเร็จ",
        attendance: attendance,
        employee: user
      });
      
    } catch (error) {
      res.status(500).json({
        message: "เกิดข้อผิดพลาดในการลงเวลาเข้างาน",
        error: error.message
      });
    }
  },

  // Clock Out
  clockOut: async (req, res) => {
    try {
      const { userId } = req.user;
      const { location } = req.body;
      
      const today = new Date();
      const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const attendance = await Attendance.findOne({
        employeeId: userId,
        date: dateOnly
      });
      
      if (!attendance || !attendance.checkIn) {
        return res.status(400).json({
          message: "คุณยังไม่ได้ลงเวลาเข้างานวันนี้"
        });
      }
      
      if (attendance.checkOut) {
        return res.status(400).json({
          message: "คุณได้ลงเวลาออกงานวันนี้แล้ว"
        });
      }
      
      attendance.checkOut = new Date();
      
      if (location) {
        attendance.location = {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        };
      }
      
      await attendance.save();
      
      const user = await User.findById(userId).select('name employeeId department');
      
      res.status(200).json({
        message: "ลงเวลาออกงานสำเร็จ",
        attendance: attendance,
        employee: user
      });
      
    } catch (error) {
      res.status(500).json({
        message: "เกิดข้อผิดพลาดในการลงเวลาออกงาน",
        error: error.message
      });
    }
  },

  // Start Break
  startBreak: async (req, res) => {
    try {
      const { userId } = req.user;
      
      const today = new Date();
      const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const attendance = await Attendance.findOne({
        employeeId: userId,
        date: dateOnly
      });
      
      if (!attendance || !attendance.checkIn) {
        return res.status(400).json({
          message: "คุณยังไม่ได้ลงเวลาเข้างานวันนี้"
        });
      }
      
      if (attendance.breakStart) {
        return res.status(400).json({
          message: "คุณได้เริ่มพักแล้ว"
        });
      }
      
      attendance.breakStart = new Date();
      await attendance.save();
      
      res.status(200).json({
        message: "เริ่มพักแล้ว",
        attendance: attendance
      });
      
    } catch (error) {
      res.status(500).json({
        message: "เกิดข้อผิดพลาด",
        error: error.message
      });
    }
  },

  // End Break
  endBreak: async (req, res) => {
    try {
      const { userId } = req.user;
      
      const today = new Date();
      const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const attendance = await Attendance.findOne({
        employeeId: userId,
        date: dateOnly
      });
      
      if (!attendance || !attendance.breakStart) {
        return res.status(400).json({
          message: "คุณยังไม่ได้เริ่มพัก"
        });
      }
      
      if (attendance.breakEnd) {
        return res.status(400).json({
          message: "คุณได้จบการพักแล้ว"
        });
      }
      
      attendance.breakEnd = new Date();
      await attendance.save();
      
      res.status(200).json({
        message: "จบการพักแล้ว",
        attendance: attendance
      });
      
    } catch (error) {
      res.status(500).json({
        message: "เกิดข้อผิดพลาด",
        error: error.message
      });
    }
  },

  // Get Today's Attendance
  getTodayAttendance: async (req, res) => {
    try {
      const { userId } = req.user;
      
      const today = new Date();
      const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const attendance = await Attendance.findOne({
        employeeId: userId,
        date: dateOnly
      }).populate('employeeId', 'name employeeId department position');
      
      res.status(200).json({
        attendance: attendance || null
      });
      
    } catch (error) {
      res.status(500).json({
        message: "เกิดข้อผิดพลาด",
        error: error.message
      });
    }
  },

  // Get Attendance History
  getAttendanceHistory: async (req, res) => {
    try {
      const { userId } = req.user;
      const { page = 1, limit = 10, startDate, endDate } = req.query;
      
      let query = { employeeId: userId };
      
      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      const attendanceHistory = await Attendance.find(query)
        .populate('employeeId', 'name employeeId department position')
        .sort({ date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      const total = await Attendance.countDocuments(query);
      
      res.status(200).json({
        attendanceHistory,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      });
      
    } catch (error) {
      res.status(500).json({
        message: "เกิดข้อผิดพลาด",
        error: error.message
      });
    }
  },

  // Get All Employees Attendance (Admin/HR only)
  getAllAttendance: async (req, res) => {
    try {
      const { role } = req.user;
      
      if (role !== 'admin' && role !== 'hr') {
        return res.status(403).json({
          message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้"
        });
      }
      
      const { page = 1, limit = 20, date, department } = req.query;
      
      let query = {};
      
      if (date) {
        const queryDate = new Date(date);
        query.date = {
          $gte: new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate()),
          $lt: new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate() + 1)
        };
      } else {
        // Default to today
        const today = new Date();
        query.date = {
          $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        };
      }
      
      let pipeline = [
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee'
          }
        },
        { $unwind: '$employee' }
      ];
      
      if (department) {
        pipeline.push({
          $match: { 'employee.department': department }
        });
      }
      
      pipeline.push(
        { $sort: { 'employee.name': 1 } },
        { $skip: (page - 1) * limit },
        { $limit: parseInt(limit) }
      );
      
      const attendanceRecords = await Attendance.aggregate(pipeline);
      
      const totalPipeline = [...pipeline.slice(0, -2)];
      const totalResult = await Attendance.aggregate([
        ...totalPipeline,
        { $count: "total" }
      ]);
      
      const total = totalResult.length > 0 ? totalResult[0].total : 0;
      
      res.status(200).json({
        attendanceRecords,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      });
      
    } catch (error) {
      res.status(500).json({
        message: "เกิดข้อผิดพลาด",
        error: error.message
      });
    }
  },

  // Get Attendance Statistics
  getAttendanceStats: async (req, res) => {
    try {
      const { userId, role } = req.user;
      const { month, year } = req.query;
      
      const currentDate = new Date();
      const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
      const targetYear = year ? parseInt(year) : currentDate.getFullYear();
      
      const startDate = new Date(targetYear, targetMonth, 1);
      const endDate = new Date(targetYear, targetMonth + 1, 0);
      
      let query = {
        date: { $gte: startDate, $lte: endDate }
      };
      
      if (role === 'employee') {
        query.employeeId = userId;
      }
      
      const stats = await Attendance.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalDays: { $sum: 1 },
            presentDays: {
              $sum: {
                $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0]
              }
            },
            lateDays: {
              $sum: {
                $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
              }
            },
            absentDays: {
              $sum: {
                $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
              }
            },
            totalWorkHours: { $sum: '$workHours' },
            totalOvertimeHours: { $sum: '$overtimeHours' },
            avgWorkHours: { $avg: '$workHours' }
          }
        }
      ]);
      
      const result = stats.length > 0 ? stats[0] : {
        totalDays: 0,
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        totalWorkHours: 0,
        totalOvertimeHours: 0,
        avgWorkHours: 0
      };
      
      res.status(200).json({
        month: targetMonth + 1,
        year: targetYear,
        stats: result
      });
      
    } catch (error) {
      res.status(500).json({
        message: "เกิดข้อผิดพลาด",
        error: error.message
      });
    }
  }
}

export default attendanceController