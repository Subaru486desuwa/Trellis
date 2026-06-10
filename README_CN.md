<p align="center">
<img src="https://raw.githubusercontent.com/Subaru486desuwa/Polygon/main/assets/polygon-logo.svg" width="140" alt="Polygon logo" />
</p>

<h1 align="center">Polygon</h1>

<p align="center">
<strong>为 AI 编程 agent 提供持久化项目记忆与轻量任务工作流。</strong>
</p>

<p align="center">
<a href="https://github.com/Subaru486desuwa/Polygon/blob/main/README.md">English</a>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/@subaru486/polygon"><img src="https://img.shields.io/npm/v/@subaru486/polygon.svg?style=flat-square&color=2563eb" alt="npm version" /></a>
<a href="https://github.com/Subaru486desuwa/Polygon/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-16a34a.svg?style=flat-square" alt="license" /></a>
</p>

---

AI 编程 agent 每个会话都从零开始——不记得你的代码规范、手头的工作、上个会话拍板过什么。Polygon 在你的仓库里给 agent 一个家：一个存放 spec、任务、日志与活动记录的 `.polygon/` 目录，外加一组 hook，把其中该看的部分自动喂进每一个会话。

- **会话开局即有方向。** session-start hook 注入开发者身份、git 状态、活跃任务与下一步动作——无论哪个平台，agent 都能接着上个会话继续干。
- **工作流信任 agent。** 规则是建议性的：agent 自己判断这一轮的真实体量。小修小补直接做、零仪式；多轮实现工作则获得任务目录、PRD 与持久记录。
- **多 LLM 出处追溯。** 每个任务带一份 `activity.jsonl`，记录哪个平台/模型在何时做了什么——Claude Code、Codex 等可以互相交接工作而不丢上下文。

## 安装

```bash
npm install -g @subaru486/polygon
```

安装后获得一个 `polygon` 命令。部署的工作流脚本是纯标准库 Python，因此 PATH 上需要 Python ≥ 3.9（`polygon init` 会检查）。

## 快速开始

```bash
cd your-project
polygon init -y     # 非交互：默认部署 Claude Code + Codex 支持
```

也可以显式指定平台（`polygon init --claude --cursor`），或不带参数运行 `polygon init` 进入交互式勾选。init 会部署：

- `.polygon/` —— 工作流指南、配置、任务/spec/日志结构，以及驱动这一切的 Python 脚本
- 各平台资产 —— `.claude/`、`.codex/` 等目录下的斜杠命令、技能、子代理与 hook
- `AGENTS.md` —— 仓库根的 agent 指令（已存在的文件不会被动；`polygon update` 只管理其中带标记的区块）
- 一个 git `post-commit` hook，把每次提交盖章到活跃任务的活动日志（绝不覆盖已存在的第三方 hook）

然后在仓库里打开你的 AI agent，直接描述你想要什么。注入的上下文会让 agent 自己判断这一轮的体量：

- 提问和快速修复 → 直接回答/直接改，零任务仪式。
- 多轮实现工作 → agent 创建任务、与你一起打磨 PRD，再动手实现。

## 一个会话如何运转

| 时机 | agent 收到什么 |
|---|---|
| 会话开始 | 一份快照：开发者、git 状态、当前/活跃任务、日志状态、spec 索引路径，以及 `Next-Action` 提示 |
| 每条消息 | 数行 `<workflow-state>` 面包屑，按活跃任务的状态（planning / in progress / 无任务）路由 |
| 每次 git 提交 | 有活跃任务时，post-commit hook 把 `{hash} {subject}` 记入其 `activity.jsonl`（Polygon 自身的记账提交会被跳过）—— 静默执行，绝不阻断提交 |

更深的指引按需加载：agent 真正需要某阶段细节时才运行 `python3 ./.polygon/scripts/get_context.py --mode phase --step <X.Y>`，而不是每个会话都为完整指南付出上下文成本。

## 任务工作流

