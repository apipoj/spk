---
description: รันเฉพาะ test suites ที่ได้รับผลกระทบจากไฟล์ที่เปลี่ยน โดย map ไฟล์ที่เปลี่ยนไปยัง suites ที่เกี่ยวข้อง และถ้า map ไม่ได้แน่ชัดให้ fallback ไปรันทั้งชุด
argument-hint: "[ไม่บังคับ: ระบุ paths ที่เปลี่ยนเอง; ค่าเริ่มต้นคือ git diff เทียบ HEAD]"
---

# spk-scoped-tests

เร่ง inner loop ด้วยการรันเฉพาะ test suites ที่การเปลี่ยนแปลงปัจจุบันมีผลกระทบ แทนที่จะรันทั้งชุดทุกครั้งที่แก้ ใช้ตอนทำ TDD หรือ implement ทีละขั้นเมื่อการรันทั้งชุดช้า แต่ต้องรันทั้งชุดก่อนปิดงานเสมอ

## รวบรวม Context

- ถ้าอยู่ใน git worktree ให้ดูไฟล์ที่เปลี่ยนด้วย `git diff --name-only HEAD`; ถ้าไม่ใช่ git repo ให้ระบุ paths ที่เปลี่ยนเอง
- ตรวจ test runner ของ project: `package.json` ที่มี jest → Jest, `pyproject.toml`/`pytest.ini` → pytest, `go.mod` → `go test`

## Workflow

### 1. ตรวจ runner
ดูจาก manifest ของ project ว่าใช้ runner ตัวไหน skill นี้มี mapping สำหรับ Jest พร้อมใช้ สำหรับ runner อื่นให้ใช้หลัก convention เดียวกัน (ไฟล์ source → test ข้างเคียง) แล้วออกคำสั่งแบบ focused ของ runner นั้น

### 2. รวบรวมไฟล์ที่เปลี่ยน
ถ้า user ระบุ paths มา ($ARGUMENTS) ให้ใช้ตามนั้น ไม่งั้นใช้ `git diff --name-only HEAD` ถ้าไม่ได้อยู่ใน git worktree ต้องให้ระบุ paths เอง

### 3. Map ไปยัง suites (Jest)
ถ้ามี helper `scripts/scoped-tests.cjs` ให้รัน `node scripts/scoped-tests.cjs` ซึ่งจะพิมพ์คำสั่ง `npx jest <suites...>` แบบ focused (หรือ `npm test` เมื่อ map ไม่ได้) ถ้าไม่มี helper ให้ใช้ convention โดยตรง: ไฟล์ source map ไปไฟล์ test ข้างเคียง, ไฟล์ manifest/config map ไป gates ที่อ่านไฟล์นั้น

### 4. รันคำสั่งแบบ focused
รันคำสั่ง `npx jest <suites>` ที่ได้มา

### 5. รายงาน scope ตามจริง
บอกว่ารัน suites ไหนบ้าง และไฟล์ที่เปลี่ยนตัวไหน "ไม่ได้" ถูก scope ถ้า map ได้ว่าง (ไม่มีอะไร map ได้แน่ชัด) ให้บอกชัด ๆ แล้วรันทั้งชุด ห้ามนำเสนอการรันบางส่วนว่าเป็น coverage เต็ม

### 6. รันทั้งชุดก่อนปิดงาน
การรันแบบ scope ใช้สำหรับ inner loop เท่านั้น ก่อนสรุปว่างานเสร็จต้องรัน `npm test` (หรือคำสั่งรันทั้งชุดของ project) เสมอ

## ข้อควรระวัง

- ห้ามรันบางส่วนเงียบ ๆ จนข้าม coverage — ถ้า map ว่างให้รันทั้งชุด
- การรันแบบ scope ไม่ใช่ release gate; `npm run verify:release` ยังรันทั้งหมดอยู่
- ใช้ได้นอก git worktree เฉพาะเมื่อระบุ paths ที่เปลี่ยนเอง
