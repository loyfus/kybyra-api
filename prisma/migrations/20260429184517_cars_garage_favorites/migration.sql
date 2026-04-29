-- CreateTable
CREATE TABLE "cars" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT,
    "year" INTEGER NOT NULL,
    "bodyStyle" TEXT,
    "segment" TEXT,
    "drivetrain" TEXT,
    "isHybrid" BOOLEAN NOT NULL DEFAULT false,
    "isPhev" BOOLEAN NOT NULL DEFAULT false,
    "motorPowerKw" INTEGER,
    "motorTorqueNm" INTEGER,
    "topSpeedKmh" INTEGER,
    "zeroToHundredS" DOUBLE PRECISION,
    "batteryKwh" DOUBLE PRECISION,
    "usableBatteryKwh" DOUBLE PRECISION,
    "rangeKmWltp" INTEGER,
    "rangeKmEpa" INTEGER,
    "efficiencyWhKm" INTEGER,
    "acChargerKw" DOUBLE PRECISION,
    "dcChargerKw" DOUBLE PRECISION,
    "chargingPortType" TEXT,
    "lengthMm" INTEGER,
    "widthMm" INTEGER,
    "heightMm" INTEGER,
    "weightKg" INTEGER,
    "cargoLiters" INTEGER,
    "seatingCapacity" INTEGER,
    "msrpUsd" INTEGER,
    "priceBrl" INTEGER,
    "imageUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_cars" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "nickname" TEXT,
    "purchasedAt" TIMESTAMP(3),
    "odometerKm" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cars_slug_key" ON "cars"("slug");

-- CreateIndex
CREATE INDEX "cars_brand_idx" ON "cars"("brand");

-- CreateIndex
CREATE INDEX "cars_year_idx" ON "cars"("year");

-- CreateIndex
CREATE INDEX "cars_rangeKmWltp_idx" ON "cars"("rangeKmWltp");

-- CreateIndex
CREATE INDEX "cars_isHybrid_isPhev_idx" ON "cars"("isHybrid", "isPhev");

-- CreateIndex
CREATE INDEX "user_cars_userId_idx" ON "user_cars"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_cars_userId_carId_key" ON "user_cars"("userId", "carId");

-- CreateIndex
CREATE INDEX "favorites_userId_idx" ON "favorites"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_carId_key" ON "favorites"("userId", "carId");

-- AddForeignKey
ALTER TABLE "user_cars" ADD CONSTRAINT "user_cars_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cars" ADD CONSTRAINT "user_cars_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
