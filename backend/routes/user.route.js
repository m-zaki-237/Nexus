import express from 'express'
import { getEntrepreneurs, getInvestors, getUserById, getUserProfile, loginUser, logoutUser, registerUser, updateProfile } from '../controllers/user.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/auth/register', registerUser)
router.post('/auth/login', loginUser)
router.post('/auth/logout', logoutUser)
router.get('/auth/profile', authMiddleware, getUserProfile)
router.patch('/user/update-profile', authMiddleware, updateProfile)
router.get('/user/:id', getUserById)
router.get("/auth/entrepreneurs", getEntrepreneurs);
router.get("/auth/investors", getInvestors);
export default router