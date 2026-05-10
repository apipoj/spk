---
description: TDD loop แบบเข้มงวด - RED test ก่อน, GREEN implement ขั้นต่ำ, REFACTOR หลัง green พร้อม verification gates
argument-hint: "[feature, behavior, bug, หรือ plan reference]"
---

# spk-tdd

รัน TDD loop แบบเข้มงวด: เขียน test ที่ fail ยืนยันว่า fail ด้วยเหตุผลที่ถูกต้อง implement ขั้นต่ำให้ pass refactor แล้วทำซ้ำ

## รวบรวม Context

- รัน `git status --short` และ `git log -3 --oneline`
- ระบุ test setup (package.json, pyproject.toml, pytest.ini, jest.config, vitest.config)

## TDD Cycle

### RED: เขียน Failing Test
1. เขียน behavior test ขั้นต่ำที่กำหนด expected behavior
2. Test ต้องเจาะจงและโฟกัสที่ behavior เดียว

### Verify RED
3. รัน focused test และยืนยันว่า fail **ด้วยเหตุผลที่คาดไว้**
4. ถ้า test pass ทันที ให้แก้ test ก่อน code (มัน test สิ่งผิด)

### GREEN: Implementation ขั้นต่ำ
5. เขียน implementation ที่เล็กที่สุดที่ทำให้ test pass
6. อย่าเพิ่ม features, optimizations หรือ refactoring

### Verify GREEN
7. รัน focused test ต้อง pass
8. รัน regression suite ที่เกี่ยวข้อง ไม่มีอะไรพัง

### REFACTOR
9. ทำความสะอาด code เฉพาะตอนที่ tests green
10. รัน tests ที่เกี่ยวข้องทั้งหมดหลัง refactor

### Commit
11. Commit TDD cycle ที่ตรวจสอบแล้วด้วย descriptive message
12. ทำซ้ำสำหรับ behavior ถัดไป

## Output Format

```markdown
## TDD Cycle Report
- Behavior: <สิ่งที่ implement>
- Test file: <path>
- RED: <confirmed - test fails ด้วยเหตุผลที่คาดไว้>
- GREEN: <confirmed - test passes>
- REFACTOR: <สิ่งที่ทำความสะอาด>
- Regression suite: <pass/fail>
- Commit: <hash หรือ message>
- Remaining behaviors: <list หรือ "none">
```

## Hard Stops

- ถ้า test แรก pass ทันที ให้แก้ test ก่อน code
- ถ้าไม่มี test harness ที่ใช้ได้ ให้ return `NEEDS_TEST_HARNESS` พร้อม harness ที่เล็กที่สุดที่ควรเพิ่ม
- ถ้าแก้ bug ให้รวม regression test ที่ fail ก่อน fix
- อย่า commit ตอน red ทุก commit ต้องมี tests ที่ผ่าน

## ข้อควรระวัง

- อย่ายอมรับ tests ที่ pass ก่อน implementation
- อย่าข้าม tests
- อย่ารวมหลาย behaviors ในหนึ่ง cycle หนึ่ง behavior ต่อ cycle
- อย่า refactor ตอน red
- Commit เฉพาะ cycles ที่ตรวจสอบแล้ว
