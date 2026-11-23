# Kárdex Virtual · Unidad Educativa Yhuli

Sistema de gestión estudiantil para 6to de Secundaria. Permite a los **docentes** registrar faltas de conducta y pedagógicas, asistencia y observaciones; y a los **padres de familia** consultar el historial de sus estudiantes en modo solo lectura.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + Bootstrap 5 (CDN) + Vanilla JS |
| Backend | Node.js + Express |
| Serverless | Vercel Functions (`serverless-http`) |
| Base de datos | PostgreSQL en **Aiven** (SSL obligatorio) |
| ORM | Prisma (patrón Singleton) |
| Auth | JWT en cookies `httpOnly`, `Secure`, `SameSite=Strict` |
| Hash | bcryptjs |

---

## Estructura del proyecto

```
.
├── api/index.js              # Entry point Vercel Serverless
├── app.js                    # Express app (middleware + rutas)
├── server.js                 # Servidor local de desarrollo
├── prisma/
│   ├── schema.prisma         # Modelos: User, Curso, Estudiante, RegistroKardex
│   └── seed.js               # Docentes (solo por código), cursos y estudiantes
├── lib/
│   ├── prisma.js             # Cliente Prisma Singleton + SSL
│   └── auth.js               # Middleware JWT y autorización DOCENTE
├── routes/
│   ├── auth.js               # /api/auth (login, register, logout, me)
│   ├── cursos.js             # /api/cursos
│   ├── estudiantes.js        # /api/estudiantes
│   └── kardex.js             # /api/kardex
├── public/
│   ├── index.html            # Landing + Login/Registro
│   ├── docente.html          # Dashboard Docente
│   ├── padre.html            # Dashboard Padre de Familia (solo lectura)
│   ├── css/styles.css
│   └── js/{common,auth,docente,padre}.js
├── vercel.json
├── package.json
└── .env.example
```

---

## Reglas de negocio clave

1. **Docentes** se crean **únicamente** mediante `prisma/seed.js`. No existe formulario de registro para docentes en la UI.
2. **Estudiantes** no tienen tutor vinculado ni contraseña. Solo registran datos académicos básicos (nombre, N° de lista, curso).
3. **Padres de familia** sí pueden registrarse e iniciar sesión, pero **no están vinculados a un estudiante** en la BD. Su dashboard es de solo lectura: `Curso → Estudiante → Historial`.
4. **Mutaciones (POST/PUT/DELETE)** están bloqueadas para cualquier usuario que no tenga rol `DOCENTE`.

---

## Configuración local

### 1. Variables de entorno

Copia `.env.example` a `.env` y completa:

```bash
# PostgreSQL en Aiven (incluye sslmode=require)
DATABASE_URL="postgresql://avnadmin:PASSWORD@HOST.aivencloud.com:PUERTO/defaultdb?sslmode=require"

# Certificado CA de Aiven (contenido del .pem, saltos de línea como \n)
AIVEN_CA_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"

# Secreto JWT (largo y aleatorio en producción)
JWT_SECRET="tu-secreto-seguro"

NODE_ENV=development
PORT=3000
```

> **Aiven SSL**: La URL de conexión de Aiven ya incluye `?sslmode=require`. Prisma aplica SSL automáticamente. Si necesitas verificación del certificado CA, pega el contenido de `ca.pem` en `AIVEN_CA_CERT`.

### 2. Instalar dependencias

```bash
npm install
```

### 3. Generar cliente Prisma

```bash
npx prisma generate
```

### 4. Ejecutar migración

```bash
npx prisma migrate dev --name init
```

### 5. Poblar base de datos (docentes + cursos + estudiantes)

```bash
npm run seed
```

**Credenciales de prueba (docentes):**
- `maria.lopez@yhuli.edu` / `docente123` (Lenguaje y Literatura)
- `carlos.rojas@yhuli.edu` / `docente123` (Matemática)

### 6. Iniciar servidor local

```bash
npm run dev
```

Abre `http://localhost:3000`.

---

## Despliegue en Vercel

1. Sube el repositorio a GitHub/GitLab.
2. Importa el proyecto en [vercel.com](https://vercel.com).
3. Configura las **Environment Variables** en Vercel (`DATABASE_URL`, `AIVEN_CA_CERT`, `JWT_SECRET`, `NODE_ENV=production`).
4. El `vercel.json` ya enruta `/api/*` al serverless function y sirve los estáticos desde `/public`.
5. Ejecuta la migración en producción:

```bash
npx prisma migrate deploy
npm run seed
```

6. Despliega.

---

## Endpoints API

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | `/api/auth/login` | Iniciar sesión | Público |
| POST | `/api/auth/register` | Registro (solo padre) | Público |
| POST | `/api/auth/logout` | Cerrar sesión | Auth |
| GET | `/api/auth/me` | Usuario actual | Auth |
| GET | `/api/cursos` | Listar cursos | Auth |
| GET | `/api/cursos/docentes/listar` | Listar docentes | Auth |
| POST | `/api/cursos` | Crear curso | Docente |
| GET | `/api/estudiantes?cursoId=` | Listar estudiantes | Auth |
| POST | `/api/estudiantes` | Crear estudiante | Docente |
| PUT | `/api/estudiantes/:id` | Actualizar estudiante | Docente |
| DELETE | `/api/estudiantes/:id` | Soft-delete estudiante | Docente |
| GET | `/api/kardex?estudianteId=` | Historial de registros | Auth |
| GET | `/api/kardex/resumen?estudianteId=` | Asistencia + conteos | Auth |
| POST | `/api/kardex` | Registrar falta | Docente |
| PUT | `/api/kardex/:id` | Actualizar registro | Docente |
| DELETE | `/api/kardex/:id` | Eliminar registro | Docente |

---

## Catálogo de faltas

**Conducta (12):** No realiza limpieza · Sale del aula sin permiso · No porta uniforme · Causa desorden · Juega con el desayuno · Palabras groseras · Atraso · Molesta en clase · Cabello/corte escolar · No respeta compañeros · Uso de celular · Destroza mobiliario.

**Pedagógica (9):** No presentó tarea · No realizó examen · No realizó exposición · No atiende en clases · No realizó trabajo práctico · Copió la tarea · Trabajos de otras asignaturas · Sin material de trabajo · Sin texto de lectura.

**Asistencia:** `PRESENTE` · `ATRASO` · `FSL` (Falta sin licencia) · `FCL` (Falta con licencia).
