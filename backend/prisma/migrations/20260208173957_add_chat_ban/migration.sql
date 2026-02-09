-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `chatBanReason` VARCHAR(191) NULL,
    ADD COLUMN `chatBannedUntil` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `mensajes_chat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `mensaje` TEXT NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sala` VARCHAR(191) NOT NULL DEFAULT 'general',

    INDEX `mensajes_chat_usuarioId_idx`(`usuarioId`),
    INDEX `mensajes_chat_sala_idx`(`sala`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `mensajes_chat` ADD CONSTRAINT `mensajes_chat_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
