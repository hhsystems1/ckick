const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const publicDir = path.join(__dirname, '..', 'public')

async function optimizeImages() {
  console.log('Optimizing images...\n')

  // Optimize logo.png
  const logoPath = path.join(publicDir, 'logo.png')
  const logoOptPath = path.join(publicDir, 'logo-optimized.png')

  const logoMeta = await sharp(logoPath).metadata()
  console.log(`Original logo: ${logoMeta.width}x${logoMeta.height}`)

  const originalSize = fs.statSync(logoPath).size
  console.log(`Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`)

  // Resize to reasonable web size (max 400px height for header logo)
  // and optimize with PNG compression
  await sharp(logoPath)
    .resize({ height: 400, withoutEnlargement: true })
    .png({
      quality: 90,
      compressionLevel: 9,
      palette: true
    })
    .toFile(logoOptPath)

  const optimizedSize = fs.statSync(logoOptPath).size
  console.log(`Optimized size: ${(optimizedSize / 1024).toFixed(2)} KB`)
  console.log(`Reduction: ${((1 - optimizedSize / originalSize) * 100).toFixed(1)}%\n`)

  // Backup original and replace
  const backupPath = path.join(publicDir, 'logo-original.png')
  fs.renameSync(logoPath, backupPath)
  fs.renameSync(logoOptPath, logoPath)
  console.log('Backed up original to logo-original.png')
  console.log('Replaced logo.png with optimized version\n')

  // Also optimize logo2.png if it exists
  const logo2Path = path.join(publicDir, 'logo2.png')
  if (fs.existsSync(logo2Path)) {
    const logo2OrigSize = fs.statSync(logo2Path).size
    console.log(`\nOriginal logo2 size: ${(logo2OrigSize / 1024 / 1024).toFixed(2)} MB`)

    const logo2OptPath = path.join(publicDir, 'logo2-optimized.png')
    await sharp(logo2Path)
      .resize({ height: 400, withoutEnlargement: true })
      .png({
        quality: 90,
        compressionLevel: 9,
        palette: true
      })
      .toFile(logo2OptPath)

    const logo2OptSize = fs.statSync(logo2OptPath).size
    console.log(`Optimized logo2 size: ${(logo2OptSize / 1024).toFixed(2)} KB`)

    const backup2Path = path.join(publicDir, 'logo2-original.png')
    fs.renameSync(logo2Path, backup2Path)
    fs.renameSync(logo2OptPath, logo2Path)
    console.log('Backed up original to logo2-original.png')
  }

  console.log('\nDone! Images optimized for web.')
}

optimizeImages().catch(console.error)
