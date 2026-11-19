import mongoose from 'mongoose'
import { config } from '../config/index.js'

export const DB_Connection = async () => {
  await mongoose.connect(config.dbUrl, { serverSelectionTimeoutMS: 10000 })
  console.log(`MongoDB connected: ${mongoose.connection.host}`)
}
