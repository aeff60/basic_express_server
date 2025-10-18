import express from 'express'
import useUserRoute from './userRoutes.js'
import useAttendanceRoute from './attendanceRoutes.js'
const router = express.Router()

useUserRoute(router)
useAttendanceRoute(router)

export default router