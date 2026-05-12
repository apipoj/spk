---
description: วางแผน feature - ผลิต plan สำหรับ developer พร้อม PRD, architecture, tasks แบบ TDD, gates และ rollout notes
argument-hint: "[feature description]"
---

# spk-plan

ผลิต plan สำหรับ developer พร้อม goal, non-goals, architecture, tasks แบบ TDD เล็ก ๆ, verification gates และ rollout notes

## รวบรวม Context

- ถ้าอยู่ใน git worktree ให้รัน `git status --short` และ `git log -3 --oneline`; ถ้าไม่ใช่ git repo ให้ข้าม git context และทำงานต่อ
- ดู project structure (CLAUDE.md, AGENTS.md, package.json, tsconfig, pyproject.toml, go.mod, Cargo.toml ฯลฯ)
- ดู plans ที่มีอยู่ใน `ai_context/wiki/plans/` ถ้ามี

## Workflow

### 1. ชี้ชัด
- แปล feature description จาก request ของ user
- ระบุ goal, non-goals, assumptions และคำถามที่ยังเปิดอยู่
- ถ้าข้อมูลสำคัญขาด ให้ถามคำถามเดียวที่เจาะจงแทนที่จะเดา

### 2. Architecture
- เสนอ architecture approach พร้อม source areas ที่ชัด
- ระบุ files, modules และ interfaces ที่ได้รับผลกระทบ
- บันทึก dependencies, risks และ migration concerns

### 3. แตก Task
- แยก feature เป็น tasks เล็ก ๆ (action 2-5 นาทีที่ทำได้)
- แต่ละ task ต้องมี: files ที่จะแตะ, expected change, TDD steps (RED/GREEN), verification commands และ commit message
- Tasks ต้องตรวจสอบได้แบบอิสระ

### 4. Verification Gates
- กำหนด verification gates ระหว่าง task groups
- รวม regression test commands
- รวม docs update tasks

### 5. Rollout และ Rollback
- บันทึก rollout steps และลำดับ
- บันทึก rollback plan
- บันทึก risks และ mitigations

### 6. บันทึก Plan
- บันทึกที่ `ai_context/wiki/plans/YYYY-MM-DD-<slug>.md`
- อัพเดต wiki index และ log

## Output Format

```markdown
## Plan: <feature name>
- Goal: <หนึ่งประโยค>
- Non-goals: <list>
- Assumptions: <list>
- Architecture: <approach>
- Tasks: <numbered list พร้อม file paths, TDD steps, verification>
- Gates: <verification checkpoints>
- Rollout: <steps>
- Rollback: <plan>
- Risks: <list>
- Open questions: <list>
```

## มาตรฐาน Plan

- Tasks เป็น action 2-5 นาทีที่ตรวจสอบได้แบบอิสระ
- ทุก task มี file path ที่ชัดหรือขั้นตอน discovery ที่ชัด
- ทุกการเปลี่ยน behavior มีขั้นตอน TDD
- Plan บอกว่าจะไม่ build อะไร
- Acceptance criteria สังเกตได้และ test ได้
- ถ้าความไม่แน่นอนเปลี่ยน architecture ให้ถามคำถามเดียวที่เจาะจงแทนที่จะเดา
