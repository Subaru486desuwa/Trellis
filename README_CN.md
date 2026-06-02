<p align="center">
<picture>
<source srcset="assets/trellis.png" media="(prefers-color-scheme: dark)">
<source srcset="assets/trellis.png" media="(prefers-color-scheme: light)">
<img src="assets/trellis.png" alt="Trellis Logo" width="500" style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;">
</picture>
</p>

<p align="center">
<strong>让 AI coding 从一次性聊天，变成团队可复用的工程流程。</strong><br/>
<sub>Trellis 不是另一个 coding agent，而是给 Claude Code、Cursor、OpenCode、Codex、Gemini CLI 等工具加上项目级规范、任务上下文、记忆和验收流程的开源工作流框架。</sub>
</p>

<p align="center">
<a href="./README.md">English</a> •
<a href="https://docs.trytrellis.app/zh">文档</a> •
<a href="https://docs.trytrellis.app/zh/start/install-and-first-task">快速开始</a> •
<a href="https://docs.trytrellis.app/zh/advanced/multi-platform">支持平台</a> •
<a href="https://docs.trytrellis.app/zh/start/real-world-scenarios">使用场景</a>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/@mindfoldhq/trellis"><img src="https://img.shields.io/npm/v/@mindfoldhq/trellis.svg?style=flat-square&color=2563eb" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@mindfoldhq/trellis"><img src="https://img.shields.io/npm/dw/@mindfoldhq/trellis?style=flat-square&color=cb3837&label=downloads" alt="npm downloads" /></a>
<a href="https://github.com/mindfold-ai/Trellis/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-16a34a.svg?style=flat-square" alt="license" /></a>
<a href="https://github.com/mindfold-ai/Trellis/stargazers"><img src="https://img.shields.io/github/stars/mindfold-ai/Trellis?style=flat-square&color=eab308" alt="stars" /></a>
<a href="https://docs.trytrellis.app/zh"><img src="https://img.shields.io/badge/docs-trytrellis.app-0f766e?style=flat-square" alt="docs" /></a>
<a href="https://discord.com/invite/tWcCZ3aRHc"><img src="https://img.shields.io/badge/Discord-Join-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord" /></a>
<a href="https://github.com/mindfold-ai/Trellis/issues"><img src="https://img.shields.io/github/issues/mindfold-ai/Trellis?style=flat-square&color=e67e22" alt="open issues" /></a>
<a href="https://github.com/mindfold-ai/Trellis/pulls"><img src="https://img.shields.io/github/issues-pr/mindfold-ai/Trellis?style=flat-square&color=9b59b6" alt="open PRs" /></a>
<a href="https://deepwiki.com/mindfold-ai/Trellis"><img src="https://img.shields.io/badge/Ask-DeepWiki-blue?style=flat-square" alt="Ask DeepWiki" /></a>
<a href="https://chatgpt.com/?q=Explain+the+project+mindfold-ai/Trellis+on+GitHub"><img src="https://img.shields.io/badge/Ask-ChatGPT-74aa9c?style=flat-square&logo=openai&logoColor=white" alt="Ask ChatGPT" /></a>
</p>

<p align="center">
<img src="assets/trellis-demo-zh.gif" alt="Trellis 工作流演示" width="100%">
</p>

## 先看这三件事

| 如果你正在遇到 | Trellis 做什么 |
| --- | --- |
| 每次开新会话都要重新解释项目背景、代码风格和禁忌 | 把规则沉淀到 `.trellis/spec/`，让相关上下文按任务自动注入 |
| AI 写完代码后没人兜底，结果很难复现、很难审查 | 把 PRD、实现记录、验收记录放进 `.trellis/tasks/`，形成可追溯任务链 |
| 团队里有人用 Claude Code，有人用 Cursor/Codex/OpenCode，规则到处散 | 用同一套项目结构生成各平台入口，让标准跟着仓库走 |

Trellis 的核心价值很简单：**把“我怎么让 AI 好好干活”这件事，从个人提示词变成项目基础设施。**

## 快速开始

### 前置要求

- **Node.js** >= 18
- **Python** >= 3.9

### 1. 安装 Trellis

```bash
npm install -g @mindfoldhq/trellis@latest
```

### 2. 初始化你的仓库（二选一）

如果只想先跑通基础流程：

```bash
trellis init -u your-name
```

如果已经知道团队会用哪些平台，初始化时直接带上平台参数：

```bash
trellis init --cursor --opencode --codex -u your-name
```

然后在你的 coding agent 里从 Trellis 命令开始，例如 `/trellis:start` 或平台对应的入口命令。

