# AI Sprint Kit (SPK)

ระบบ autonomous development สำหรับ Claude Code ติดตั้งเป็น plugin — hot-reload ใน session ทันที ไม่ต้อง restart

> English version: [README-EN.md](./README-EN.md)

<!-- SPK-COUNTS:start -->
**18 agents** (4 orchestrators + 14 specialists) · **9 commands**
<!-- SPK-COUNTS:end -->

## ติดตั้ง

```
/plugin marketplace add apipoj/spk
/plugin install spk@spk
```

เสร็จ Plugin hot-reload ให้เอง ไม่ต้อง restart `claude`

ครั้งต่อไปที่เริ่ม session ใหม่ SPK จะ scaffold `ai_context/wiki/` และ `ai_context/sources/` ใน project ของคุณอัตโนมัติ

Skills มี namespace `/spk:` ให้เอง — พิมพ์ `/spk:` แล้วจะเห็น `/spk:plan`, `/spk:code`, `/spk:review`, `/spk:deploy`, `/spk:ingest`, `/spk:query`, `/spk:wiki-lint`, `/spk:tdd`, `/spk:uninstall`

Agent ก็ namespace `spk:` ให้เหมือนกัน: `spk:planner`, `spk:architect`, ฯลฯ

## Agent Squad

<!-- SPK-AGENTS:start -->
| Name | Role | Model | Color | Phase |
|---|---|---|---|---|
| `plan-orchestrator` | orchestrator | claude-opus-4-7 | green | planning |
| `build-orchestrator` | orchestrator | claude-opus-4-7 | blue | building |
| `audit-orchestrator` | orchestrator | claude-opus-4-7 | purple | auditing |
| `deploy-orchestrator` | orchestrator | claude-opus-4-7 | orange | shipping |
| `prd-writer` | specialist | claude-opus-4-7 | green | planning |
| `business-analyst` | specialist | claude-opus-4-7 | green | planning |
| `architect` | specialist | claude-opus-4-7 | green | planning |
| `planner` | specialist | claude-opus-4-7 | green | planning |
| `debugger` | specialist | claude-opus-4-7 | purple | auditing |
| `code-auditor` | specialist | claude-opus-4-7 | purple | auditing |
| `implementer` | specialist | claude-sonnet-4-6 | blue | building |
| `tester` | specialist | claude-sonnet-4-6 | blue | building |
| `docs` | specialist | claude-sonnet-4-6 | blue | building |
| `researcher` | specialist | claude-sonnet-4-6 | blue | building |
| `verifier` | specialist | claude-sonnet-4-6 | purple | auditing |
| `devops` | specialist | claude-sonnet-4-6 | orange | shipping |
| `deployment-smoke` | specialist | claude-sonnet-4-6 | orange | shipping |
| `browser-tester` | specialist | claude-sonnet-4-6 | orange | shipping |
<!-- SPK-AGENTS:end -->

## Commands

<!-- SPK-COMMANDS:start -->
| Command | Dispatches to |
|---|---|
| `/plan` | plan-orchestrator |
| `/code` | build-orchestrator |
| `/review` | audit-orchestrator |
| `/deploy` | deploy-orchestrator |
| `/ingest` | plan-orchestrator |
| `/query` | researcher |
| `/wiki-lint` | audit-orchestrator |
| `/tdd` | build-orchestrator |
| `/uninstall` | (no agent) |
<!-- SPK-COMMANDS:end -->

## Memory

ทุก project ที่ติดตั้ง SPK จะได้ LLM-wiki สไตล์ Karpathy ที่ `ai_context/wiki/`:

- `sources/` — ไฟล์ raw ที่คุณ drop ลงมา ห้ามแก้ (immutable)
- `wiki/` — LLM เป็นคนดูแล page concept / entity / decision ข้ามโยงกันเอง
- `index.md` — catalog รวมทุก wiki page
- `log.md` — log แบบ append-only สำหรับ ingest / query / lint

Drop ไฟล์ลงใน `ai_context/sources/` แล้ว auto-ingest จะทำงานให้ ถาม `/spk:query "..."` แล้ว wiki จะตอบก่อนไปค้น web

## Security

ป้องกัน secrets ใน wiki 5 ชั้น:

1. ingest-time secret scan
2. pre-write fail-closed hook
3. lint-time audit
4. `ai_context/sources/` ถูก `.gitignore` by default
5. `.gitignore` respect ระหว่าง wiki-build

Secrets จะไม่หลุดเข้า wiki pages

## Requirements

- Claude Code (subscription — Max หรือ Pro)
- Git
- Node.js 20+ (ใช้ตอน install เท่านั้น agent ไม่ใช้ runtime)

## License

MIT
