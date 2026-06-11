# TOUCH LAB · 触觉实验室

> **Feel Before You See.**
> 由海报 `reference/touchlab_poster.png` 重构而来的沉浸式互动首页 —— 没有贴任何海报图片，全部视觉元素均以 HTML / SVG / CSS / Canvas / Three.js 重新构建。

---

## 启动方式

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # 产物输出到 dist/
npm run preview  # 本地预览构建产物
```

> 需要 Node 18+。展示字体（Archivo Black / Noto Sans SC）来自 Google Fonts，离线时自动回退到系统字体。

---

## 技术栈

| 层 | 技术 |
| --- | --- |
| 构建 | Vite 5 |
| 动画 | GSAP 3 + ScrollTrigger |
| 平滑滚动 | Lenis |
| WebGL | Three.js（自定义 GLSL shader） |
| 其余 | 原生 HTML / CSS / JavaScript，零框架 |

## 项目结构

```
index.html                  页面骨架 + SVG defs（手部路径 / 渐变 / goo 滤镜）
src/
  main.js                   入口：装配组件 + 单一渲染循环
  components/
    pointer.js              全局指针状态（1 个监听器，所有组件共用）
    cursor.js               自定义光标（圆环惯性 + hover 光晕 + 大范围跟随光晕）
    particles.js            2D Canvas 粒子层（漂浮 / 视差 / 向按钮聚集）
    blobs.js                黄色流体色块（入场 / 呼吸 / CTA 涌动）
    parallax.js             [data-depth] 多层鼠标视差
    energy-core.js          Three.js「触觉能量核心」（噪声形变球 + 光晕 + 尘埃）
    transition.js           液态全屏转场（Canvas 多层 wobble blob）
    hero.js                 首屏交互编排（磁性按钮 / glitch / hover 联动）
    loader.js               3 秒加载序列
    scroll.js               Lenis + ScrollTrigger 全部滚动编排
  styles/                   base / loader / cursor / hero / sections / responsive
  assets/noise.svg          胶片颗粒（feTurbulence，无位图）
reference/                  原始海报
scripts/                    可选：基于 puppeteer-core + Edge 的无头冒烟测试
```

> 冒烟测试（可选）：先 `npm run build && npm run preview`，再 `node scripts/smoke.mjs`，
> 会在 `shots/` 输出各 Section / 移动端截图并检查控制台错误。

---

## 海报 → 网页的拆解方式

| 海报元素 | 网页实现 |
| --- | --- |
| 粉色高饱和背景 | CSS 变量 `--bg`，随滚动在 粉 / 深紫 / 近黑 / 黄 之间 GSAP 渐变 |
| 黄色流体色块 | SVG blob 路径 + `feTurbulence` 粗糙边缘，GSAP 呼吸动画 |
| 渐变霓虹手部 | 单条手形 `<path>` ×2（旋转复用），thermal 线性渐变 + 模糊辉光 + 高光层 |
| TOUCH LAB 大标题 | Archivo Black 实字 + 逐行 mask 入场 + hover glitch |
| 颗粒质感 | `noise.svg`（feTurbulence）+ `mix-blend-mode: overlay` 全局覆盖 |
| 指尖相触的「火花」 | Three.js 能量核心，正好悬浮在两只手指尖之间 |

## 交互地图

- **加载（≈3s）**：纯粉 → 黄色流体滑入 → 标题逐行 → 手部由模糊变清晰 → 粒子/核心激活
- **光标**：半透明圆环（惯性跟随）+ 中心点 + hover 放大 2.3 倍并出现霓虹光晕
- **鼠标视差**（5 层不同速度）：粒子 → 流体 → 标题 → 手部 → 光晕/火花
- **Hero CTA hover**：按钮液态 goo 填充 + 标题 glitch + 手部辉光增强 + 流体扩张 + 粒子向按钮聚集 + 核心增亮
- **点击任意导航 / CTA**：液态三色 blob 从按钮中心淹没全屏 → 跳转 → 中心液洞展开揭示新内容
- **滚动**：Lenis 平滑滚动；每个 section 拥有独立的 parallax / scale / rotation / blur / opacity 编排
- **能量核心**：鼠标靠近产生扰动隆起，点击释放冲击波脉冲；滚动时在各 section 间滑移变形

## 性能

- 全站只有 **一个 rAF 循环**（gsap.ticker）驱动光标、视差、粒子与 WebGL
- 粒子使用预渲染 sprite；数量按面积自适应（50–170），移动端减半
- WebGL DPR 封顶 1.75（移动端 1.5），球体细分移动端降级
- 流体色块只做 transform 动画，位移滤镜结果可被缓存
- 触屏设备自动禁用自定义光标 / 磁性按钮 / 鼠标视差
- 尊重 `prefers-reduced-motion`（跳过加载动画与跑马灯）

## 已适配

1920×1080 / 1440×900（含矮视口 MacBook 优化）/ 平板 / 手机端。

> 备注：「预约」按钮为演示用途，仅触发转场与确认弹层，不发送真实请求。