更多步骤见 [快速开始](https://docs.trytrellis.app/zh/start/install-and-first-task) 与 [支持平台](https://docs.trytrellis.app/zh/advanced/multi-platform)。

## Trellis 的核心目录

```text
.trellis/
├── spec/        # 项目规范：代码风格、架构边界、测试要求、团队约定
├── tasks/       # 任务上下文：PRD、研究记录、实现记录、验收记录
├── workspace/   # 开发者工作日志：跨会话记忆和进展衔接
├── scripts/     # 平台同步、hook 和辅助脚本
├── config.yaml  # Trellis 项目配置
└── workflow.md  # 工作流说明：如何规划、实现、检查和收尾
```

核心规范、任务记录和工作日志可以进入 Git；本地运行状态会被 `.trellis/.gitignore` 排除。也就是说，团队可以像 review 代码一样 review AI 工作流本身。

## 工作流长什么样

1. **Plan（规划）**：`trellis-brainstorm` 逐题澄清需求，写出 `prd.md`；需要调研时派发 `trellis-research`。
2. **Implement（实现）**：`trellis-implement` 根据 PRD 和自动注入的 spec 写代码，不擅自提交。
3. **Verify（验证）**：`trellis-check` 对照 diff、spec、lint、type-check、测试做验收，并尽量自修复。
4. **Finish（收尾）**：运行最终检查，归档任务，把本轮新学到的规则沉淀回 `.trellis/spec/`。

结果是：下一次会话不再从零开始，团队也不必靠口口相传维护 AI 使用经验。

## 支持的平台

Trellis 是项目层 harness，不绑定单一模型或单一 IDE。目前覆盖：

- Claude Code
- Cursor
- OpenCode
- Codex
- Kiro / Kilo
- Gemini CLI
- Antigravity
- Windsurf
- Qoder
- CodeBuddy
- GitHub Copilot
- Droid
- Pi Agent

如果你的团队同时使用多种 AI coding 工具，Trellis 可以让它们共享同一份项目规范和任务上下文。

## 适合谁

- **个人开发者**：希望 AI 记住项目规则、延续上次进度、减少重复提示。
- **小团队**：希望把某个人调教 AI 的经验变成团队可复用资产。
- **开源项目维护者**：希望贡献者和 agent 都按同一套规范理解项目。
- **高频使用 AI coding 的团队**：希望把任务规划、实现、验收和复盘串成稳定流程。

## 资源

| 需求 | 链接 |
| --- | --- |
| 5 分钟跑通第一个任务 | [快速开始](https://docs.trytrellis.app/zh/start/install-and-first-task) |
| 了解平台差异和初始化参数 | [支持平台](https://docs.trytrellis.app/zh/advanced/multi-platform) |
| 看真实项目如何使用 | [真实场景](https://docs.trytrellis.app/zh/start/real-world-scenarios) |
| 从规范模板开始搭建 | [Spec 模板](https://docs.trytrellis.app/zh/templates/specs-index) |
| 跟进版本更新 | [更新日志](https://docs.trytrellis.app/zh/changelog) |

## 常见问题

<details>
<summary><strong>Trellis 与 <code>CLAUDE.md</code>、<code>AGENTS.md</code>、<code>.cursorrules</code> 有何区别？</strong></summary>

这些文件是入口，Trellis 是围绕入口建立的一套项目级工作流。它不仅生成平台需要的规则文件，还会维护作用域明确的 spec、按任务划分的 PRD、实现/检查上下文、开发者工作日志和收尾沉淀流程。

</details>

<details>
<summary><strong>Trellis 是不是只适合 Claude Code？</strong></summary>

不是。Trellis 不替代 Claude Code、Cursor、Codex 或 OpenCode；它给这些工具提供同一套项目上下文和工程流程。你可以在团队里混用不同工具。

</details>

<details>
<summary><strong>会不会很重？我只是想让 AI 记住项目规则。</strong></summary>

可以从很轻的用法开始：先 `trellis init`，把最重要的规则写进 `.trellis/spec/`。等你需要更强的可追溯性，再使用任务 PRD、检查代理和收尾归档。

</details>

<details>
<summary><strong>是否需要手动编写每一个 spec？</strong></summary>

不需要。常见做法是先让 AI 基于现有代码生成初稿，再由团队把真正高价值、容易踩坑、必须遵守的规则收紧。Trellis 的目标不是堆文档，而是沉淀能改变结果的上下文。

</details>

<details>
<summary><strong>团队协作时会不会频繁冲突？</strong></summary>

共享 spec 和任务记录进入仓库，可以被 review；个人 workspace journal 按开发者独立维护，避免大家同时改同一份私人记录。

</details>

## Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=mindfold-ai/Trellis&type=Date)](https://star-history.com/#mindfold-ai/Trellis&Date)

## 社区与资源

- [官方文档](https://docs.trytrellis.app/zh)
- [GitHub Issues](https://github.com/mindfold-ai/Trellis/issues)
- [Discord](https://discord.com/invite/tWcCZ3aRHc)
- [技术博客](https://docs.trytrellis.app/zh/blog)

### 联系我们

<p align="center">
<img src="assets/wx_link7.jpg" alt="微信群" width="260" />
&nbsp;&nbsp;&nbsp;&nbsp;
<img src="assets/feishu-group-qr.jpg" alt="飞书话题群" width="260" />
</p>

<p align="center">
<a href="https://github.com/mindfold-ai/Trellis">官方仓库</a> •
<a href="https://github.com/mindfold-ai/Trellis/blob/main/LICENSE">AGPL-3.0 License</a> •
由 <a href="https://github.com/mindfold-ai">Mindfold</a> 构建
</p>
