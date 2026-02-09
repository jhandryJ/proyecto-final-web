-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `genero` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `notificaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `mensaje` VARCHAR(191) NOT NULL,
    `leida` BOOLEAN NOT NULL DEFAULT false,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tipo` VARCHAR(191) NULL,
    `link` VARCHAR(191) NULL,

    INDEX `notificaciones_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notificaciones` ADD CONSTRAINT `notificaciones_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `equipotorneo` RENAME INDEX `equipotorneo_torneoId_fkey` TO `EquipoTorneo_torneoId_fkey`;

-- RenameIndex
ALTER TABLE `grupo` RENAME INDEX `grupo_equipoTorneoId_fkey` TO `Grupo_equipoTorneoId_fkey`;

-- RenameIndex
ALTER TABLE `miembroequipo` RENAME INDEX `miembroequipo_usuarioId_fkey` TO `MiembroEquipo_usuarioId_fkey`;

-- RenameIndex
ALTER TABLE `partido` RENAME INDEX `partido_arbitroId_fkey` TO `Partido_arbitroId_fkey`;

-- RenameIndex
ALTER TABLE `partido` RENAME INDEX `partido_canchaId_fkey` TO `Partido_canchaId_fkey`;

-- RenameIndex
ALTER TABLE `partido` RENAME INDEX `partido_equipoLocalId_fkey` TO `Partido_equipoLocalId_fkey`;

-- RenameIndex
ALTER TABLE `partido` RENAME INDEX `partido_equipoVisitanteId_fkey` TO `Partido_equipoVisitanteId_fkey`;

-- RenameIndex
ALTER TABLE `partido` RENAME INDEX `partido_torneoId_fkey` TO `Partido_torneoId_fkey`;

-- RenameIndex
ALTER TABLE `torneo` RENAME INDEX `torneo_campeonatoId_fkey` TO `Torneo_campeonatoId_fkey`;

-- RenameIndex
ALTER TABLE `validacionpago` RENAME INDEX `validacionpago_equipoId_fkey` TO `ValidacionPago_equipoId_fkey`;

-- RenameIndex
ALTER TABLE `validacionpago` RENAME INDEX `validacionpago_torneoId_fkey` TO `ValidacionPago_torneoId_fkey`;

-- RenameIndex
ALTER TABLE `validacionpago` RENAME INDEX `validacionpago_usuarioPagoId_fkey` TO `ValidacionPago_usuarioPagoId_fkey`;

-- RenameIndex
ALTER TABLE `validacionpago` RENAME INDEX `validacionpago_validadoPorId_fkey` TO `ValidacionPago_validadoPorId_fkey`;
