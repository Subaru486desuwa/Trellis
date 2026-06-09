# Trellis Fork 减法评估报告

评估对象：`/Users/shilinghan/Developer/trellis`（fork of mindfold-ai/trellis，npm: @subaru486/trellis 0.5.20）
判断准则：注入越少越好；记录格式越简单越好；强制规则只留防事故的，流程性的全部降为建议。

注意双事实源：`.trellis/workflow.md`（690 行，运行时读取）与 `packages/cli/src/templates/trellis/workflow.md`（810 行，模板源，含用户的 ultracode 段）。以下行号默认指 `.trellis/workflow.md`，模板侧另行标注。

---

## A. 「压制思考」清单（按危害排序)

| # | 机制 | 位置 | 为什么有害 |
|---|------|------|-----------|
| 1 | **主会话禁止写代码，强制派 sub-agent** | `.trellis/workflow.md:200`（"the main agent does NOT edit code by default"）；解锁短语白名单 `:203`；`config.yaml:70-71` 的 `dispatch_mode: inline` 被 `inject-workflow-state.py:240-243` 写死只对 codex 生效 | 危害最大的单项。拥有完整对话上下文的主模型被贬为调度员，实际写码的 trellis-implement 只能看到 jsonl 注入的 spec + prd.md——上下文最丰富的模型不许动手，上下文最贫乏的代理负责实现。Codex 侧已有官方 inline 模式且运转正常，证明强制派发并非必需。 |
| 2 | **任务准入强制 + 解锁短语白名单** | `.trellis/workflow.md:154-156`："'It looks small' is NOT grounds for downgrading"；C 路线要求用户当轮消息精确包含 "skip trellis"/"直接改" 等短语，"Without seeing one of these phrases you must NOT inline on your own" | 直接剥夺模型对任务规模的判断权。一行 typo 修复也要走 create→brainstorm→jsonl→start 全流程，除非用户念出咒语。模型本可自行判断"这是 30 秒的事"，框架明令禁止它这样判断。 |
| 3 | **反合理化表（预先把正确思路定义为错误）** | `.trellis/workflow.md:247, 275-297` 的 "DO NOT skip skills" 表 | 把"这很简单，我直接写""我在 plan mode 已经想清楚了"等模型的合理判断预先列为禁止思路。这不是约束行为，是约束推理本身——典型的 anti-thinking 设计。 |
| 4 | **ultracode 默认强制 fan-out**（用户已自行打补丁） | 模板 `workflow.md:259`（check 必须按 4 维度并行派发）；用户在 `:258` 加的 "Trivial turn — answer directly, no fan-out" 逃生口（d63ab42f，未推送） | 逃生口的存在本身就是证据：补丁前连纯问答轮也会触发 check pipeline。逃生口必须保留，且其"按轮次性质分流"的思路应推广为默认设计。 |
| 5 | **Phase 1.3 jsonl 策展强制门禁** | `.trellis/workflow.md:170`；`session-start.py:84-105, 346-358` 的 gate 持续催办 | 真实数据已证伪其必要性：归档任务 `05-19-main-0-5-18-release-manifest` 的 jsonl 至今只有 `_example` 种子行，工作照常完成。inline 模式下这是纯仪式。 |
| 6 | **brainstorm 模板填空化** | `.claude/skills/trellis-brainstorm/SKILL.md`（538 行）：`:37` 一次只准问一个问题、`:195-225` 禁止主会话内联研究（附 ❌/✅ 示范）、`:286-330` 强制 Expansion Sweep + 固定话术模板 | 把需求探讨变成填表。"禁止主会话做 WebSearch" 对单人研究项目毫无收益——研究本来就该在上下文最全的地方做。 |
| 7 | **自动续跑 + 强制开场白** | `session-start.py:751-755`（READY 任务"不许问直接执行"）；`session-start.py:67-71` FIRST_REPLY_NOTICE 固定中文首句 | 前者替用户做了"是否继续"的决定；后者是零信息量的仪式输出，每个会话浪费首句。 |
| 8 | **research 代理禁止评判** | `.claude/agents/trellis-research.md:137`："Don't propose improvements or critique implementation" | 研究代理只许描述不许评判——发现问题也不许说。对单人项目，研究和批评分离纯属角色洁癖。 |
| 9 | **提交七步仪式 + 一次性确认** | `.trellis/workflow.md:577-625`：固定 plan 文案模板、用户拒绝后"不许第二次提案"（:619）、空判断也要走 spec 更新流程（:568-575） | commit 分组和文案是模型完全胜任的判断；"被拒后不许再提案"反而阻止了修正。唯一有价值的是 `:597` 未识别脏文件保护（见 C 节）。 |
| 10 | **冲突的外部 skill** | `python-design/SKILL.md:445-451` 要求"每次改动花 10-20% 改善周边设计" | 与用户全局 CLAUDE.md 的外科手术原则直接矛盾，留着是负资产。 |

