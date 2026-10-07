const sharp = require('sharp');
const path = require('path');

const svg = `
<svg width="800" height="1000" viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#bg)"/>
  <circle cx="400" cy="380" r="140" fill="none" stroke="url(#gold)" stroke-width="2" opacity="0.3"/>
  <path d="M350 280 C365 295 435 295 450 280 L430 350 C415 375 430 420 470 560 L510 720 C460 740 340 740 290 720 L330 560 C370 420 385 375 370 350 Z" fill="url(#gold)" opacity="0.75"/>
  <path d="M400 230 C390 230 385 240 395 250 L400 255 L340 280 L460 280 Z" fill="url(#gold)" opacity="0.9"/>
  <text x="400" y="790" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" letter-spacing="6" fill="#ffffff" text-anchor="middle">BLINKWEAR</text>
  <text x="400" y="825" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" letter-spacing="3" fill="#a1a1aa" text-anchor="middle">LUXURY COUTURE RENTALS</text>
</svg>
`;

sharp(Buffer.from(svg))
  .jpeg({ quality: 90 })
  .toFile(path.join(__dirname, '..', 'public', 'placeholder-dress.jpg'))
  .then(() => console.log('Successfully generated public/placeholder-dress.jpg'))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
