---
description: Prime repo เพื่อ development - scan source folders และสร้าง/อัพเดต local context files
argument-hint: "[scope: repo|frontend/|apps/api/|packages/*]"
---

# spk-prime

Scan source-code folders และสร้างหรืออัพเดต local context files (CLAUDE.md, AGENTS.md) เพื่อให้ downstream development work มี project knowledge ที่ถูกต้อง

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
- เขียนหรืออัพเดต `CLAUDE.md` ที่ root และใน source subfolders ที่เกี่ยวข้อง
- เขียนหรืออัพเดต `AGENTS.md` ที่เหมาะสม
- เก็บ context files ให้กระชับและตรงตัวเป็นจริง
- อนุรักษ์เนื้อหาที่คนเขียน อย่าเขียนทับ sections ที่มีอยู่

### 4. ตรวจสอบ
- ยืนยันว่าไม่มี source code ถูกแก้ไข
- ยืนยันว่าไม่มี secrets ถูกเขียน
- ยืนยันว่าเคารพ .gitignore

## Output Format

```markdown
## Prime Report
- Scope: <repo หรือ specific paths>
- Source trees ที่พบ: <list>
- Context files ที่สร้าง: <list>
- Context files ที่อัพเดต: <list>
- Directories ที่ข้าม: <list>
- Source code ที่เปลี่ยน: <none>
- Secrets ที่พบ: <none>
```

## ข้อควรระวัง

- อย่าแก้ product source code
- อย่าเขียน secrets เข้า context files
- เคารพ .gitignore
- อนุรักษ์เนื้อหาที่คนเขียนใน CLAUDE.md/AGENTS.md ที่มีอยู่
- เก็บ context files ให้กระชับ ชอบ structure และ commands มากกว่า prose
