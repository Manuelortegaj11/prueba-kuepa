# Prueba técnica Full Stack - ket | KuepaEduTech

Formulario de registro de leads (prospectos) sobre el CRM base de Kuepa.

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js 18 + Express + TypeScript
- **Base de datos:** MongoDB 7.0

## Requisitos

- Node.js 18
- MongoDB 7.0, de una de estas dos formas:
  - Docker (recomendado), con el `docker-compose.yml` del repo.
  - Una instalación local de MongoDB escuchando en `localhost:27017`.

### Por qué MongoDB 7.0

La prueba no define una versión de MongoDB, así que se eligió según las dependencias del backend:

- El backend usa **Mongoose 7.8.6** como ODM.
- Mongoose se conecta a la base a través del driver oficial **`mongodb` 5.9.2**.
- Según la [tabla de compatibilidad de Mongoose](https://mongoosejs.com/docs/compatibility.html), MongoDB 7.x es compatible desde Mongoose 7.4, mientras que MongoDB 8.x requiere Mongoose 8.7 o superior.

Por eso 7.0 es la versión más reciente que soporta el proyecto sin actualizar sus dependencias.

## Cómo levantar el proyecto

### 1. Base de datos

Con Docker, desde la raíz del repo:

```bash
docker compose up -d
```

Si ya tienes MongoDB instalado en `localhost:27017`, omite este paso. La conexión está en `back/src/config.ts`, no requiere credenciales y la base `kuepa_test` se crea sola.

### 2. Backend

```bash
cd back
npm i
npm run dev
```

La API queda en `http://localhost:7001`.

### 3. Usuario de prueba

Con la base de datos arriba, en otra terminal dentro de `back/`:

```bash
npm run cli -- --seeder initSeeder -f
```

### 4. Frontend

```bash
cd front
npm i
npm run dev
```

La aplicación queda en `http://localhost:5173`.

## Acceso

| Usuario | Contraseña |
|---|---|
| `useradminket` | `ket#2025` |

## Puertos

| Servicio | Puerto |
|---|---|
| Frontend | 5173 |
| Backend | 7001 |
| MongoDB | 27017 |

## Detener MongoDB (Docker)

```bash
docker compose down      # detiene el contenedor y conserva los datos
docker compose down -v   # detiene el contenedor y borra los datos
```