三个阶段，每一步都落盘——重要的东西绝不只活在聊天记录里：

| 阶段 | 做什么 | 落盘到 |
|---|---|---|
| Plan | 头脑风暴 + 调研 → PRD | `.polygon/tasks/<task>/prd.md`、`research/*.md` |
| Execute | 主会话直接实现；lint / 类型检查 / 测试 | 你的代码 + `activity.jsonl` |
| Finish | 沉淀经验 → 提交 → 归档 | `.polygon/spec/`、日志、任务归档 |

一个典型任务（通常由 agent 驱动，你也可以自己跑）：

```bash
python3 ./.polygon/scripts/task.py create "Add rate limiting" --slug rate-limiting
# → 生成 .polygon/tasks/06-15-rate-limiting/ 与 task.json（status: planning）
#   ……把需求打磨进 prd.md ……

python3 ./.polygon/scripts/task.py start 06-15-rate-limiting
# → status: in_progress，本会话的活跃任务指针就位
#   ……实现、测试、提交（提交自动盖章活动日志）……

python3 ./.polygon/scripts/task.py archive 06-15-rate-limiting
# → status: completed，移入 .polygon/tasks/archive/2026-06/
```

支持斜杠命令的平台上，`/polygon:finish-work` 收尾活跃任务（归档 + 记日志），`/polygon:continue` 恢复任务。其他常用子命令：`current`（查看活跃任务）、`finish`（只清指针不归档）、`list`、`list-archive [YYYY-MM]`，以及任务树的 `add-subtask` / `remove-subtask`。

## `.polygon/` 里都有什么

| 路径 | 用途 |
|---|---|
| `workflow.md` | 工作流指南；同时是每轮面包屑文案的唯一来源 |
| `config.yaml` | 项目配置（见下文） |
| `spec/` | 分层编码规范；agent 写代码前读相关 `index.md`，新经验回写于此 |
| `tasks/<MM-DD-name>/` | 每个任务一个目录：`prd.md`、`task.json`、可选 `research/` |
| `tasks/archive/<YYYY-MM>/` | 已归档任务 |
| `workspace/<developer>/` | 会话日志（`journal-N.md`，约 2000 行自动滚动） |
| `scripts/` | 驱动一切的纯标准库 Python 脚本（`task.py`、`add_session.py`、`get_context.py` 等） |
| `.developer` | 你的身份（gitignored）—— 由 `python3 ./.polygon/scripts/init_developer.py <name>` 创建 |

## 多 LLM 活动日志

每个任务积累一份 append-only 的 `activity.jsonl` —— 每个动作一条 JSON 记录，解析到执行它的平台/模型：

```bash
python3 .polygon/scripts/task.py activity-log
# 2026-06-10T04:40:40Z  [claude/-] start: task started
# 2026-06-10T04:40:51Z  [claude/claude-fable-5] implement: archive smoke via updated workflow
# 2026-06-10T04:41:29Z  [claude/-] commit: 03ed140 test(activity): port python suites
# 2026-06-10T04:42:02Z  [codex/-] check: reviewed failover paths
# 2026-06-10T04:43:11Z  [claude/-] finish: task archived
```

`start`（planning → in_progress 转换时）、`archive` 与 git 提交自动盖章；`activity-append` 记录手动条目（决策、交接）：

```bash
python3 .polygon/scripts/task.py activity-append --action decision --note "keep retries at 0"
```

贡献者汇总进 `task.json` 的 `meta.agents[]`，日志条目记录 `**Agent**:` 行——任务中途从 Claude Code 切到 Codex，后来的 agent 读一遍 `activity-log` 就知道前任做了什么、决定了什么，无需共享会话。

## 配置

全部配置都在 `.polygon/config.yaml`，所有键均可选：

