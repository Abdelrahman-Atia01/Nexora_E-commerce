import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { config } from './config/index.js'
import { sanitize } from './middlewares/sanitize.js'
import { notFound, globalError } from './middlewares/error.js'
import authRouter from './modules/Auth/auth.router.js'
import userRouter from './modules/user/user.router.js'
import categoryRouter from './modules/category/category.router.js'
import subCategoryRouter from './modules/subCategory/subCategory.router.js'
import brandRouter from './modules/brand/brand.router.js'
import productRouter from './modules/product/product.router.js'
import reviewRouter from './modules/review/review.router.js'
import wishlistRouter from './modules/wishlist/wishlist.router.js'
import cartRouter from './modules/cart/cart.router.js'
import couponRouter from './modules/coupon/coupon.router.js'
import orderRouter from './modules/order/order.router.js'

export const app = express()

if (config.trustProxy) app.set('trust proxy', 1) // set TRUST_PROXY=true behind nginx / a PaaS
app.set('query parser', 'extended') // price[gte]=10

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })) // allow images to be used by the frontend
app.use(cors({ origin: config.clientUrl === '*' ? true : config.clientUrl.split(','), credentials: config.clientUrl !== '*' }))
app.use(compression())
if (config.env === 'development') app.use(morgan('dev'))
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: 'draft-7', legacyHeaders: false, message: { status: 'fail', message: 'Too many requests, please try again later' } }))
app.use(express.json({ limit: '10kb' }))
app.use(sanitize)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }))

const v1 = express.Router()
v1.use('/auth', authRouter)
v1.use('/users', userRouter)
v1.use('/categories', categoryRouter)
v1.use('/subcategories', subCategoryRouter)
v1.use('/brands', brandRouter)
v1.use('/products', productRouter)
v1.use('/reviews', reviewRouter)
v1.use('/wishlist', wishlistRouter)
v1.use('/cart', cartRouter)
v1.use('/coupons', couponRouter)
v1.use('/orders', orderRouter)
app.use('/api/v1', v1)

app.use(notFound)
app.use(globalError)
