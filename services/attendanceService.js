import Attendance from "../models/Attendance.js"

const attendanceService = {
  createAttendance: async (attendanceData) => {
    return await Attendance.create(attendanceData);
  },

  findTodayAttendance: async (employeeId) => {
    const today = new Date();
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return await Attendance.findOne({
      employeeId: employeeId,
      date: dateOnly
    }).populate('employeeId', 'name employeeId department position');
  },

  updateAttendance: async (id, updateData) => {
    return await Attendance.findByIdAndUpdate(id, updateData, { new: true })
      .populate('employeeId', 'name employeeId department position');
  },

  getAttendanceByDateRange: async (employeeId, startDate, endDate) => {
    return await Attendance.find({
      employeeId: employeeId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('employeeId', 'name employeeId department position')
      .sort({ date: -1 });
  },

  getAllAttendanceByDate: async (date) => {
    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate());
    const endOfDay = new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate() + 1);

    return await Attendance.find({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    }).populate('employeeId', 'name employeeId department position')
      .sort({ 'employeeId.name': 1 });
  },

  getAttendanceStats: async (employeeId, startDate, endDate) => {
    const matchQuery = {
      date: { $gte: startDate, $lte: endDate }
    };

    if (employeeId) {
      matchQuery.employeeId = employeeId;
    }

    return await Attendance.aggregate([
      { $match: matchQuery },
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
  },

  getDepartmentAttendance: async (department, date) => {
    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate());
    const endOfDay = new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate() + 1);

    return await Attendance.aggregate([
      {
        $match: {
          date: {
            $gte: startOfDay,
            $lt: endOfDay
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $match: {
          'employee.department': department
        }
      },
      { $sort: { 'employee.name': 1 } }
    ]);
  },

  getMonthlyReport: async (employeeId, year, month) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return await Attendance.find({
      employeeId: employeeId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('employeeId', 'name employeeId department position')
      .sort({ date: 1 });
  }
}

export default attendanceService