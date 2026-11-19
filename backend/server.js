import { config } from './src/config/index.js'
import { app } from './src/app.js'
import { DB_Connection } from './src/DB/connection.js'
import mongoose from 'mongoose'

let server
const start = async () => {
  await DB_Connection()
  server = app.listen(config.port, () => console.log(`Server running in ${config.env} mode on port ${config.port}`))
}

const shutdown = (reason, code = 0) => {
  console.log(`${reason} - shutting down...`)
  const done = () => mongoose.connection.close().finally(() => process.exit(code))
  server ? server.close(done) : done()
  setTimeout(() => process.exit(code), 10000).unref()
}

process.on('unhandledRejection', (err) => { console.error('unhandledRejection:', err); shutdown('unhandledRejection', 1) })
process.on('uncaughtException', (err) => { console.error('uncaughtException:', err); shutdown('uncaughtException', 1) })
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

start().catch((err) => { console.error('Failed to start:', err.message); process.exit(1) })