---

## B. 「冗余」清单（按可删体量排序）

### B1. 纯死重（直接删，零风险）

| 项 | 体量 | 说明 |
|----|------|------|
| `.cursor/` `.opencode/` `.pi/` 整目录 | 三套完整平台配置（hooks/agents/skills/commands，含 `.opencode` JS 重写、`.pi` TS 重写），仅 agents 部分就 ~728 行 | 从不被加载；且已与模板漂移（`.opencode/agents` 仍是旧文本），留着只增加同步面 |
| `workflow.md` 非 claude/codex 平台标签块 | `:249-297, :346-360, :373-420, :444-448, :458-508, :512-536` 等处的 Kiro/Gemini/Qoder/CodeBuddy/Copilot/Droid/Kilo/Antigravity/Windsurf 变体，正文 1/3 以上 | 每会话被 SessionStart 全文注入，纯 token 税 |
| `common/cli_adapter.py` | 811 行（15 平台命令构造） | 双运行时用不到 |
| `common/packages_context.py` + config monorepo/scope 机制 | ~600 行 | 单仓库用不到；`task.py` 的 `--package`/`add-subtask`/`set-scope` 同理 |
| `contribute/SKILL.md` | 421 行 | 上游仓库 PR 指南，与用户项目无关 |
| `first-principles-thinking/SKILL.md` + references/ | 403 行 + 5 文件 | 外部拼装，强制闸门（≥3 公理/≥5 假设/六阶段）把讨论变填表 |
| `python-design/SKILL.md` | 451 行 | 与用户原则冲突（见 A10） |
| `.trellis/agents/` 孤儿目录 | 344 行（research 274 + implement 33 + check 37） | 全仓库无任何引用；**但 research.md:51-207 的证据规则先移植再删**（见 C） |
| `linear_sync.py` + `audit-workflow.mjs` | 243 行+ | 未在 config.yaml 启用 |
| `.codex/hooks/session-start.py` | 整文件 | 未在 `.codex/hooks.json` 注册 |
| `.claude/skills/*/SKILL.md.backup` | 5 个文件（已确认存在） | 死文件 |
| `[workflow-state:completed]` 块 | `workflow.md:224-236` | 块内自述 "currently DEAD" |
| `AGENTS.md:30-53` Codex 多代理协议 | ~24 行 | `dispatch_mode: inline` 下不触发 |
| `common/task_queue.py`、Cursor shell-ticket 机制（`active_task.py:255-378` ~150 行）、`_ENV_SESSION_KEYS` 中 9 个非 claude/codex 平台条目、三个 hook 中 `_detect_platform` 的 7 个平台分支 | 合计数百行 | 双平台用不到 |
| `create-manifest.md`(241) + `publish-skill.md`(143) | 384 行 | Trellis 自身发版工具（注意：用户发 npm 包要用，**留在 fork 但不进入用户项目部署**） |
| 过期的 `workspace/index.md` Active Developers 表 | — | 数据过期 4 个月，证明无人维护 |

### B2. 有信息但过重（压缩）

