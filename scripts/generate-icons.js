const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const publicDir = path.join(__dirname, '..', 'public')
const logoPath = path.join(publicDir, 'logo.png')

async function generateIcons() {
  console.log('Generating PWA icons from logo.png...')

  // Read the logo
  const logo = sharp(logoPath)
  const metadata = await logo.metadata()

  console.log(`Source logo: ${metadata.width}x${metadata.height}`)

  // Generate 192x192 icon
  await sharp(logoPath)
    .resize(192, 192, {
      fit: 'contain',
      background: { r: 15, g: 20, b: 25, alpha: 1 } // #0F1419
    })
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'))

  console.log('Created icon-192.png')

  // Generate 512x512 icon
  await sharp(logoPath)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 15, g: 20, b: 25, alpha: 1 } // #0F1419
    })
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'))

  console.log('Created icon-512.png')

  // Generate favicon (32x32)
  await sharp(logoPath)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 15, g: 20, b: 25, alpha: 1 }
    })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'))

  console.log('Created favicon.png')

  // Generate Apple touch icon (180x180)
  await sharp(logoPath)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 15, g: 20, b: 25, alpha: 1 }
    })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'))

  console.log('Created apple-touch-icon.png')

  console.log('Done!')
}

generateIcons().catch(console.error)
