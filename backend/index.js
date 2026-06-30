import dotenv from 'dotenv'
import express from 'express'
import cookieParser from "cookie-parser";
import { connectDB } from './config/db.js'
import userRouter from './routes/user.route.js'
dotenv.config()
const app = express()
app.use(express.json())
app.use(cookieParser());

const port = process.env.PORT || 5000

connectDB()

app.use('/api/users', userRouter)
app.listen((port),()=>{
    console.log(`Server listening to port${port}`);
})