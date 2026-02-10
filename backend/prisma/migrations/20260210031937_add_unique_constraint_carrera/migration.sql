/*
  Warnings:

  - A unique constraint covering the columns `[nombre,facultadId]` on the table `carrera` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `carrera_nombre_facultadId_key` ON `carrera`(`nombre`, `facultadId`);
