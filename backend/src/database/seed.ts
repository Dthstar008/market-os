import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../modules/auth/auth.service';
import { MarketsService } from '../modules/markets/markets.service';
import { MembershipsService } from '../modules/markets/memberships.service';
import { LeviesService } from '../modules/markets/levies.service';
import { DuesService } from '../modules/markets/dues.service';
import { AnnouncementsService } from '../modules/markets/announcements.service';
import { LevyFrequency, DuesInvoiceStatus } from '../entities';

/**
 * Seeds one demo market association (chairman account + one trader member,
 * a monthly dues levy, a generated invoice for the current period, that
 * invoice paid, and a sample announcement). Run with: npm run seed
 */
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const authService = app.get(AuthService);
  const marketsService = app.get(MarketsService);
  const membershipsService = app.get(MembershipsService);
  const leviesService = app.get(LeviesService);
  const duesService = app.get(DuesService);
  const announcementsService = app.get(AnnouncementsService);

  const chairmanEmail = 'chairman@computervillage-market.ng';
  let chairmanAuth;
  try {
    chairmanAuth = await authService.register({
      traderName: 'Computer Village Market Association Office',
      ownerName: 'Ngozi Adeyemi',
      phone: '08011112222',
      email: chairmanEmail,
      password: 'password123',
    });
  } catch {
    chairmanAuth = await authService.login({ email: chairmanEmail, password: 'password123' });
  }
  const chairmanUserId = chairmanAuth.user.id;

  const traderEmail = 'chidi@computervillage-market.ng';
  let traderAuth;
  try {
    traderAuth = await authService.register({
      traderName: 'Chidi Phone Accessories',
      ownerName: 'Chidi Eze',
      phone: '08012345678',
      email: traderEmail,
      password: 'password123',
    });
  } catch {
    traderAuth = await authService.login({ email: traderEmail, password: 'password123' });
  }
  const traderId = traderAuth.trader.id;

  let market = (await marketsService.findMine(chairmanUserId))[0];
  if (!market) {
    market = await marketsService.create(chairmanUserId, {
      name: 'Computer Village Market Association',
      location: 'Ikeja, Lagos',
      description: 'Electronics and phone accessories traders association',
    });
  }

  try {
    await membershipsService.add(market.id, chairmanUserId, {
      traderId,
      section: 'Electronics Wing',
      stallNumber: 'B-14',
    });
  } catch {
    // already a member from a previous seed run
  }

  let dues = (await leviesService.list(market.id, chairmanUserId))[0];
  if (!dues) {
    dues = await leviesService.create(market.id, chairmanUserId, {
      name: 'Monthly Association Dues',
      amount: 2000,
      frequency: LevyFrequency.MONTHLY,
    });
  }

  const period = new Date().toISOString().slice(0, 7); // "2026-09"
  await duesService.generate(market.id, chairmanUserId, { levyId: dues.id, period });

  const [invoice] = await duesService.listMine(market.id, traderId);
  if (invoice && invoice.status !== DuesInvoiceStatus.PAID) {
    await duesService.pay(market.id, invoice.id, traderId, { note: 'Paid at association office, cash' });
  }

  await announcementsService.create(market.id, chairmanUserId, {
    title: 'Market sanitation exercise',
    body: 'Market sanitation exercise will take place Saturday. All traders are expected to participate.',
  });

  console.log('Seed complete.');
  console.log(`Market admin login: "${chairmanEmail}" / "password123"`);
  console.log(`Trader login: "${traderEmail}" / "password123"`);

  await app.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
