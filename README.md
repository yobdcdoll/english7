# English 7

给 7 岁孩子用的本地英语学习网页应用。家长主导，每天 20 分钟；孩子在平板上看画面、听声音、指图。

## M0 范围

- **基线测**：理解、听辨、解码、产出四个维度，各记各的，只给家长看。
- **前 3 个语块**：`look at`、`this is`、`that is`，每个语块 3 个场景。
- **间隔回收**：五盒 Leitner，到期语块混在每日流程里再次出现。
- **家长报告**：今日报告、基线、语块进度、最近记录、数据导出与清空。

不做：账号、云同步、口语评分、主题图片接入。

## 运行

需要 Node.js 18+。

```bash
npm install
npm run dev
```

电脑浏览器打开 http://localhost:5173 。

### 小米平板（同一 Wi-Fi）

在 Mac 上查局域网 IP：

```bash
ipconfig getifaddr en0
```

然后在平板浏览器打开 `http://<Mac-LAN-IP>:5173`（例如 `http://192.168.1.23:5173`）。如果电脑开着防火墙，需要允许 Node/Vite 接受局域网连接。

## 测试与构建

```bash
npm test
npm run build
```

`npm test` 跑调度器单元测试；`npm run build` 先做 TypeScript 检查，再产出 `dist/`。

## 音频

`public/audio/` 里的预生成 MP3 是可选的，文件名必须等于 `src/data/content.json` 里的 `audioId`。缺文件时自动退回浏览器英文 TTS（`speechSynthesis`）。做法见 [public/audio/README.md](public/audio/README.md)。

## 主题图片

`public/themes/pokemon/` 是给 M1 预留的宝可梦主题图片，M0 不加载，当前一律用 emoji 卡面。文件名规则与版权说明见 [public/themes/pokemon/README.md](public/themes/pokemon/README.md)。

## 数据

所有数据只保存在本机浏览器的 `localStorage`，没有后端、没有账号、没有分析。换设备或清理浏览器前，在「家长面板 → 数据 → 导出 JSON」备份。清空记录会保留孩子昵称和设置。

## 文档

- [docs/plan.md](docs/plan.md)：学习方案、18 个语块、回收算法、里程碑。
- [GLOSSARY.md](GLOSSARY.md)：项目术语（语块、认领、回收、掌握等）。
- [docs/adr/](docs/adr/)：架构决策记录。
