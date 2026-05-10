---
description: ถอน SPK ออกจาก project นี้ - ลบ files, hooks และ markers ที่ SPK จัดการ โดยรักษา user data
---

# spk-uninstall

ลบ artifacts ที่ SPK จัดการออกจาก project User data (wiki, sources) ถูกรักษาไว้

## Workflow

1. ลบ entries ใน `.claude/agents/` ที่มาจาก SPK (ไฟล์ที่ frontmatter `name` ตรงกับ SPK-managed worker name)
2. ลบ entries ใน `.claude/commands/` ที่ตรงกับ SPK skill patterns (ไฟล์ skill legacy ที่ namespaced)
3. ลบ entries ใน `.claude/hooks/` ที่ SPK install ไว้ (บันทึกใน `.spk/installed.json` หลัง install)
4. ลบ directory `.spk/` ทั้งหมด
5. ถ้า CLAUDE.md มี block `<!-- SPK:start -->` ... `<!-- SPK:end -->` ให้ลบเฉพาะ block นั้น (รักษา user content ด้านบน/ล่าง)
6. **ห้ามแตะ `ai_context/wiki/` หรือ `ai_context/sources/`** นั่นคือ user data
7. พิมพ์ summary: สิ่งที่ลบและสิ่งที่รักษาไว้

## Output Format

```markdown
## Uninstall Summary
- ที่ลบ:
  - <list ของ files/directories ที่ลบ>
- ที่รักษาไว้:
  - `ai_context/wiki/` (user data)
  - `ai_context/sources/` (user data)
  - <items อื่น ๆ ที่รักษาไว้>
```

## ข้อควรระวัง

- ห้ามลบ `ai_context/wiki/` หรือ `ai_context/sources/`
- ห้ามแก้ไฟล์นอก paths ที่ SPK จัดการ
- รักษาเนื้อหาที่คนเขียนทั้งหมด
