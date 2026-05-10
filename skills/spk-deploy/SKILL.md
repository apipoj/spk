---
description: Deploy, smoke test และตรวจสอบ deployment ไป staging หรือ production
argument-hint: "[env: staging|production]"
---

# spk-deploy

Deploy HEAD ปัจจุบันไป environment ที่ระบุ รัน smoke tests และตรวจสอบสุขภาพ

## รวบรวม Context

- รัน `git log -1 --format='%H %s'` และ `git branch --show-current`
- ตรวจสอบ working tree สะอาด (ไม่มี uncommitted changes)

## Workflow

### Pre-deploy Checks
1. ตรวจสอบว่า working tree สะอาด
2. ยืนยัน target environment (staging หรือ production)
3. ถ้า production: หยุดรอ user confirmation อย่างชัดเจน
4. เช็ค CI status บน branch ถ้าทำได้

### Deploy
1. รัน deployment command หรือ pipeline สำหรับ target environment
2. เก็บ deployment output และ result

### Smoke Tests
1. รัน deployment smoke tests (health checks, API pings, critical user flows)
2. ถ้ามี UI smoke tests ให้รันด้วย
3. เก็บผล pass/fail

### Report
สรุป deployment result, smoke test verdict และปัญหาที่พบ

## Output Format

```markdown
## Deployment Report
- Environment: <staging|production>
- Commit: <hash message>
- Deploy status: <success|failed>
- Smoke tests: <pass/fail summary>
- UI checks: <pass/fail/skipped>
- Issues: <none หรือ list>
- Rollback needed: <yes/no>
```

## ข้อควรระวัง

- อย่า deploy จาก dirty working tree โดยไม่ระบุ commit ทั้งหมดที่จะออกไป
- Production deployment ต้องมี user confirmation อย่างชัดเจน
- ถ้า deployment fail ให้ระบุ error ที่แน่นอนและ recovery steps ที่แนะนำ
- ถ้า smoke tests fail อย่าดำเนินการต่อ รายงานและแนะนำ rollback
