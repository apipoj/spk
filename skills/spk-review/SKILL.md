---
description: Code review หลาย pass ก่อน merge - correctness, security, maintainability, tests, docs และ ship-readiness
argument-hint: "[diff range, branch, PR, 'wiki', หรือ working tree]"
---

# spk-review

รัน code review หลาย pass ครอบคลุม correctness, security, maintainability, tests, docs และ ship-readiness

## รวบรวม Context

- รัน `git status --short --branch --untracked-files=all`
- รัน `git diff --stat` และ `git diff --name-status`
- รัน `git log -5 --oneline`

## Review Passes

รันแต่ละ pass แยกกัน รวม findings ก่อนรายงาน

### Pass 1: Correctness และ Edge Cases
- Logic errors, off-by-one, null/undefined handling
- Edge cases: empty inputs, boundary values, concurrent access
- Error handling: errors ถูก catch, log และ surface อย่างถูกต้องไหม

### Pass 2: Security และ Secrets
- Hardcoded secrets, API keys, tokens, credentials
- Authorization checks บน sensitive endpoints
- Input validation และ sanitization
- ทุกบรรทัดที่ดูเป็น secret คือ fail-closed จนกว่าจะพิสูจน์ว่าปลอดภัย

### Pass 3: Maintainability และ Scope
- การเปลี่ยนแปลงตรงกับ goal ที่ระบุไหม
- Scope creep: มี changes ไม่เกี่ยวข้องผสมอยู่ไหม
- Code duplication ที่ควร extract
- ความชัดเจนและ consistency ของ naming

### Pass 4: Tests และ Docs
- behaviors ใหม่มี test ครอบคลุมไหม
- tests เดิมยังผ่านไหม
- การเปลี่ยนแปลงมี docs หรือยัง (API docs, README, inline comments)
- Docs drift: ถ้า behavior, commands, manifests หรือ public workflow เปลี่ยน docs ต้องอัพเดต

### Pass 5: Ship-Readiness Gate
- Quality gate สุดท้าย: จะ ship ไหม
- มี Critical หรือ Important issues = HOLD

## Output Format

```markdown
## Review Report
- Scope: <สิ่งที่ review>
- Files: <count และ list>

### Findings

#### Critical (blocks merge)
- <file:line> <issue> - <ทำไมสำคัญ> - <fix>

#### Important (ควรแก้ใน PR นี้)
- <file:line> <issue> - <ทำไมสำคัญ> - <fix>

#### Minor (ตามมาทีหลังได้)
- <file:line> <issue> - <suggestion>

### Verdict
<APPROVE | HOLD | REQUEST_CHANGES>
```

## Review Contract

- Critical: security/data loss/build พัง/behavior ผิด; blocks merge
- Important: ควรแก้ใน PR นี้ก่อน merge
- Minor: ตามมาทีหลังได้หรือ style suggestion
- Suggestions ไม่ใช่ blocker เว้นแต่มี concrete risk
- ทุกบรรทัดที่ดูเป็น secret คือ fail-closed จนกว่าจะพิสูจน์ว่าปลอดภัย
- ตรวจ docs drift เมื่อ behavior, commands, manifests หรือ public workflow เปลี่ยน
