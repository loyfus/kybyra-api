import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { downloadFile, pickExtension } from './download';
import { resolveImageForCar } from './wikidata';

const prisma = new PrismaClient();

const carInputSchema = z.object({
  slug: z.string().min(3),
  brand: z.string().min(1),
  model: z.string().min(1),
  variant: z.string().nullable().optional(),
  year: z.number().int(),

  bodyStyle: z.string().nullable().optional(),
  segment: z.string().nullable().optional(),
  drivetrain: z.string().nullable().optional(),
  isHybrid: z.boolean().default(false),
  isPhev: z.boolean().default(false),

  motorPowerKw: z.number().nullable().optional(),
  motorTorqueNm: z.number().nullable().optional(),
  topSpeedKmh: z.number().nullable().optional(),
  zeroToHundredS: z.number().nullable().optional(),

  batteryKwh: z.number().nullable().optional(),
  usableBatteryKwh: z.number().nullable().optional(),
  rangeKmWltp: z.number().nullable().optional(),
  rangeKmEpa: z.number().nullable().optional(),
  efficiencyWhKm: z.number().nullable().optional(),

  acChargerKw: z.number().nullable().optional(),
  dcChargerKw: z.number().nullable().optional(),
  chargingPortType: z.string().nullable().optional(),

  lengthMm: z.number().nullable().optional(),
  widthMm: z.number().nullable().optional(),
  heightMm: z.number().nullable().optional(),
  weightKg: z.number().nullable().optional(),
  cargoLiters: z.number().nullable().optional(),
  seatingCapacity: z.number().nullable().optional(),

  msrpUsd: z.number().nullable().optional(),
  priceBrl: z.number().nullable().optional(),

  wikidataId: z.string().regex(/^Q\d+$/).optional(),
  description: z.string().nullable().optional(),
});

type CarInput = z.infer<typeof carInputSchema>;

const ROOT = resolve(__dirname, '../..');
const CATALOG_PATH = join(ROOT, 'data', 'cars-catalog.json');
const UPLOADS_DIR = join(ROOT, 'uploads', 'cars');

async function loadCatalog(): Promise<CarInput[]> {
  const raw = await readFile(CATALOG_PATH, 'utf-8');
  const parsed = JSON.parse(raw);
  return z.array(carInputSchema).parse(parsed);
}

type ImageData = { imageUrl: string; sourceUrl: string; attribution: string } | null;

async function fetchAndCacheImage(car: CarInput): Promise<ImageData> {
  try {
    const resolved = await resolveImageForCar({
      wikidataId: car.wikidataId,
      brand: car.brand,
      model: car.model,
      variant: car.variant ?? null,
    });
    if (!resolved) return null;

    const ext = pickExtension(resolved.imageUrl);
    const filename = `${car.slug}${ext}`;
    const targetPath = join(UPLOADS_DIR, filename);
    await downloadFile(resolved.imageUrl, targetPath);

    return {
      imageUrl: `/uploads/cars/${filename}`,
      sourceUrl: resolved.sourceUrl,
      attribution: resolved.attribution,
    };
  } catch (err) {
    console.warn(`  · image fetch failed for ${car.slug}:`, (err as Error).message);
    return null;
  }
}

async function upsertCar(car: CarInput, image: ImageData): Promise<'created' | 'updated'> {
  const data = {
    slug: car.slug,
    brand: car.brand,
    model: car.model,
    variant: car.variant ?? null,
    year: car.year,
    bodyStyle: car.bodyStyle ?? null,
    segment: car.segment ?? null,
    drivetrain: car.drivetrain ?? null,
    isHybrid: car.isHybrid,
    isPhev: car.isPhev,
    motorPowerKw: car.motorPowerKw ?? null,
    motorTorqueNm: car.motorTorqueNm ?? null,
    topSpeedKmh: car.topSpeedKmh ?? null,
    zeroToHundredS: car.zeroToHundredS ?? null,
    batteryKwh: car.batteryKwh ?? null,
    usableBatteryKwh: car.usableBatteryKwh ?? null,
    rangeKmWltp: car.rangeKmWltp ?? null,
    rangeKmEpa: car.rangeKmEpa ?? null,
    efficiencyWhKm: car.efficiencyWhKm ?? null,
    acChargerKw: car.acChargerKw ?? null,
    dcChargerKw: car.dcChargerKw ?? null,
    chargingPortType: car.chargingPortType ?? null,
    lengthMm: car.lengthMm ?? null,
    widthMm: car.widthMm ?? null,
    heightMm: car.heightMm ?? null,
    weightKg: car.weightKg ?? null,
    cargoLiters: car.cargoLiters ?? null,
    seatingCapacity: car.seatingCapacity ?? null,
    msrpUsd: car.msrpUsd ?? null,
    priceBrl: car.priceBrl ?? null,
    wikidataId: car.wikidataId ?? null,
    description: car.description ?? null,
    imageUrl: image?.imageUrl ?? null,
    imageSourceUrl: image?.sourceUrl ?? null,
    imageAttribution: image?.attribution ?? null,
  };

  const existing = await prisma.car.findUnique({ where: { slug: car.slug } });
  if (existing) {
    await prisma.car.update({ where: { slug: car.slug }, data });
    return 'updated';
  }
  await prisma.car.create({ data });
  return 'created';
}

async function main(): Promise<void> {
  console.log(`Loading catalog from ${CATALOG_PATH}…`);
  const cars = await loadCatalog();
  console.log(`Found ${cars.length} cars.\n`);

  let created = 0;
  let updated = 0;
  let withImage = 0;
  let withoutImage = 0;

  for (const [i, car] of cars.entries()) {
    const tag = `[${i + 1}/${cars.length}] ${car.brand} ${car.model} ${car.variant ?? ''}`.trim();
    process.stdout.write(`${tag} … `);
    const image = await fetchAndCacheImage(car);
    if (image) withImage++;
    else withoutImage++;
    const result = await upsertCar(car, image);
    if (result === 'created') created++;
    else updated++;
    process.stdout.write(`${result}${image ? ' (img)' : ' (no img)'}\n`);
  }

  console.log(
    `\nDone. created=${created} updated=${updated} withImage=${withImage} withoutImage=${withoutImage}`,
  );
}

main()
  .catch((err) => {
    console.error('Import failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
