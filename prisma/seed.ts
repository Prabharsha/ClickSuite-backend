/**
 * Optional seed script — NOT required for app startup.
 * Run with: npm run prisma:seed
 *
 * Creates a test user, their workspace (OWNER membership), and a couple of
 * sample bookings. Idempotent: re-running upserts the same test user.
 */
import { BookingStatus, PaymentStatus, PrismaClient, WorkspaceRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEST_EMAIL = 'demo@clicksuite.app';
const TEST_PASSWORD = 'Password123!';

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    update: {},
    create: {
      fullName: 'Demo Owner',
      email: TEST_EMAIL,
      passwordHash,
    },
  });

  // Reuse the user's first workspace if seeding has run before.
  let membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, role: WorkspaceRole.OWNER },
    include: { workspace: true },
  });

  if (!membership) {
    const workspace = await prisma.workspace.create({
      data: {
        name: 'Demo Studio',
        businessType: 'Photography Studio',
        phone: '+94771234567',
        email: 'studio@clicksuite.app',
        location: 'Colombo',
        mainServiceCategory: 'Wedding Photography',
      },
    });
    membership = await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: WorkspaceRole.OWNER,
      },
      include: { workspace: true },
    });
  }

  const workspaceId = membership.workspaceId;

  const existingCount = await prisma.booking.count({ where: { workspaceId } });
  if (existingCount === 0) {
    await prisma.booking.createMany({
      data: [
        {
          workspaceId,
          bookingTitle: 'Wedding Shoot - Kasun & Nethmi',
          clientName: 'Kasun Perera',
          clientPhone: '+94771234567',
          clientEmail: 'kasun@example.com',
          eventType: 'Wedding',
          eventDate: new Date('2026-08-15'),
          startTime: '09:00',
          endTime: '18:00',
          location: 'Colombo',
          packageName: 'Full Wedding Coverage',
          totalAmount: 250000,
          advanceAmount: 50000,
          balanceAmount: 200000,
          bookingStatus: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PARTIALLY_PAID,
          createdByUserId: user.id,
          notes: 'Outdoor wedding event',
        },
        {
          workspaceId,
          bookingTitle: 'Corporate Headshots - Acme',
          clientName: 'Acme Ltd',
          clientEmail: 'hr@acme.example.com',
          eventType: 'Corporate',
          eventDate: new Date('2026-07-02'),
          location: 'Kandy',
          totalAmount: 80000,
          advanceAmount: 0,
          balanceAmount: 80000,
          bookingStatus: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.UNPAID,
          createdByUserId: user.id,
        },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seed complete. Login with ${TEST_EMAIL} / ${TEST_PASSWORD}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
