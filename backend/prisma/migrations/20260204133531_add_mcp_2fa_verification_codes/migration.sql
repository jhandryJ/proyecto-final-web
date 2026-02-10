-- CreateTable
CREATE TABLE `codigos_verificacion_mcp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `codigo` VARCHAR(6) NOT NULL,
    `expiraEn` DATETIME(3) NOT NULL,
    `verificado` BOOLEAN NOT NULL DEFAULT false,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `codigos_verificacion_mcp_usuarioId_idx`(`usuarioId`),
    INDEX `codigos_verificacion_mcp_codigo_idx`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `codigos_verificacion_mcp` ADD CONSTRAINT `codigos_verificacion_mcp_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
