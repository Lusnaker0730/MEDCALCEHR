# 图片优化指南 Image Optimization Guide

## 📊 当前状态分析

### 图片使用情况
项目中包含大量参考图片，主要分布在：
- `js/calculators/*` 各个计算器文件夹中
- 文件格式：PNG, JPG, GIF, AVIF, JFIF
- 总体大小：需要评估

## 🎯 优化策略

### 1. 图片格式优化

#### 推荐格式优先级
1. **WebP** - 最优先（体积小，质量高，浏览器支持好）
2. **AVIF** - 次优先（体积更小，但浏览器支持较新）
3. **JPEG** - 照片类图片
4. **PNG** - 图表、截图（需要无损压缩）

#### 格式转换建议
```bash
# 使用 imagemagick 转换为 WebP
convert input.png -quality 85 output.webp

# 使用 cwebp 工具
cwebp -q 85 input.png -o output.webp

# 批量转换
for file in *.png; do cwebp -q 85 "$file" -o "${file%.png}.webp"; done
```

### 2. 图片压缩

#### 在线工具
- **TinyPNG** - https://tinypng.com/
- **Squoosh** - https://squoosh.app/
- **ImageOptim** (Mac)
- **RIOT** (Windows)

#### 命令行工具
```bash
# PNG 压缩
pngquant --quality 65-85 input.png -o output.png

# JPEG 压缩
jpegoptim --max=85 --strip-all *.jpg

# WebP 压缩
cwebp -q 85 -m 6 input.png -o output.webp
```

### 3. 响应式图片

#### 使用 srcset 和 sizes
```html
<img 
    src="image-800w.webp"
    srcset="
        image-400w.webp 400w,
        image-800w.webp 800w,
        image-1200w.webp 1200w
    "
    sizes="(max-width: 768px) 100vw, 800px"
    alt="Description"
/>
```

#### 使用 picture 元素（多格式支持）
```html
<picture>
    <source type="image/avif" srcset="image.avif" />
    <source type="image/webp" srcset="image.webp" />
    <source type="image/jpeg" srcset="image.jpg" />
    <img src="image.jpg" alt="Description" />
</picture>
```

### 4. 懒加载实现

#### 使用 loading 属性（原生）
```html
<img src="image.jpg" loading="lazy" alt="Description" />
```

#### 使用 data-src（自定义懒加载）
```html
<img 
    data-src="image.jpg" 
    src="placeholder.jpg"
    class="lazy-image"
    alt="Description" 
/>
```

#### JavaScript 实现
```javascript
// 使用我们的 lazyLoader.js
import { initImageLazyLoading } from './js/lazyLoader.js';

// 初始化
initImageLazyLoading();

// 为动态添加的图片
const lazyLoader = initImageLazyLoading();
lazyLoader.observe(newElement);
```

## 📋 项目中的图片清单

### 需要优化的图片

#### 计算器参考图片
```
js/calculators/
├── 4as-delirium/
│   └── article_river_*.png (大型PNG)
├── 4c-mortality-covid/
│   └── p652-t2.gif (GIF动图)
├── 4peps/
│   └── 4PEPS.png
├── 4ts-hit/
│   └── 4HIT.png
│   └── 6-Table3-1.png
├── 6mwd/
│   └── 6mwd.png
├── abg-analyzer/
│   └── 2025-09-16_133236.png
│   └── ABG-interpretation.avif (已优化)
├── abl-calculator/
│   └── (检查是否有图片)
├── action-icu/
│   └── action-icu.png
│   └── jah33242-fig-0003.jpg
├── apache-ii/
│   └── APACHE2.png
├── bwps/
│   └── CR02708022_t2_0.jfif
├── dasi/
│   └── cohn_cvperiopupdate_t1.jpg
│   └── Duke-Activity-Status-Index-*.jpg
├── isth-dic/
│   └── *.jpg
├── rcri/
│   └── *.jpg
├── regiscar/
│   └── *.jpg (多张)
├── timi-nstemi/
│   └── *.jpg
└── (其他计算器...)
```

## 🔧 批量优化脚本

### Node.js 批量转换脚本
```javascript
// optimize-images.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // npm install sharp

async function optimizeImage(inputPath, outputPath) {
    const ext = path.extname(outputPath).toLowerCase();
    
    try {
        let pipeline = sharp(inputPath);
        
        // 获取图片信息
        const metadata = await pipeline.metadata();
        
        // 如果宽度超过1200px，调整大小
        if (metadata.width > 1200) {
            pipeline = pipeline.resize(1200, null, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }
        
        // 根据格式优化
        if (ext === '.webp') {
            await pipeline.webp({ quality: 85 }).toFile(outputPath);
        } else if (ext === '.jpg' || ext === '.jpeg') {
            await pipeline.jpeg({ quality: 85, mozjpeg: true }).toFile(outputPath);
        } else if (ext === '.png') {
            await pipeline.png({ quality: 85, compressionLevel: 9 }).toFile(outputPath);
        }
        
        console.log(`✓ Optimized: ${outputPath}`);
    } catch (error) {
        console.error(`✗ Error optimizing ${inputPath}:`, error.message);
    }
}

// 使用示例
const calculatorsDir = './js/calculators';
// 遍历所有计算器目录并优化图片
```

## 📈 预期效果

### 优化前后对比
- **原始 PNG (500KB)** → WebP (150KB) = 节省 70%
- **原始 JPG (300KB)** → WebP (100KB) = 节省 67%
- **总体目标**：减少 60-70% 的图片体积

### 性能提升
- 页面加载时间减少 30-50%
- 首次内容绘制 (FCP) 提前
- 最大内容绘制 (LCP) 改善
- 移动端体验显著提升

## ✅ 实施步骤

1. **第一阶段：评估和分类**
   - [ ] 统计所有图片文件大小
   - [ ] 识别大于 100KB 的图片
   - [ ] 确定优先优化的目标

2. **第二阶段：格式转换**
   - [ ] 将 PNG/JPG 转换为 WebP
   - [ ] 为重要图片生成 AVIF 版本
   - [ ] 保留原始格式作为后备

3. **第三阶段：实施懒加载**
   - [ ] 更新 HTML 使用 loading="lazy"
   - [ ] 应用自定义懒加载到动态图片
   - [ ] 添加占位符和加载状态

4. **第四阶段：测试和验证**
   - [ ] 使用 Lighthouse 测试性能
   - [ ] 检查各浏览器兼容性
   - [ ] 验证懒加载功能

5. **第五阶段：文档和维护**
   - [ ] 更新开发文档
   - [ ] 建立图片上传规范
   - [ ] 设置 CI/CD 自动优化

## 🛠️ 工具和库

### 推荐工具
- **sharp** - Node.js 图片处理
- **imagemin** - 图片压缩
- **webpack-image-loader** - Webpack 插件
- **next/image** - Next.js 图片优化（如果迁移）

### CDN 和服务
- **Cloudinary** - 图片 CDN 和优化
- **ImageKit** - 实时图片转换
- **Cloudflare Images** - 自动优化

## 📝 最佳实践

1. **永远使用懒加载**（除了首屏图片）
2. **提供多种格式**（WebP + 后备格式）
3. **使用适当的尺寸**（不要过大）
4. **添加 alt 文本**（可访问性和SEO）
5. **使用 CDN**（如果可能）
6. **定期审计**（检查新增图片）

## 🔗 相关资源

- [Web.dev Image Optimization](https://web.dev/fast/#optimize-your-images)
- [MDN Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Squoosh App](https://squoosh.app/)
- [WebP Converter](https://developers.google.com/speed/webp)

