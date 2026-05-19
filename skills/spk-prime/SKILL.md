---
description: Prime repo เพื่อ development - scan source folders และสร้าง/อัพเดต AGENTS.md context files โดยให้ CLAUDE.md เป็น @AGENTS.md pointer
argument-hint: "[scope: repo|frontend/|apps/api/|packages/*]"
---

# spk-prime

Scan source-code folders และสร้างหรืออัพเดต `AGENTS.md` เป็น canonical local context file เพื่อให้ downstream development work มี project knowledge ที่ถูกต้อง โดย `CLAUDE.md` ใน folder เดียวกันต้องเป็น pointer บรรทัดเดียว `@AGENTS.md`

## รวบรวม Context

- ถ้าอยู่ใน git worktree ให้รัน `git status --short` และ `git log -3 --oneline`; ถ้าไม่ใช่ git repo ให้ข้าม git context และทำงานต่อ
- ระบุ source subtrees ที่สำคัญ (package.json, pyproject.toml, go.mod, Cargo.toml, tsconfig, requirements.txt)

## Workflow

### 1. Scan Source Roots
- เดินตาม project tree และระบุ source directories ที่สำคัญ
- ข้าม node_modules, .git, dist, build และ generated directories อื่น ๆ
- เคารพ .gitignore patterns

### 2. วิเคราะห์แต่ละ Subtree
- ระบุ: language, framework, test setup, build tool, entry points
- บันทึก dependencies, scripts และ configuration
- ตรวจจับ monorepo structure (workspaces, packages, apps)

### 3. สร้างหรืออัพเดต Context Files
- เขียนหรืออัพเดต `AGENTS.md` ที่ root และใน source subfolders ที่เกี่ยวข้องเป็น source of truth
- ให้ `CLAUDE.md` ใน folder เดียวกันมีเฉพาะ pointer บรรทัดเดียว `@AGENTS.md`
- ถ้ามี `CLAUDE.md` เดิมที่มีเนื้อหาสำคัญ ให้ migrate เนื้อหาเฉพาะที่ยังไม่มีไปไว้ใน `AGENTS.md` ก่อน แล้วค่อยเปลี่ยน `CLAUDE.md` เป็น pointer
- เก็บ `AGENTS.md` ให้กระชับและตรงตัวเป็นจริง
- อนุรักษ์เนื้อหาที่คนเขียนใน `AGENTS.md` อย่าเขียนทับ sections ที่มีอยู่

### 4. ตรวจสอบ
- ยืนยันว่าไม่มี source code ถูกแก้ไข
- ยืนยันว่าไม่มี secrets ถูกเขียน
- ยืนยันว่า `CLAUDE.md` ทุกไฟล์ที่อยู่คู่กับ `AGENTS.md` มีแค่ `@AGENTS.md`
- ยืนยันว่าเคารพ .gitignore

## Output Format

```markdown
## Prime Report
- Scope: <repo หรือ specific paths>
- Source trees ที่พบ: <list>
- Context files ที่สร้าง: <list ของ AGENTS.md/CLAUDE.md pointer>
- Context files ที่อัพเดต: <list ของ AGENTS.md/CLAUDE.md pointer>
- Directories ที่ข้าม: <list>
- Source code ที่เปลี่ยน: <none>
- Secrets ที่พบ: <none>
```

## ข้อควรระวัง

- อย่าแก้ product source code
- อย่าเขียน secrets เข้า context files
- เคารพ .gitignore
- อย่าเขียนเนื้อหาซ้ำทั้งใน `CLAUDE.md` และ `AGENTS.md`; `CLAUDE.md` ต้องเป็น `@AGENTS.md`
- อนุรักษ์เนื้อหาที่คนเขียนใน `AGENTS.md` ที่มีอยู่
- เก็บ `AGENTS.md` ให้กระชับ ชอบ structure และ commands มากกว่า prose