| 键 | 默认 | 效果 |
|---|---|---|
| `session_auto_commit` | `true` | 自动提交日志条目与任务归档（仅限 Polygon 自有路径，绝不碰你的代码） |
| `session_commit_message` | `chore: record journal` | 日志自动提交的 commit message |
| `max_journal_lines` | `2000` | 超过此行数滚动新建 `journal-N.md` |
| `codex.dispatch_mode` | `inline` | Codex 默认主会话直接干；`sub-agent` 恢复派发式面包屑 |
| `ultracode.enabled` | 关 | 在具备多代理 Workflow 工具的平台上，把面包屑切换到 fan-out 变体 |
| `packages.<name>.path` | — | 声明 monorepo 包；spec 变为按包组织（`spec/<package>/`） |
| `default_package` | — | 任务未指定包时的回退包名 |
| `session.spec_scope` | 全量 | 限制会话开始注入哪些包的 spec 索引（`active_task` 或列表） |
| `update.skip` | — | `polygon update` 不再管理的模板路径 |
| `hooks.after_create` / `after_start` / `after_finish` / `after_archive` | — | 任务生命周期后置 shell 命令（如同步 issue 系统） |

## 平台支持

`polygon init -y` 部署 Claude Code + Codex。另有 13 个平台通过 flag 选装——同一套工作流内容，以各平台的原生形态落地（斜杠命令、技能、子代理、hook/插件/扩展）：

| Flag | 平台 | 落点 |
|---|---|---|
| `--claude` | Claude Code | `.claude/` |
| `--codex` | Codex | `.codex/` + 共享 `.agents/skills/` |
| `--cursor` | Cursor | `.cursor/` |
| `--opencode` | OpenCode | `.opencode/`（JS 插件） |
| `--gemini` | Gemini CLI | `.gemini/` + 共享 `.agents/skills/` |
| `--copilot` | GitHub Copilot | `.github/` |
| `--kilo` | Kilo CLI | `.kilocode/` |
| `--kiro` | Kiro | `.kiro/` |
| `--antigravity` | Antigravity | `.agent/` |
| `--windsurf` | Windsurf | `.windsurf/` |
| `--qoder` | Qoder | `.qoder/` |
| `--codebuddy` | CodeBuddy | `.codebuddy/` |
| `--droid` | Factory Droid | `.factory/` |
| `--pi` | Pi Agent | `.pi/`（扩展） |
| `--reasonix` | Reasonix | `.reasonix/`（技能） |

## 升级

```bash
polygon update            # 不放心可先 --dry-run 预览
```

安全是设计出来的：

- 你的数据绝不被覆盖：`workspace/`、`tasks/`、`.developer` 是保护路径；`spec/` 仅在你配置了 spec registry（`registry.spec.source`）时才会被刷新。
- 你改过的模板文件靠内容哈希识别，逐文件询问——覆盖、跳过、或写 `.new` 副本（非交互场景用 `--force` / `--skip-all` / `--create-new`）。
- 你删过的文件保持删除；将被覆盖的模板文件先备份到 `.polygon/.backup-<timestamp>/`（registry 安装的 `spec/` 文件除外——记得把它们交给 git 管）。
- breaking 版本附带迁移：加 `--migrate` 应用重命名/删除（此类运行会绕过 `update.skip` 并给出警告）；breaking 版本带迁移指南时，CLI 还会自动创建一个带 AI 可读指引的迁移任务。

彻底移除：`polygon uninstall` —— 平台文件以安装清单为准只删 Polygon 写入的；同时**整个 `.polygon/` 目录会被删除**，包括你的任务、spec 与日志（先 commit 或导出）。`.claude/settings.json` 这类结构化配置在仍含你自己设置时只剥离 Polygon 字段而非整文件删除（`--dry-run` 可预览）。

## 致谢与许可

Polygon 构建于 Mindfold LLC 的 [Trellis](https://github.com/mindfold-ai/trellis) 任务/spec/日志架构之上。许可证：[AGPL-3.0](https://github.com/Subaru486desuwa/Polygon/blob/main/LICENSE)。