| 项 | 现状 → 目标 | 说明 |
|----|------------|------|
| SessionStart 注入 | 实测 27KB ≈ 6,800 tokens/会话（且 compact 后重注入）→ **<1.5KB** | workflow.md ~9KB 全文抽取改为"Phase 概览 5 行 + 详读 `.trellis/workflow.md`"；guides/index.md 103 行内联改路径引用；删 FIRST_REPLY_NOTICE 和 `<ready>` 自动续跑 |
| 每轮面包屑 | in_progress 2,406 字符（~600 tokens/轮）、ultra 变体 ~650-700 tokens/轮 → **每状态 3-5 行** | 机制保留，砍掉 dispatch 协议、override 短语表、自我豁免、A/B/C 判决书 |
| `trellis-brainstorm` | 538 → ~80 行 | 留 PRD 先行落盘 / research 写文件不留对话 / 先查再问；删模板话术、Expansion Sweep、复杂度分类表 |
| `trellis-update-spec` | 356 → ~50 行 | 留触发表 + spec/guide 区分；删 7 段强制模板和 6 套填空模板 |
| `trellis-break-loop` | 130 → 并入 update-spec ~15 行 | 5 维提问清单即可；删 sync templates 步骤（上游仓库专属死指令） |
| `trellis-start` + `trellis-continue` | 121 → 0-60 行 | start 是"无 hook 平台 fallback"，Claude/Codex 都有 hook，删；continue 留作入口或并入 hook |
| skills/agents/commands 多副本 | 5 份 skills 树、6 份 agents 定义、3 份 commands → **各 1 份** | `.agents/skills/` 作源 + `.claude/skills` symlink；`.claude/commands/trellis/continue.md` 与 SKILL.md 逐字重复，二选一 |
| 仓库 `CLAUDE.md:7-65` 行为守则 | 65 → ~10 行 | 与用户全局 `~/.claude/CLAUDE.md` 逐条重复且双份同时进 context |
| journal 模板 | 6 区块 → 标题+日期+分支+Summary+commit hashes | 真实数据中 Main Changes 恒为 "(Add details)"、Testing 恒为占位符——5/6 区块从未载过信息 |
| `task.json` | 18+ 字段 → ~7 字段（id/title/status/priority/creator/createdAt/base_branch） | 真实样本中其余字段全为 null |
| ultracode 协议段 | 模板 `workflow.md:681` 起 ~70 行 → 压一半 | check pipeline JS 示例 ~25 行压成要点；implement worktree fan-out（自标 experimental）缩成一句 |
| 同一规则三处注入 | 面包屑块 / Phase 正文 / `<task-status>` 各写一遍 dispatch 强制 + override 表 | inline 化后这些规则本身消失，三处重复自然解决 |

体量结论：~6,900 行 Python + 五平台资产可收敛到 **<1,000 行脚本 + 单平台资产**；每会话注入从 ~7k tokens 降到 <500，每轮从 300-700 tokens 降到 <100。

---

## C. 最小核心设计

### 设计原则
- **状态在文件里，不在提示词里**。注入只回答"我是谁、有没有进行中的任务、任务文件在哪"，其余靠模型自己读。
- **inline 是默认**，sub-agent 是模型可选的工具而非强制管道。
- **强制规则只剩防事故的 5 条**（见下），其余全部改为建议语气。

### 目录结构

```
project/
├── CLAUDE.md            # ~5 行：@AGENTS.md（或一行"读 AGENTS.md"）
├── AGENTS.md            # 单一事实源，~40 行：工作流约定 + 任务记录格式 + 硬规则
├── .claude/
│   ├── settings.json    # SessionStart + UserPromptSubmit 两个 hook
│   ├── hooks/
│   │   ├── session-start.py        # ~30 行：跑 get_context.py，注入 <1.5KB
│   │   └── inject-state.py         # ~60 行：按 task.json.status 注入 3-5 行面包屑
│   ├── agents/          # 可选保留 research/implement/check（精简版），供模型按需派发
│   └── skills/ -> ../.agents/skills/   # symlink，或直接只留 .claude/skills 一份
├── .codex/
│   └── hooks.json + inject-state.py   # 复用同一 workflow.md 标签解析，保留 codex 分流
└── .trellis/
    ├── workflow.md      # ~150 行：Phase 概览 + 精简面包屑标签块 + ultracode 段（含逃生口）
    ├── config.yaml      # ~15 行：developer + dispatch_mode（claude 也可设 inline）+ ultracode 开关
    ├── tasks/
    │   ├── {MM-DD-slug}/
    │   │   ├── task.json    # 7 字段
    │   │   ├── prd.md
    │   │   └── research/*.md
    │   └── archive/{YYYY-MM}/
    ├── spec/            # 知识沉淀，index.md 只注路径不注正文
    ├── workspace/<dev>/journal-N.md   # 精简模板
    └── scripts/
        ├── task.py          # ~200 行：create/start/current/finish/archive/list
        ├── add_session.py   # 去 package 逻辑
        ├── get_context.py   # 文本输出
        └── common/          # active_task 简化为 claude/codex 两组 env key + 单会话 fallback
                             # 保留 SESSION_FALLBACK_MAX_AGE_SECONDS=1800（用户补丁）
```

