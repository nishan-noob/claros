import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function hash(pwd: string) {
  return bcrypt.hashSync(pwd, 12);
}

/** Last N school days (Mon-Fri) ending today */
function lastSchoolDays(n: number): Date[] {
  const days: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (days.length < n) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(d));
    d.setDate(d.getDate() - 1);
  }
  return days.reverse();
}

function randomScore(mean: number, std: number, max: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, Math.min(max, Math.round(mean + z * std)));
}

async function getOrCreateClass(name: string, year: string, homeroomTeacherId?: number) {
  const existing = await prisma.class.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.class.create({ data: { name, year, homeroomTeacherId } });
}

async function main() {
  console.log('🌱  Seeding…');

  const school = await prisma.school.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'ABC Primary School', academicYear: '2025-2026' },
  });
  console.log(`  School: ${school.name}`);

  const headmaster = await prisma.user.upsert({
    where: { email: 'headmaster@abc.school' },
    update: {},
    create: { email: 'headmaster@abc.school', name: 'Dr. Williams', passwordHash: hash('password'), role: 'HEADMASTER', active: true },
  });

  const teacherSmith = await prisma.user.upsert({ where: { email: 'mrsmith@abc.school' }, update: {}, create: { email: 'mrsmith@abc.school', name: 'Mr. Smith', passwordHash: hash('password'), role: 'TEACHER', active: true } });
  const teacherJones = await prisma.user.upsert({ where: { email: 'msjones@abc.school' }, update: {}, create: { email: 'msjones@abc.school', name: 'Ms. Jones', passwordHash: hash('password'), role: 'TEACHER', active: true } });
  const teacherBrown = await prisma.user.upsert({ where: { email: 'msbrown@abc.school' }, update: {}, create: { email: 'msbrown@abc.school', name: 'Ms. Brown', passwordHash: hash('password'), role: 'TEACHER', active: true } });
  const teacherTaylor = await prisma.user.upsert({ where: { email: 'mstaylor@abc.school' }, update: {}, create: { email: 'mstaylor@abc.school', name: 'Ms. Taylor', passwordHash: hash('password'), role: 'TEACHER', active: true } });

  const parent1 = await prisma.user.upsert({ where: { email: 'parent1@abc.school' }, update: {}, create: { email: 'parent1@abc.school', name: 'Parent One', passwordHash: hash('password'), role: 'PARENT', active: true } });
  const parent2 = await prisma.user.upsert({ where: { email: 'parent2@abc.school' }, update: {}, create: { email: 'parent2@abc.school', name: 'Parent Two', passwordHash: hash('password'), role: 'PARENT', active: true } });
  const parent3 = await prisma.user.upsert({ where: { email: 'parent3@abc.school' }, update: {}, create: { email: 'parent3@abc.school', name: 'Parent Three', passwordHash: hash('password'), role: 'PARENT', active: true } });

  console.log('  Users created');

  const currentYear = String(new Date().getFullYear());
  const classMap: Record<string, { id: number }> = {};
  const classConfigs = [
    { name: 'Grade 1A', teacher: teacherTaylor },
    { name: 'Grade 2A', teacher: teacherTaylor },
    { name: 'Grade 3A', teacher: teacherTaylor },
    { name: 'Grade 4A', teacher: teacherBrown },
    { name: 'Grade 5A', teacher: teacherSmith },
    { name: 'Grade 5B', teacher: teacherJones },
  ];
  for (const { name, teacher } of classConfigs) {
    classMap[name] = await getOrCreateClass(name, currentYear, teacher.id);
  }
  console.log('  Classes created');

  const subjectMap: Record<string, number> = {};
  async function upsertSubject(name: string, classId: number, teacherId: number) {
    const sub = await prisma.subject.upsert({
      where: { classId_name: { classId, name } },
      update: { teacherId },
      create: { name, classId, teacherId },
    });
    subjectMap[`${classId}-${name}`] = sub.id;
    return sub;
  }

  const baseSubjects = ['English', 'Mathematics', 'Science', 'Social Studies'];
  for (const cn of ['Grade 5A', 'Grade 5B']) {
    const cId = classMap[cn].id;
    await upsertSubject('English', cId, teacherSmith.id);
    await upsertSubject('Mathematics', cId, teacherJones.id);
    await upsertSubject('Science', cId, teacherBrown.id);
    await upsertSubject('Social Studies', cId, teacherBrown.id);
    await upsertSubject('Computer Studies', cId, teacherSmith.id);
  }
  for (const name of baseSubjects) await upsertSubject(name, classMap['Grade 4A'].id, teacherBrown.id);
  for (const cn of ['Grade 1A', 'Grade 2A', 'Grade 3A']) {
    for (const name of baseSubjects) await upsertSubject(name, classMap[cn].id, teacherTaylor.id);
  }
  console.log('  Subjects created');

  const firstNames = ['Aiden','Maya','Liam','Emma','Noah','Olivia','James','Ava','Lucas','Isabella','Ethan','Mia','Mason','Amelia','Logan','Harper','Oliver','Evelyn','Elijah','Sofia'];
  const lastNames = ['Cooper','Patel','Chen','Johnson','Williams','Davis','Brown','Jones','Garcia','Miller','Wilson','Moore','Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Thompson'];

  const studentIds: Record<string, number[]> = {};
  const yearCode = new Date().getFullYear();
  let seqCounter = 0;
  function makeCode() { seqCounter++; return `${yearCode}-${String(seqCounter).padStart(3, '0')}`; }

  for (const cn of Object.keys(classMap)) {
    const cId = classMap[cn].id;
    studentIds[cn] = [];
    for (let i = 0; i < 20; i++) {
      const name = `${firstNames[i]} ${lastNames[i]}`;
      const code = makeCode();
      let parentId: number | null = null;
      if (cn === 'Grade 5A' && i === 0) parentId = parent1.id;
      if (cn === 'Grade 5A' && i === 1) parentId = parent2.id;
      if (cn === 'Grade 4A' && i === 2) parentId = parent3.id;

      const existing = await prisma.student.findFirst({ where: { name, classId: cId } });
      if (existing) {
        if (parentId !== null) await prisma.student.update({ where: { id: existing.id }, data: { parentId } });
        studentIds[cn].push(existing.id);
      } else {
        const s = await prisma.student.create({ data: { name, studentCode: code, classId: cId, parentId, active: true } });
        studentIds[cn].push(s.id);
      }
    }
  }
  console.log('  Students created');

  console.log('  Seeding attendance…');
  const schoolDays = lastSchoolDays(15);
  for (const cn of Object.keys(classMap)) {
    const cId = classMap[cn].id;
    const subjects = await prisma.subject.findMany({ where: { classId: cId }, select: { id: true, teacherId: true } });
    for (const day of schoolDays) {
      for (const subject of subjects) {
        const sess = await prisma.attendanceSession.upsert({
          where: { classId_date_subjectId_period: { classId: cId, date: day, subjectId: subject.id, period: '1' } },
          update: {},
          create: { classId: cId, date: day, subjectId: subject.id, period: '1', createdById: subject.teacherId },
        });
        for (let i = 0; i < 20; i++) {
          const sid = studentIds[cn][i];
          const threshold = (i === 3 || i === 7) ? 0.7 : 0.88;
          const rand = Math.random();
          let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
          if (rand < threshold) status = 'PRESENT';
          else if (rand < threshold + 0.06) status = 'LATE';
          else if (rand < threshold + 0.10) status = 'EXCUSED';
          else status = 'ABSENT';
          await prisma.attendanceRecord.upsert({
            where: { sessionId_studentId: { sessionId: sess.id, studentId: sid } },
            update: {},
            create: { sessionId: sess.id, studentId: sid, status },
          });
        }
      }
    }
  }
  console.log('  Attendance seeded');

  console.log('  Seeding grades…');
  const assessmentDefs = [
    { type: 'ASSIGNMENT' as const, title: 'Assignment 1', offset: 30 },
    { type: 'QUIZ' as const, title: 'Quiz 1', offset: 20 },
    { type: 'EXAM' as const, title: 'Mid-Term Exam', offset: 10 },
  ];
  for (const cn of ['Grade 5A', 'Grade 4A']) {
    const cId = classMap[cn].id;
    const subjects = await prisma.subject.findMany({ where: { classId: cId } });
    for (const subject of subjects) {
      for (const def of assessmentDefs) {
        const aDate = new Date();
        aDate.setDate(aDate.getDate() - def.offset);
        aDate.setHours(0, 0, 0, 0);
        const assessment = await prisma.assessment.upsert({
          where: { subjectId_title: { subjectId: subject.id, title: def.title } },
          update: {},
          create: { title: def.title, type: def.type, date: aDate, maxScore: 100, subjectId: subject.id, createdById: subject.teacherId },
        });
        for (let i = 0; i < 20; i++) {
          const sid = studentIds[cn][i];
          const isRecent = def.offset === 10;
          const hasScore = !isRecent || Math.random() > 0.3;
          const score = hasScore ? randomScore(70, 15, 100) : null;
          await prisma.studentGrade.upsert({
            where: { assessmentId_studentId: { assessmentId: assessment.id, studentId: sid } },
            update: {},
            create: { assessmentId: assessment.id, studentId: sid, score, gradedById: subject.teacherId },
          });
        }
      }
    }
  }
  console.log('  Grades seeded');

  console.log('\n✅  Seed complete!');
  console.log('\n📋  Login credentials (all passwords: "password"):');
  console.log('   Headmaster: headmaster@abc.school');
  console.log('   Teachers:   mrsmith@abc.school / msjones@abc.school / msbrown@abc.school / mstaylor@abc.school');
  console.log('   Parents:    parent1@abc.school / parent2@abc.school / parent3@abc.school');
  console.log('\n   parent1 → Aiden Cooper (Grade 5A)');
  console.log('   parent2 → Maya Patel (Grade 5A)');
  console.log('   parent3 → Liam Chen (Grade 4A)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
