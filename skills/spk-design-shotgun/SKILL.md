---
description: ทำ visual brainstorm แบบ design shotgun - สร้างหลายทิศทาง UI ที่แตกต่างกัน เปรียบเทียบข้าง ๆ กัน เก็บ feedback และล็อก design ที่อนุมัติก่อน implement
argument-hint: "[screen, product area, URL, screenshot, หรือ rough UI idea]"
---

# spk-design-shotgun

สร้างหลายทิศทาง design ก่อน commit ไป implement เปรียบเทียบ เก็บ feedback และล็อกทิศทางที่อนุมัติ

ใช้ตอน: "ขอดู design options", "UI นี้ไม่ถูกใจ", "visual brainstorm", "ขอหลายแบบให้เลือก" หรือ "ทำให้ screen นี้ดูดีขึ้น"

## รวบรวม Context

- รัน `git status --short` และ `git log -3 --oneline`
- อ่าน DESIGN.md ถ้ามี
- ตรวจสอบ app/routes/components ที่เกี่ยวข้อง
- เช็ค designs ที่อนุมัติแล้วใน `.spk/design-shotgun/`

## Design Shotgun Loop

### 1. Context
อ่าน DESIGN.md, routes/components ปัจจุบัน, screenshots/URLs ที่มี และ approved designs เดิม เก็บเฉพาะ context ที่สำคัญต่อ design: audience, job-to-be-done, constraints และจำนวน variant (default 3)

### 2. Concepts
สร้าง 3 ทิศทางที่แตกต่างกัน แต่ละอันมี stance ไม่เหมือนกัน เช่น compact operator console, editorial trust layer, playful onboarding, brutalist power tool, calm B2B dashboard

### 3. Variants
สร้าง mockup แบบ self-contained สำหรับแต่ละ concept ชอบ HTML (inspectable, ง่ายต่อการ promote) แต่ละ variant ต้องต่างกันทั้ง layout, typography, palette และ density

### 4. Board
สร้าง comparison page ให้ user ประเมิน variants ทั้งหมดข้าง ๆ กัน

### 5. Feedback
ขอให้ user เลือก A/B/C, remix ส่วนบางอย่าง, regenerate หรือ approve สำหรับ implementation

### 6. Approval
เขียน approval record หลัง user confirmation อย่างชัดเจนเท่านั้น

## กฎป้องกัน Convergence

- แต่ละ variant ต้องต่างกันทั้ง **layout**, **typography**, **palette** และ **density**
- ถ้า 2 variants ดูเหมือนพี่น้องกัน ให้ regenerate อันที่อ่อนแอกว่า
- อย่าทำ SaaS cards 3 อันที่ต่างแค่สี accent
- อย่า copy UI จากบุคคลที่สามโดยตรง แปลง references เป็นหลักการ
- อย่าละเลย DESIGN.md เว้นแต่ user ขอสำรวจนอก design system

## Artifact Convention

```text
.spk/design-shotgun/<screen>-YYYYMMDD-HHMM/
├── board.html
├── README.md
├── variant-a.html
├── variant-b.html
├── variant-c.html
└── approved.json          # เฉพาะหลัง user confirmation
```

## Output Format

```markdown
## Design Shotgun Results
- Artifact dir: `.spk/design-shotgun/<screen>-<date>/`
- Board: `.spk/design-shotgun/<screen>-<date>/board.html`
- Variants: A <name>, B <name>, C <name>

### Head-to-head
- A: <จุดแข็ง> / <จุดอ่อน>
- B: <จุดแข็ง> / <จุดอ่อน>
- C: <จุดแข็ง> / <จุดอ่อน>

Recommendation: <เลือกหนึ่งและบอกเหตุผล>
```

## ข้อควรระวัง

- อย่าแก้ production source code เว้นแต่ user ขอ implementation โดยตรง
- Variants เป็น disposable artifacts มีไว้เพื่อประเมินเท่านั้น
- ต้องมี user confirmation อย่างชัดเจนก่อนจะ approve (ตอบข้อความ ไม่ใช่ assume)
