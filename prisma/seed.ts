import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await hash('password123', 12)

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: '爱丽丝', password },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', name: '鲍勃', password },
  })

  const family = await prisma.family.create({
    data: {
      name: '张氏家族',
      description: '源自湖南省长沙市的张氏宗族',
      createdById: alice.id,
      admins: { create: { userId: alice.id } },
    },
  })

  const grandfather = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      name: '张德胜',
      gender: 'MALE',
      birthDate: new Date('1920-03-15'),
      deathDate: new Date('1995-11-20'),
      isAlive: false,
      occupation: '农民',
      hometown: '湖南省长沙市',
    },
  })

  const grandmother = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      name: '李秀云',
      gender: 'FEMALE',
      birthDate: new Date('1925-07-08'),
      deathDate: new Date('2001-02-14'),
      isAlive: false,
      occupation: '家庭主妇',
      hometown: '湖南省长沙市',
    },
  })

  const father = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      name: '张建国',
      gender: 'MALE',
      birthDate: new Date('1950-05-01'),
      isAlive: true,
      occupation: '工程师',
      hometown: '湖南省长沙市',
    },
  })

  const mother = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      name: '王美兰',
      gender: 'FEMALE',
      birthDate: new Date('1953-09-12'),
      isAlive: true,
      occupation: '教师',
      hometown: '湖南省株洲市',
    },
  })

  const son = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      name: '张小明',
      gender: 'MALE',
      birthDate: new Date('1978-06-20'),
      isAlive: true,
      occupation: '软件工程师',
      hometown: '湖南省长沙市',
    },
  })

  const daughter = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      name: '张小红',
      gender: 'FEMALE',
      birthDate: new Date('1982-11-30'),
      isAlive: true,
      occupation: '医生',
      hometown: '湖南省长沙市',
    },
  })

  // Relationships
  await prisma.relationship.createMany({
    data: [
      // Grandparents couple
      { familyId: family.id, fromMemberId: grandfather.id, toMemberId: grandmother.id, type: 'SPOUSE' },
      // Grandparents -> Father
      { familyId: family.id, fromMemberId: grandfather.id, toMemberId: father.id, type: 'PARENT_CHILD' },
      // Parents couple
      { familyId: family.id, fromMemberId: father.id, toMemberId: mother.id, type: 'SPOUSE' },
      // Father -> Son
      { familyId: family.id, fromMemberId: father.id, toMemberId: son.id, type: 'PARENT_CHILD' },
      // Father -> Daughter
      { familyId: family.id, fromMemberId: father.id, toMemberId: daughter.id, type: 'PARENT_CHILD' },
    ],
  })

  console.log('✅ 种子数据创建成功')
  console.log(`   用户: alice@example.com / bob@example.com (密码: password123)`)
  console.log(`   家族: ${family.name} (${family.id})`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
