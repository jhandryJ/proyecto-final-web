-- AlterTable
ALTER TABLE `torneo` ADD COLUMN `costoInscripcion` DECIMAL(65, 30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `validacionpago` ADD COLUMN `torneoId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ValidacionPago` ADD CONSTRAINT `ValidacionPago_torneoId_fkey` FOREIGN KEY (`torneoId`) REFERENCES `Torneo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