### Claude / Codex 共享方式
- **单一事实源是 AGENTS.md**（Codex 原生读取）；CLAUDE.md 只含 `@AGENTS.md` 一行 import——两个运行时读到逐字相同的约定，消除双文件漂移。
- **任务记录共享**：双方都通过 `task.py` 操作同一 `.trellis/tasks/`，active-task 指针走 `.trellis/.runtime/sessions/`（Claude 用 session_id，Codex 走 fallback + 1800s 过期保护——用户 2d4b73f5 补丁原样保留）。
- **面包屑共享**：`workflow.md` 的 `[workflow-state:*]` 标签块仍是唯一事实源，Claude/Codex 各自的 inject-state.py 只做解析；`resolve_breadcrumb_key` 的 codex→inline 分流和 `ULTRACODE_PLATFORMS` 门控原样保留，对应的 3 个回归测试（`packages/cli/test/regression.test.ts`）不动。

### 注入预算
| 时机 | 内容 | 预算 |
|------|------|------|
| SessionStart（Claude） | 开发者/git status/active tasks/journal 指针 + "任务记录在 .trellis/tasks/，约定见 AGENTS.md" | ≤40 行 / <1.5KB |
| 每轮面包屑（双端） | `no_task`: 1-2 行（"无活动任务；实现类工作建议 task.py create 建任务记录"）；`planning`/`in_progress`: 3-5 行（任务路径 + 当前阶段 + 下一步建议） | ≤5 行 / <100 tokens |
| Codex 每轮 | 同上 + codex-mode 一行 | ≤6 行 |
| PreToolUse sub-agent 注入 | 仅在模型主动派发时生效，保留 prd.md + jsonl 机制（jsonl 改为可选） | 按需 |

### 保留的强制规则（只防事故，共 5 条）
1. 未识别脏文件不得静默打包进提交（原 `workflow.md:597`）。
2. 禁止擅自 `git push` / `--amend` 已存在的提交。
3. sub-agent 禁止 git commit/push/merge + 递归护栏（自豁免防套娃，`:257`/codex `multi_agent=false`）。
4. research 产出必须落盘到 `{TASK_DIR}/research/`，聊天只回路径+摘要（"conversations get compacted, files don't"）。
5. 用户全局规则继承：不擅自改实验超参/数据 pipeline（已在 `~/.claude/CLAUDE.md`，工作流不重复）。

**降为建议**：建任务、brainstorm、jsonl 策展、派 sub-agent、spec 更新、commit 分组——全部改为"建议/默认推荐"语气，模型按轮次性质自行判断（推广用户逃生口 `:258` 的分流思路）。override 短语白名单整体删除——inline 是默认后它失去存在意义。

### 用户定制保护清单（不可丢）
- 逃生口行（d63ab42f，模板 `:258`）——保留并推广其思路。
- `SESSION_FALLBACK_MAX_AGE_SECONDS=1800` + `touch_session_last_seen`（2d4b73f5）。
- codex→inline 分流 + `ULTRACODE_PLATFORMS` 门控 + 3 个回归测试（4320debe）。
- @subaru486/trellis rebrand 全链路（package.json/CI/README 双语 npm 徽章/AGPL 归属）。
- ultracode fan-out 纪律（commit 永远主会话驱动、Active task 前缀、repo-root 约束）——保留为 ultracode 开启时的协议，但受逃生口分流管辖。
- 移植后再删：`.trellis/agents/research.md:51-207` 的证据纪律（clone 真实源码、逐字片段+file:line、禁模糊短语表）→ 并入 `.claude/agents/trellis-research.md` 和 `.codex/agents/trellis-research.toml`。

---

## D. 删减执行顺序

注意全程的双事实源约束：`.trellis/scripts/` 与 `packages/cli/src/templates/trellis/scripts/`、`.trellis/workflow.md` 与模板版需同步改（归档任务 prd 已明确这一要求）。每步独立 commit，方便回退。

