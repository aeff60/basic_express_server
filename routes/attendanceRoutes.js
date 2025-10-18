import authMiddleware from "../middlewares/authMiddleware.js"
import attendanceController from "../controllers/attendanceController.js"

const useAttendanceRoute = async (router) => {
  // Employee routes (require authentication)
  router.post('/attendance/clock-in', authMiddleware(), attendanceController.clockIn)
  router.post('/attendance/clock-out', authMiddleware(), attendanceController.clockOut)
  router.post('/attendance/break-start', authMiddleware(), attendanceController.startBreak)
  router.post('/attendance/break-end', authMiddleware(), attendanceController.endBreak)
  
  router.get('/attendance/today', authMiddleware(), attendanceController.getTodayAttendance)
  router.get('/attendance/history', authMiddleware(), attendanceController.getAttendanceHistory)
  router.get('/attendance/stats', authMiddleware(), attendanceController.getAttendanceStats)
  
  // Admin/HR routes
  router.get('/attendance/all', authMiddleware(), attendanceController.getAllAttendance)
}

export default useAttendanceRoute