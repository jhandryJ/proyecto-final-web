/*
  Warnings:

  - You are about to drop the column `carrera` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `facultad` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the `escuela` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `codigos_verificacion_mcp` DROP FOREIGN KEY `codigos_verificacion_mcp_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `equipo` DROP FOREIGN KEY `Equipo_capitanId_fkey`;

-- DropForeignKey
ALTER TABLE `equipotorneo` DROP FOREIGN KEY `EquipoTorneo_equipoId_fkey`;

-- DropForeignKey
ALTER TABLE `equipotorneo` DROP FOREIGN KEY `EquipoTorneo_torneoId_fkey`;

-- DropForeignKey
ALTER TABLE `escuela` DROP FOREIGN KEY `Escuela_facultadId_fkey`;

-- DropForeignKey
ALTER TABLE `feedback` DROP FOREIGN KEY `Feedback_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `grupo` DROP FOREIGN KEY `Grupo_equipoTorneoId_fkey`;

-- DropForeignKey
ALTER TABLE `miembroequipo` DROP FOREIGN KEY `MiembroEquipo_equipoId_fkey`;

-- DropForeignKey
ALTER TABLE `miembroequipo` DROP FOREIGN KEY `MiembroEquipo_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `partido` DROP FOREIGN KEY `Partido_arbitroId_fkey`;

-- DropForeignKey
ALTER TABLE `partido` DROP FOREIGN KEY `Partido_canchaId_fkey`;

-- DropForeignKey
ALTER TABLE `partido` DROP FOREIGN KEY `Partido_equipoLocalId_fkey`;

-- DropForeignKey
ALTER TABLE `partido` DROP FOREIGN KEY `Partido_equipoVisitanteId_fkey`;

-- DropForeignKey
ALTER TABLE `partido` DROP FOREIGN KEY `Partido_torneoId_fkey`;

-- DropForeignKey
ALTER TABLE `sorteo` DROP FOREIGN KEY `Sorteo_arbitroId_fkey`;

-- DropForeignKey
ALTER TABLE `sorteo` DROP FOREIGN KEY `Sorteo_canchaId_fkey`;

-- DropForeignKey
ALTER TABLE `sorteo` DROP FOREIGN KEY `Sorteo_localId_fkey`;

-- DropForeignKey
ALTER TABLE `sorteo` DROP FOREIGN KEY `Sorteo_visitanteId_fkey`;

-- DropForeignKey
ALTER TABLE `streaming` DROP FOREIGN KEY `Streaming_partidoId_fkey`;

-- DropForeignKey
ALTER TABLE `torneo` DROP FOREIGN KEY `Torneo_campeonatoId_fkey`;

-- DropForeignKey
ALTER TABLE `validacionpago` DROP FOREIGN KEY `ValidacionPago_equipoId_fkey`;

-- DropForeignKey
ALTER TABLE `validacionpago` DROP FOREIGN KEY `ValidacionPago_torneoId_fkey`;

-- DropForeignKey
ALTER TABLE `validacionpago` DROP FOREIGN KEY `ValidacionPago_usuarioPagoId_fkey`;

-- DropForeignKey
ALTER TABLE `validacionpago` DROP FOREIGN KEY `ValidacionPago_validadoPorId_fkey`;

-- AlterTable
ALTER TABLE `usuario` DROP COLUMN `carrera`,
    DROP COLUMN `facultad`,
    ADD COLUMN `carreraId` INTEGER NULL;

-- DropTable
DROP TABLE `escuela`;

-- CreateTable
CREATE TABLE `carrera` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `facultadId` INTEGER NOT NULL,

    INDEX `Carrera_facultadId_fkey`(`facultadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Usuario_carreraId_fkey` ON `usuario`(`carreraId`);

-- AddForeignKey
ALTER TABLE `equipo` ADD CONSTRAINT `equipo_capitanId_fkey` FOREIGN KEY (`capitanId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipotorneo` ADD CONSTRAINT `equipotorneo_equipoId_fkey` FOREIGN KEY (`equipoId`) REFERENCES `equipo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipotorneo` ADD CONSTRAINT `equipotorneo_torneoId_fkey` FOREIGN KEY (`torneoId`) REFERENCES `torneo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carrera` ADD CONSTRAINT `carrera_facultadId_fkey` FOREIGN KEY (`facultadId`) REFERENCES `facultad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grupo` ADD CONSTRAINT `grupo_equipoTorneoId_fkey` FOREIGN KEY (`equipoTorneoId`) REFERENCES `equipotorneo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `miembroequipo` ADD CONSTRAINT `miembroequipo_equipoId_fkey` FOREIGN KEY (`equipoId`) REFERENCES `equipo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `miembroequipo` ADD CONSTRAINT `miembroequipo_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido` ADD CONSTRAINT `partido_torneoId_fkey` FOREIGN KEY (`torneoId`) REFERENCES `torneo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido` ADD CONSTRAINT `partido_canchaId_fkey` FOREIGN KEY (`canchaId`) REFERENCES `cancha`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido` ADD CONSTRAINT `partido_arbitroId_fkey` FOREIGN KEY (`arbitroId`) REFERENCES `arbitro`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido` ADD CONSTRAINT `partido_equipoLocalId_fkey` FOREIGN KEY (`equipoLocalId`) REFERENCES `equipo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partido` ADD CONSTRAINT `partido_equipoVisitanteId_fkey` FOREIGN KEY (`equipoVisitanteId`) REFERENCES `equipo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `streaming` ADD CONSTRAINT `streaming_partidoId_fkey` FOREIGN KEY (`partidoId`) REFERENCES `partido`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `torneo` ADD CONSTRAINT `torneo_campeonatoId_fkey` FOREIGN KEY (`campeonatoId`) REFERENCES `campeonato`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `usuario_carreraId_fkey` FOREIGN KEY (`carreraId`) REFERENCES `carrera`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `validacionpago` ADD CONSTRAINT `validacionpago_equipoId_fkey` FOREIGN KEY (`equipoId`) REFERENCES `equipo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `validacionpago` ADD CONSTRAINT `validacionpago_usuarioPagoId_fkey` FOREIGN KEY (`usuarioPagoId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `validacionpago` ADD CONSTRAINT `validacionpago_validadoPorId_fkey` FOREIGN KEY (`validadoPorId`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `validacionpago` ADD CONSTRAINT `validacionpago_torneoId_fkey` FOREIGN KEY (`torneoId`) REFERENCES `torneo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