### 第 1 步：删纯死重（零风险，~50% 体量）
- 删 `.cursor/` `.opencode/` `.pi/` 整目录；删 `.trellis/agents/implement.md` `check.md`；删 5 个 `SKILL.md.backup`；删 `.codex/hooks/session-start.py`、`linear_sync.py`、`audit-workflow.mjs`。
- 删 skills：contribute、first-principles-thinking、python-design、trellis-start。
- **前置动作**：先把 `.trellis/agents/research.md:51-207` 证据规则移植进 `.claude`/`.codex` 两版 research 定义，再删该文件。
- 风险：几乎为零；唯一注意 fork 还要给上游发 PR 或发 npm 包时，模板目录 `packages/cli/src/templates/` 下的多平台模板**不删**（那是产品的一部分），只删项目根的部署副本。

### 第 2 步：砍脚本死代码（低风险）
- 删 `cli_adapter.py`、`packages_context.py`、monorepo/scope/subtask 相关、`task_queue.py`、Cursor shell-ticket、非 claude/codex 平台分支与 env keys。
- 风险：`active_task.py` 改动碰到用户的 stale-session 补丁——改前跑 `packages/cli/test/regression.test.ts` 建立基线，改后必须仍通过。`task.py` 的 `current --source` 被 agents/hook 依赖，保留接口。

### 第 3 步：解除强制、改写 workflow.md（核心步，中风险）
- 重写 `[workflow-state:*]` 各标签块至 3-5 行：删 A/B/C 判决书、两套 override 短语表、dispatch 协议详文、"It looks small is NOT grounds" 类说教、`:275-297` 反合理化表、`:224-236` 死块。
- Claude 默认 inline：放开 `inject-workflow-state.py:240-243` 的 platform 判断（或直接给 config.yaml 加 `claude.dispatch_mode: inline`）。
- 删非 claude/codex 平台标签块；Phase 1.3 jsonl 降为可选；Phase 3.3 改为"有新知识才更新 spec"；Phase 3.4 压成两条硬规则（脏文件确认 + 禁 push/amend）。
- 保留 in_progress-ultra 块，但把逃生口分流逻辑前置，且三个 in_progress 变体的重复段（commit 规则/dirty-tree）抽到共享文本。
- 风险：**最高**。(a) 面包屑标签是状态机契约，hook 解析依赖标签格式，改完手动跑 `inject-workflow-state.py` 验证各 status 输出；(b) 用户的 regression.test.ts 有 required-step 不变量测试，删行前先改测试预期；(c) 模板版与 `.trellis/` 版同步改。

### 第 4 步：瘦身注入侧（中风险）
- `session-start.py`：删 FIRST_REPLY_NOTICE、`<ready>` 自动续跑、workflow.md 全文抽取（换 5 行概览 + 文件指引）、guides/index.md 内联（换路径）；目标注入 <1.5KB。
- 压缩 skills：brainstorm 538→80、update-spec 356→50、break-loop 并入 update-spec；skills 树收敛为一份 + symlink；commands 与 skills 去重。
- 风险：compact matcher 重注入逻辑（`session-start.py:551-566` 的剥离逻辑）依赖注入结构，简化后该剥离逻辑本身也可删，但要实测一次 /compact 后状态不丢。

### 第 5 步：统一事实源 + 收尾（低风险）
- 重写 AGENTS.md（~40 行单一事实源），CLAUDE.md 改为 `@AGENTS.md`；删仓库 CLAUDE.md 与用户全局重复的 7-65 行。
- 精简 journal 模板与 `task.json` 字段（`task.py` 写入端同步改，旧任务文件向后兼容——读取端对缺字段容错即可）。
- 删过期的 `workspace/index.md` 开发者表。
- 验收：新会话冷启动（Claude + Codex 各一次），确认双端能 create→start→archive 同一任务、journal 正常追加、面包屑状态正确流转、ultracode 逃生口生效。

### 整体回退保障
- 第 3、4 步前各打 tag；保留 regression.test.ts 全绿作为每步的合并条件。
- 不删除任何 `.trellis/tasks/archive/` 与 `workspace/` 历史数据——它们是持久化记录本体，瘦身只动机制不动数据。