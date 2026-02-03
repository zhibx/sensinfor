/**
 * 构建后处理脚本
 * 用于修复生成文件的路径和位置
 */

const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');

console.log('开始执行构建后处理...');

// 1. 复制manifest.json
console.log('1. 复制manifest.json...');
const manifestSrc = path.resolve(__dirname, '../public/manifest.json');
const manifestDest = path.resolve(distDir, 'manifest.json');
fs.copyFileSync(manifestSrc, manifestDest);
console.log('  ✓ manifest.json已复制');

// 2. 复制图标
console.log('2. 复制图标文件...');
const iconsDir = path.resolve(distDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}
const iconFiles = ['icon16.svg', 'icon48.svg', 'icon128.svg'];
iconFiles.forEach(icon => {
  const src = path.resolve(__dirname, '../public/icons', icon);
  const dest = path.resolve(iconsDir, icon);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✓ ${icon}已复制`);
  }
});

// 3. 处理popup.html
console.log('3. 处理popup.html...');
const popupSrc = path.resolve(distDir, 'src/popup/index.html');
const popupDest = path.resolve(distDir, 'popup.html');

if (fs.existsSync(popupSrc)) {
  let html = fs.readFileSync(popupSrc, 'utf-8');

  // 修复资源路径为相对路径
  html = html.replace(/src="\/popup\.js"/g, 'src="./popup.js"');
  html = html.replace(/href="\/chunks\//g, 'href="./chunks/');
  html = html.replace(/href="\/assets\//g, 'href="./assets/');

  // 写入到dist根目录
  fs.writeFileSync(popupDest, html, 'utf-8');
  console.log('  ✓ popup.html已移动到dist根目录并修复路径');
} else {
  console.error('  ✗ 未找到源文件:', popupSrc);
  process.exit(1);
}

// 4. 验证必需文件
console.log('4. 验证构建结果...');
const requiredFiles = [
  'popup.html',
  'popup.js',
  'background.js',
  'content.js',
  'manifest.json',
  'icons/icon16.svg',
  'icons/icon48.svg',
  'icons/icon128.svg',
  'assets/popup.css'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.resolve(distDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.error(`  ✗ 缺失: ${file}`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n✅ 构建后处理完成!所有文件已就绪。');
} else {
  console.error('\n❌ 构建后处理失败!部分文件缺失。');
  process.exit(1);
}
