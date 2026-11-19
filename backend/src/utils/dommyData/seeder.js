// Usage:
//   npm run seed:admin   -> creates the first admin (ADMIN_EMAIL / ADMIN_PASSWORD from .env)
//   npm run seed:data    -> imports sample categories, brand and products
//   npm run seed:destroy -> removes products, brands, categories and subcategories
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import 'colors'
import { config } from '../../config/index.js'
import { DB_Connection } from '../../DB/connection.js'
import { productModel } from '../../DB/models/product.model.js'
import { categoryModel } from '../../DB/models/category.model.js'
import { subCategoryModel } from '../../DB/models/subCategory.model.js'
import { brandModel } from '../../DB/models/brand.model.js'
import { userModel } from '../../DB/models/user.model.js'

const dir = path.dirname(fileURLToPath(import.meta.url))

const seedAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase()
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345'
  if (config.isProd && !process.env.ADMIN_PASSWORD) throw new Error('Set ADMIN_PASSWORD before seeding an admin in production')
  const existing = await userModel.findOne({ email })
  if (existing) {
    existing.role = 'admin'
    await existing.save()
    return console.log(`User ${email} promoted to admin`.green)
  }
  await userModel.create({ userName: 'admin', email, password, role: 'admin', confirmEmail: true })
  console.log(`Admin created: ${email}`.green.inverse)
}

const seedData = async () => {
  const products = JSON.parse(fs.readFileSync(path.join(dir, 'products.json'), 'utf8'))
  // the json file references category ids that don't exist in your DB -> map each one to a real category
  const names = ['Fashion', 'Electronics', 'Accessories']
  const fakeIds = [...new Set(products.map((p) => p.category))]
  const brand = (await brandModel.findOne({ name: 'Generic' })) ?? (await brandModel.create({ name: 'Generic' }))
  const map = {}
  for (const [i, fake] of fakeIds.entries()) {
    const name = names[i % names.length]
    map[fake] = (await categoryModel.findOne({ name })) ?? (await categoryModel.create({ name }))
  }
  for (const p of products) {
    delete p.slug // generated from the title
    p.category = map[p.category]._id
    p.brand = brand._id
    await productModel.create(p)
  }
  console.log(`${products.length} products inserted`.green.inverse)
}

const destroy = async () => {
  await Promise.all([productModel, subCategoryModel, categoryModel, brandModel].map((m) => m.deleteMany()))
  console.log('Catalog data destroyed'.red.inverse)
}

const actions = { '--admin': seedAdmin, '-i': seedData, '-d': destroy }
const action = actions[process.argv[2]]
if (!action) {
  console.log('Usage: node seeder.js [--admin | -i | -d]')
  process.exit(1)
}
try {
  await DB_Connection()
  await action()
} catch (err) {
  console.error(err.message.red)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
