import express from 'express'
import { getUserProfile, loginUser, logoutUser, registerUser, updateProfile } from '../controllers/user.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/logout', logoutUser)
router.get('/profile', authMiddleware, getUserProfile)
router.patch('/update-profile', authMiddleware, updateProfile)
export default router