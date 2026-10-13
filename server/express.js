
import express from 'express'
import cookieParser from 'cookie-parser'
import compress from 'compression'
import cors from 'cors'
import helmet from 'helmet'
import userRoutes from './routes/user.routes.js'
import contactRoutes from './routes/contact.routes.js'
import projectRoutes from './routes/project.routes.js'
import qualificationRoutes from './routes/qualification.routes.js'
import authRoutes from './routes/auth.routes.js'
import errorHandler from './controllers/error.controller.js'

const app = express()
app.use(cors())
app.use(helmet())
app.use(compress())
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//...
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to My Portfolio API.' })
})
//...
app.use('/', authRoutes)
app.use('/', userRoutes)
app.use('/', contactRoutes)
app.use('/', projectRoutes);
app.use('/', qualificationRoutes);
app.use(errorHandler.handleError)
export default app
