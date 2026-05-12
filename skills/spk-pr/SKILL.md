---
description: เตรียม ตรวจสอบ พุช และเปิด GitHub PR พร้อม PR body แบบ conventional commit และ CI follow-up
argument-hint: "[title หรือ scope; optional: draft|ready]"
---

# spk-pr

เตรียม GitHub pull request โหมด default คือ **prepare-only**: สร้าง PR body และ safety report โดยไม่ stage, commit, push หรือสร้าง PR

## รวบรวม Context

- ถ้าอยู่ใน git worktree ให้รัน `git status --short --branch --untracked-files=all`
- ถ้าอยู่ใน git worktree ให้รัน `git remote get-url origin` และ `git rev-list --left-right --count HEAD...origin/main`; ถ้า remote/main ไม่มี ให้บันทึกว่าไม่มีข้อมูลเปรียบเทียบ
- ถ้าอยู่ใน git worktree ให้รัน `git log --oneline --decorate -8` และ `git diff --stat`; ถ้าไม่ใช่ git repo ให้รายงานว่า PR context ไม่พร้อมแทนการหยุดด้วย error
- เช็ค `gh auth status`

## Workflow

### Prepare-Only Mode (default)

1. **Branch hygiene** เช็ค branch name, dirty files, untracked files
2. **Diff review** สรุปสิ่งที่เปลี่ยน: files, lines, scope
3. **Conventional PR body** สร้าง PR body แบบมีโครงสร้าง:
   - Title (conventional commit format)
   - Summary ของ changes
   - Type (feat/fix/docs/refactor/ฯลฯ)
   - Breaking changes (ถ้ามี)
   - Testing notes
   - Checklist
4. **Safety report** Flag: secrets ใน diff, large binary files, missing tests, docs drift
5. **Output** พิมพ์ PR body และ safety report อย่า push หรือ create PR

### Open/Update Mode (explicit request เท่านั้น)

1. ทำทุกขั้นตอน prepare-only
2. Stage เฉพาะ paths ที่ review แล้ว อย่า `git add .` เมื่อมี untracked/generated files
3. รัน secret scan บน staged diff ที่แน่นอน
4. Commit ด้วย conventional message
5. หยุดรอ user confirmation อย่างชัดเจนก่อน push หรือ GitHub write
6. Push (ใช้ `--force-with-lease` เฉพาะเมื่อสั่งอย่างชัดเจน)
7. สร้างหรืออัพเดต PR ผ่าน `gh pr create/update`

## Output Format

```markdown
## PR Report
- Mode: <prepare-only|open|update>
- Branch: <name>
- Status: <ready|blocked>
- PR body: <full body text>
- Safety: <issues found หรือ "clean">
- Next step: <manual command หรือ auto-done>
```

## Safety Rules

- Default เป็น prepare-only: อย่า stage, commit, push หรือ create/update PR เว้นแต่ถูกขออย่างชัดเจน
- อย่า force-push เว้นแต่ถูกสั่งและใช้ `--force-with-lease`
- หยุดรอ operator confirmation อย่างชัดเจนก่อน `git push`, `git push --force-with-lease` หรือ `gh pr create/update`
- อย่า push จาก dirty `main` โดยไม่ระบุ commit ทั้งหมดที่จะออกไป
- Stage เฉพาะ paths ที่ review แล้ว อย่า `git add .` เมื่อมี untracked/generated/operator files
- Secret-scan staged diff ก่อน commit
- ถ้า GitHub auth ไม่มี ให้เตรียม PR body ไว้ที่เครื่องแล้วรายงาน setup steps
