// ============================================================
// Seed - Crea docentes (solo por código), cursos y estudiantes
// ============================================================
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ----------------------------------------------------------
  // 1. DOCENTES (creados exclusivamente por código/seed)
  // ----------------------------------------------------------
  const hashed1 = await bcrypt.hash('docente123', 10);
  const hashed2 = await bcrypt.hash('docente123', 10);

  const docente1 = await prisma.user.upsert({
    where: { correo: 'maria.lopez@yhuli.edu' },
    update: {},
    create: {
      nombre: 'Prof. María Fernanda López',
      correo: 'maria.lopez@yhuli.edu',
      password: hashed1,
      rol: 'DOCENTE',
      materia: 'Lenguaje y Literatura',
    },
  });

  const docente2 = await prisma.user.upsert({
    where: { correo: 'carlos.rojas@yhuli.edu' },
    update: {},
    create: {
      nombre: 'Prof. Carlos Rojas',
      correo: 'carlos.rojas@yhuli.edu',
      password: hashed2,
      rol: 'DOCENTE',
      materia: 'Matemática',
    },
  });

  console.log('✅ Docentes creados:', docente1.nombre, '|', docente2.nombre);

  // ----------------------------------------------------------
  // 2. CURSOS de Sexto de Secundaria
  // ----------------------------------------------------------
  const cursoA = await prisma.curso.upsert({
    where: { nivel_paralelo: { nivel: 'Sexto de Secundaria', paralelo: 'A' } },
    update: {},
    create: {
      nivel: 'Sexto de Secundaria',
      paralelo: 'A',
      nombre: '6to de Secundaria "A"',
      docenteId: docente1.id,
    },
  });

  const cursoB = await prisma.curso.upsert({
    where: { nivel_paralelo: { nivel: 'Sexto de Secundaria', paralelo: 'B' } },
    update: {},
    create: {
      nivel: 'Sexto de Secundaria',
      paralelo: 'B',
      nombre: '6to de Secundaria "B"',
      docenteId: docente2.id,
    },
  });

  console.log('✅ Cursos creados:', cursoA.nombre, '|', cursoB.nombre);

  // ----------------------------------------------------------
  // 3. ESTUDIANTES (sin tutor ni contraseña)
  // ----------------------------------------------------------
  const estudiantesA = [
    'Ana Sofía Vargas',
    'Bruno Salazar',
    'Camila Fernández',
    'Daniela Rojas',
    'Elías Mendoza',
    'Fabiana Castillo',
    'Gabriel Núñez',
    'Helena Quispe',
    'Iván Miranda',
    'Jimena Flores',
    'Kevin Torres',
    'Lucía Paredes',
  ];

  const estudiantesB = [
    'Martín Saavedra',
    'Natalia Ríos',
    'Óscar Delgado',
    'Paola Mamani',
  ];

  for (let i = 0; i < estudiantesA.length; i++) {
    await prisma.estudiante.upsert({
      where: { cursoId_numeroLista: { cursoId: cursoA.id, numeroLista: i + 1 } },
      update: {},
      create: {
        numeroLista: i + 1,
        nombre: estudiantesA[i],
        cursoId: cursoA.id,
      },
    });
  }

  for (let i = 0; i < estudiantesB.length; i++) {
    await prisma.estudiante.upsert({
      where: { cursoId_numeroLista: { cursoId: cursoB.id, numeroLista: i + 1 } },
      update: {},
      create: {
        numeroLista: i + 1,
        nombre: estudiantesB[i],
        cursoId: cursoB.id,
      },
    });
  }

  console.log(`✅ Estudiantes creados: ${estudiantesA.length} en 6°A, ${estudiantesB.length} en 6°B`);

  console.log('\n🎉 Seed completado.');
  console.log('   Docente prueba: maria.lopez@yhuli.edu / docente123');
  console.log('   Docente prueba: carlos.rojas@yhuli.edu / docente123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
