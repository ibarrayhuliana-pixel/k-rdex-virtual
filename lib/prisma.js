// ============================================================
// Prisma Client - Patrón Singleton con SSL para Aiven
// ============================================================
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Configuración SSL a partir del certificado CA en variable de entorno
function getSslConfig() {
  const caCert = process.env.AIVEN_CA_CERT;
  if (!caCert) {
    // Fallback: si no hay CA en env, usamos sslmode=require de la URL
    return true;
  }
  return {
    rejectUnauthorized: true,
    ca: caCert.replace(/\\n/g, '\n'),
  };
}

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Aplicar configuración SSL al datasource
if (process.env.DATABASE_URL) {
  const sslConfig = getSslConfig();
  // Prisma aplica SSL automáticamente si sslmode=require está en la URL.
  // Para Aiven, la URL incluye ?sslmode=require y funciona directamente.
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma };
