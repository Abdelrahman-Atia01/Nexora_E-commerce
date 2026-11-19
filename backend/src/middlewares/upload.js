import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import ApiError from '../utils/ApiError.js'
import { config } from '../config/index.js'

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }

const createUploader = (folder) => {
  const dir = path.join(process.cwd(), 'uploads', folder)
  fs.mkdirSync(dir, { recursive: true })
  return multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ALLOWED[file.mimetype]}`),
    }),
    fileFilter: (req, file, cb) =>
      ALLOWED[file.mimetype] ? cb(null, true) : cb(new ApiError('Only jpeg, png and webp images are allowed', 400)),
    limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  })
}

const url = (folder, file) => `${config.baseUrl}/uploads/${folder}/${file.filename}`

// Single image field -> req.body[field] = public URL
export const uploadSingleImage = (folder, field = 'image') => [
  createUploader(folder).single(field),
  (req, res, next) => {
    if (req.file) req.body[field] = url(folder, req.file)
    next()
  },
]

// Product: imageCover (1) + images (up to 5)
export const uploadProductImages = [
  createUploader('products').fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 5 },
  ]),
  (req, res, next) => {
    if (req.files?.imageCover) req.body.imageCover = url('products', req.files.imageCover[0])
    if (req.files?.images) req.body.images = req.files.images.map((f) => url('products', f))
    next()
  },
]
