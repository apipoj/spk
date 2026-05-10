---
description: นำไฟล์ต้นทางเข้าสู่ project wiki - สกัด entities, concepts และ decisions เป็น wiki pages ที่เชื่อมโยงกัน
argument-hint: "[file path หรือ URL]"
---

# spk-ingest

นำ source file เข้าสู่ wiki สกัด entities, concepts และ decisions แล้วเขียนเป็น wiki pages ที่ cross-link กัน

## รวบรวม Context

- เช็ค sources ที่มีใน `ai_context/sources/`
- เช็ค wiki index ที่ `ai_context/wiki/index.md`

## Workflow

### 1. รับ Source
- ถ้าเป็น file path: copy ไปที่ `ai_context/sources/` (immutable)
- ถ้าเป็น URL: fetch content แล้ว save ไปที่ `ai_context/sources/`
- คำนวณ SHA256 เพื่อ idempotency ข้ามถ้า ingest แล้ว

### 2. สกัด Entities
- อ่าน source content และระบุ: concepts, entities, decisions, people, projects, technologies, relationships
- บันทึก dates, version numbers และ temporal references

### 3. สร้างหรืออัพเดต Wiki Pages
- สร้าง wiki pages แยกสำหรับ entities/concepts สำคัญ
- Cross-link pages ที่เกี่ยวข้อง
- อัพเดต `ai_context/wiki/index.md` ด้วย entries ใหม่
- Append entry ไปที่ `ai_context/wiki/log.md`

### 4. ตรวจสอบ
- ยืนยันว่าไม่มี secrets รั่วเข้า wiki pages (scan keys, tokens, credentials)
- ยืนยันว่าเคารพ .gitignore rules
- ตรวจสอบว่า cross-links resolve ได้

## Output Format

```markdown
## Ingest Report
- Source: <file path หรือ URL>
- Saved to: `ai_context/sources/<filename>`
- Wiki pages ที่สร้าง/อัพเดต: <list>
- Index อัพเดต: <yes/no>
- Log appended: <yes/no>
- Secrets ที่พบ: <none หรือ count>
```

## ข้อควรระวัง

- Sources เป็น immutable ห้ามแก้ไฟล์ใน `ai_context/sources/`
- ห้ามเขียน secrets เข้า wiki pages
- เคารพ .gitignore เมื่อ scan project
- ข้ามถ้า source SHA256 ตรงกับไฟล์ที่ ingest แล้ว
