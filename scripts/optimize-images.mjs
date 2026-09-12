import sharp from 'sharp'
import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const imgDir = join(__dirname, '..', 'docs/public/images')

const tasks = [
  // 相册封面：WebP质量80，保持尺寸
  { src: 'albums/cover-meeting.jpg', dest: 'albums/cover-meeting.webp', quality: 80 },
  { src: 'albums/cover-dinner.jpg', dest: 'albums/cover-dinner.webp', quality: 80 },
  { src: 'albums/cover-opening.jpg', dest: 'albums/cover-opening.webp', quality: 80 },
  // 班徽水印：WebP质量70，缩小到300x300（水印不需要高清）
  { src: 'badge-watermark.png', dest: 'badge-watermark.webp', quality: 70, resize: 300 },
  { src: 'badge-watermark-dark.png', dest: 'badge-watermark-dark.webp', quality: 70, resize: 300 },
  // logo：WebP质量85
  { src: 'logo.png', dest: 'logo.webp', quality: 85 },
]

console.log('开始压缩图片...\n')

for (const task of tasks) {
  const srcPath = join(imgDir, task.src)
  const destPath = join(imgDir, task.dest)
  
  if (!existsSync(srcPath)) {
    console.log(`⚠️  源文件不存在: ${task.src}`)
    continue
  }
  
  const destDir = dirname(destPath)
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })
  
  let pipeline = sharp(srcPath)
  if (task.resize) {
    pipeline = pipeline.resize(task.resize, task.resize, { fit: 'inside' })
  }
  pipeline = pipeline.webp({ quality: task.quality })
  
  await pipeline.toFile(destPath)
  
  const srcSize = (await import('fs')).statSync(srcPath).size
  const destSize = (await import('fs')).statSync(destPath).size
  const ratio = ((1 - destSize / srcSize) * 100).toFixed(1)
  
  console.log(`✅ ${task.src}`)
  console.log(`   ${(srcSize/1024).toFixed(0)}KB → ${(destSize/1024).toFixed(0)}KB (减少${ratio}%)`)
}

console.log('\n图片压缩完成！')
