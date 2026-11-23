-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('DOCENTE', 'PADRE_FAMILIA');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "materia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" SERIAL NOT NULL,
    "nivel" TEXT NOT NULL,
    "paralelo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "docenteId" INTEGER,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estudiantes" (
    "id" SERIAL NOT NULL,
    "numeroLista" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "cursoId" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estudiantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_kardex" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" TEXT NOT NULL,
    "falta" TEXT NOT NULL,
    "asistencia" TEXT NOT NULL,
    "observaciones" TEXT,
    "estudianteId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "docenteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_kardex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_correo_key" ON "users"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "cursos_nivel_paralelo_key" ON "cursos"("nivel", "paralelo");

-- CreateIndex
CREATE UNIQUE INDEX "estudiantes_cursoId_numeroLista_key" ON "estudiantes"("cursoId", "numeroLista");

-- CreateIndex
CREATE INDEX "registros_kardex_estudianteId_fecha_idx" ON "registros_kardex"("estudianteId", "fecha");

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estudiantes" ADD CONSTRAINT "estudiantes_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_kardex" ADD CONSTRAINT "registros_kardex_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "estudiantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_kardex" ADD CONSTRAINT "registros_kardex_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_kardex" ADD CONSTRAINT "registros_kardex_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
