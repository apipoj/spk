---
description: Implement จากแผน - ผลิต code ที่ commit แล้ว ผ่าน test และ docs อัพเดต
argument-hint: "[plan reference หรือ feature description]"
---

# spk-code

Implement feature จาก plan ที่มีอยู่ ทำงานเป็น task เล็ก ๆ แบบ TDD commit งานที่ตรวจสอบแล้ว และอัพเดต docs

## รวบรวม Context

- ถ้าอยู่ใน git worktree ให้รัน `git status --short` และ `git log -3 --oneline`; ถ้าไม่ใช่ git repo ให้ข้าม git context และทำงานต่อ
- หา plan file (ปกติอยู่ที่ `ai_context/wiki/plans/` หรือ path ที่ระบุ)
- ดู project structure (package.json, tsconfig, pyproject.toml ฯลฯ)

## Workflow

1. **อ่าน plan** โหลด plan file แล้วดึง: goal, non-goals, tasks, gates, acceptance criteria
2. **เลือก task ถัดไป** เลือก task แรกที่ยังไม่เสร็จ ถ้าไม่มี plan ให้ช่วย user แยก feature เป็น task เล็ก ๆ ที่ตรวจสอบได้ก่อน
3. **TDD ต่อ task** สำหรับแต่ละ task:
   - เขียนหรือระบุ test ที่พิสูจน์ behavior
   - รัน test และยืนยันว่า fail (RED)
   - Implement code ขั้นต่ำที่ทำให้ pass (GREEN)
   - รัน regression suite เพื่อยืนยันว่าไม่มีอะไรพัง
   - Refactor เฉพาะตอน green
   - Commit ตาม commit message ที่ plan แนะนำ
4. **ตรวจสอบ gates** หลังแต่ละ task รัน verification commands จาก plan หยุดถ้า gate ใด fail
5. **อัพเดต docs** ถ้า plan มี docs tasks ให้ทำตาม workflow
6. **รายงานความคืบหน้า** สรุปว่าทำอะไรไป ถัดไปคืออะไร และมี deviation จาก plan ไหม

## Output Format

```markdown
## Implementation Progress
- Task ที่เสร็จ: <task name>
- Files ที่เปลี่ยน: <list>
- Tests: <pass/fail summary>
- Commit: <hash หรือ message>
- Task ถัดไป: <name หรือ "done">
- Deviations: <none หรือ description>
```

## มาตรฐาน Plan

ถ้ายังไม่มี plan ให้สร้าง plan ที่มี:
- Tasks เป็น action 2-5 นาทีที่ตรวจสอบได้แบบอิสระ
- ทุก task มี file path ที่ชัดหรือขั้นตอน discovery ที่ชัด
- ทุกการเปลี่ยน behavior มีขั้นตอน TDD
- Plan บอกว่าจะไม่ build อะไร
- Acceptance criteria สังเกตได้และ test ได้

## ข้อควรระวัง

- อย่าข้าม test ถ้า test harness ไม่มี ให้ flag `NEEDS_TEST_HARNESS`
- อย่า commit ตอน red ทุก commit ต้องมี test ที่ผ่าน
- ถ้า task ใหญ่เกินไป ให้แยกก่อน implement
- อย่าแก้ไฟล์นอก scope ของ plan โดยไม่ถาม
