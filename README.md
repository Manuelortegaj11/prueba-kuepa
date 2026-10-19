# Prueba técnica Full Stack - ket | KuepaEduTech

Formulario de registro de leads (prospectos) sobre el CRM base de Kuepa.

Repositorio basado en la plantilla [kuepa/prueba-kuepa](https://github.com/kuepa/prueba-kuepa). El historial conserva los commits originales, así que el trabajo propio se puede revisar comparando contra el último commit de la plantilla (`d94d00e`).

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js 18 + Express + TypeScript
- **Base de datos:** MongoDB 7.0

## Contenido

- [Requisitos](#requisitos)
- [Cómo levantar el proyecto](#cómo-levantar-el-proyecto)
- [Puertos](#puertos)
- [Detener MongoDB (Docker)](#detener-mongodb-docker)
- [Qué se construyó](#qué-se-construyó)
- [Análisis y hallazgos](#análisis-y-hallazgos)
- [Decisiones técnicas](#decisiones-técnicas)
- [Estructura del código](#estructura-del-código)
- [Convenciones](#convenciones)

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

La API queda en `http://localhost:7001`. En la consola debe aparecer `Mongo contented`; si no aparece, el backend no se pudo conectar a MongoDB.

### 3. Datos iniciales

Con la base de datos arriba, en otra terminal dentro de `back/`, crea el usuario de prueba y el catálogo de 8 programas académicos (el formulario lo necesita):

```bash
npm run cli -- --seeder initSeeder -f
npm run cli -- --seeder programSeeder -f
```

Opcional: 32 leads de ejemplo para probar la búsqueda y la paginación.

```bash
npm run cli -- --seeder leadDemoSeeder -f
```

Los seeders se pueden ejecutar varias veces sin duplicar datos. El flag `-f` fuerza la ejecución aunque ya se hayan corrido antes.

### 4. Frontend

```bash
cd front
npm i
npm run dev
```

La aplicación queda en `http://localhost:5173`.

### 5. Probar el formulario

1. Abre `http://localhost:5173` e inicia sesión con el usuario `useradminket` y la contraseña `ket#2025`.
2. En el menú lateral, entra a **crm → Contactos** (ruta `/leads`).

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

## Qué se construyó

### Formulario de registro

| Campo | Regla |
|---|---|
| Nombre y apellido | Obligatorios |
| Correo electrónico | Formato válido y único entre los leads; se guarda en minúscula |
| Celular | 10 dígitos que empiezan por 3. Acepta números pegados con `+57`, espacios o guiones |
| Programa de interés | Se elige del catálogo y debe existir |

El backend genera el **número del lead** (`incremental`, de 1000 a 9999) y el **nombre completo** (`full_name`).

Usabilidad:

- Las mismas reglas se validan en el front (respuesta inmediata) y en el back (garantía).
- Los errores aparecen en español debajo de cada campo, al salir de un campo con datos y al enviar, y desaparecen apenas se corrigen. Al enviar, el foco va al primer campo con error.
- Los errores del servidor también se muestran en su campo: por ejemplo, un correo ya registrado se marca en el correo.
- El botón muestra "Registrando…" y se desactiva para evitar envíos dobles.
- Al guardar se confirma con el número asignado ("Lead #1000 registrado"), el formulario se limpia y el foco vuelve a "Nombre" para registrar el siguiente.
- Diseño responsive y accesible: etiquetas asociadas, `aria-invalid` y mensajes de error vinculados a cada campo.

### Lista de leads

Debajo del formulario, para confirmar lo registrado y consultar los leads existentes:

- Búsqueda por nombre, correo, celular o número de lead, sin distinguir tildes ("maria" encuentra "María").
- Paginación de 10 en 10, calculada en el servidor.
- El lead recién creado aparece primero y resaltado.
- Estados de carga, lista vacía, búsqueda sin resultados y error con opción de reintentar.

### API

Todas las rutas de esta tabla requieren el token de `POST /api/auth/login` en el header `Authorization`.

| Método | Ruta | Uso | Respuestas |
|---|---|---|---|
| `GET` | `/api/program` | Catálogo de programas | 200 |
| `POST` | `/api/lead/upsert` | Crea un lead (o lo edita si se envía `_id`) | 200 · 400 `lead.invalid_data` con `fields` · 404 `program.not_found` o `lead.not_found` · 409 `lead.duplicated_email` · 500 `lead.incremental_exhausted` |
| `GET` | `/api/lead` | Lista con `search`, `page` (por defecto 1) y `pageSize` (por defecto 10, máximo 50) | 200 con `list` y `pagination` · 400 `pagination.invalid_params` |
| `GET` | `/api/lead/get/:_id` | Detalle de un lead (viene de la plantilla; el front no la usa) | 200 · 404 `lead.not_found` |

## Análisis y hallazgos

Antes de construir se revisó el modelo de datos y el código existente:

- **El modelo `Lead` se simplificó para la prueba (commit `0effd37`), pero `leadService` no.** El servicio seguía usando campos eliminados (`contact`, `adviser` y los estados `sold` y `dropped`):
  - `list` y `get` fallaban desde el primer lead por el `strictPopulate` de Mongoose. Se corrigieron para poblar `interestProgram`.
  - `upsert` guardaba todo lo que recibía (asignación masiva) y podía escribir un estado fuera del enum. Se reescribió con una lista blanca de campos y validaciones.
- **`external` y `adviserInfo` también dependían de esos campos; por seguridad se dejaron de exponer sus rutas, sin borrar su lógica.**
  - `external` se podía llamar sin autenticación y, al fallar, dejaba registros huérfanos en la base; `adviserInfo` no funcionaba con el modelo actual.
  - Asumiendo un equipo que trabaja sobre un producto ya en marcha, ese código puede tener dueños, integraciones o planes que no se ven desde la prueba. Por eso se aplicó la medida mínima y reversible: quitar solo las rutas.
  - Queda reportado para que el equipo decida si se actualizan al modelo actual o se retiran. Reactivarlos es volver a agregar su línea en `leadRoute.ts`.
- **`Program` existía pero no estaba registrado**, ni tenía endpoint ni datos. Se registró, se expuso `GET /api/program` y se creó su seeder.
- **`LeadRoute` no estaba registrado.** Se registró al final, cuando el servicio ya era seguro.
- **`errors.ts` estaba vacío**, así que todo error respondía 500. Ahora cada error tiene su código HTTP.
- **En el front:** `http.post` modifica el objeto que recibe, en celular el layout tapaba el inicio del contenido y la variable CSS `--input` dejaba negros los bordes de los botones `outline`. Se resolvió desde los componentes nuevos, sin modificar `http.ts` ni los componentes de UI.
- El menú dice "Contactos" y la página "Leads"; se dejó como viene en la plantilla.

## Decisiones técnicas

| Tema | Decisión | Motivo |
|---|---|---|
| Número del lead | El mayor + 1 desde 1000, con índice único y reintento si dos registros chocan; cuenta también los leads borrados lógicamente | El modelo pide un número único de 4 dígitos; el índice garantiza que nunca se repita |
| Validación | Mismas reglas en front y back; el back solo acepta los 5 campos del formulario | Respuesta inmediata para el usuario y protección contra datos manipulados |
| Correo repetido | Respuesta 409 | Evita registrar dos veces al mismo prospecto |
| Celular | 10 dígitos que empiezan por 3 | Formato de los celulares en Colombia |
| Programas | Seeder propio, separado de `initSeeder` | El catálogo es un dato distinto del usuario de prueba |
| Búsqueda | Texto escapado y cada vocal con su variante con tilde | Nadie puede alterar la consulta, y la búsqueda funciona bien con nombres en español |
| Paginación | `page` y `pageSize` (máximo 50) con metadatos: `total`, `totalPages`, `hasNext` y `hasPrev` | Se pagina en el servidor, con límites para no sobrecargar la base |
| Barra de scroll | Oculta en el contenedor de contenido del layout | Al buscar, la barra aparecía y desaparecía y el contenido saltaba |
| Editar y borrar | Fuera del alcance | La prueba pide registrar leads |

## Estructura del código

Principales archivos agregados o modificados:

```
back/src/
├── app/domains/lead/        servicio de leads: validación, número, búsqueda y paginación
├── app/domains/program/     endpoint del catálogo (generado con el CLI de la plantilla)
├── app/models/              reglas e índices del lead; registro de Program
├── app/router/              registro de las rutas de leads y programas
├── app/resources/errors/    errores con su código HTTP
├── core/utilities/          paginationUtility
└── seeders/                 programSeeder y leadDemoSeeder
front/src/
├── pages/leads/             página, formulario, validación y lista
└── services/                leadService y programService
```

## Convenciones

En el código se siguió el estilo de la plantilla, para que el trabajo nuevo sea consistente con el del equipo. Las convenciones propias se aplicaron en el flujo de Git.

### Git (convención propia)

- **Ramas:** `main` (entrega final), `staging` (integración) y ramas de trabajo con el formato `tipo/descripcion` (`feature/lead-form`, `chore/docker-mongo`, `docs/readme`). Cada rama llega a `staging` por PR y se fusiona con merge commit, sin squash, para conservar el historial de cada cambio.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) con el formato `type(scope): description`, en inglés, en minúscula y en imperativo. El detalle de cada cambio va en la descripción del PR.

| Type | Cuándo se usa | Ejemplo de este repo |
|---|---|---|
| `feat` | Funcionalidad nueva | `feat(front): validate lead form fields` |
| `fix` | Corrige un comportamiento roto | `fix(back): populate interest program in lead queries` |
| `refactor` | Cambia el código sin cambiar el comportamiento | `refactor(back): avoid exposing broken lead endpoints` |
| `chore` | Mantenimiento, infraestructura o datos de apoyo | `chore(docker): add mongodb 7.0 with docker compose` |
| `docs` | Documentación | `docs(readme): add setup steps with node 18 and docker compose` |

| Scope | Parte del repo |
|---|---|
| `back` | API (Express + Mongoose) |
| `front` | Aplicación React |
| `docker` | Infraestructura local |
| `readme` | Documentación |

**Por qué commits tan específicos:**

- **El type dice la intención sin abrir el diff.** No es lo mismo `fix` (algo estaba roto) que `refactor` (el comportamiento no cambia). Por ejemplo, quitar las rutas de `external` y `adviserInfo` es `refactor`, porque esas rutas todavía no estaban registradas; en cambio, poblar `interestProgram` es `fix`, porque `list` y `get` fallaban.
- **El scope dice qué aplicación se toca.** En un repo con back y front, permite revisar cada parte por separado, por ejemplo con `git log --grep "(back)"`.
- **Un commit, un propósito.** Cada commit deja el proyecto funcionando, así que se puede revisar, revertir o rastrear con `git bisect` de forma aislada. Por eso el ajuste del servicio de leads quedó en tres commits: uno deja de exponer las rutas rotas, otro corrige `list` y `get`, y otro corrige el orden de las interacciones.

### Código (convención de la plantilla)

- Estilo existente: 2 espacios, sin punto y coma, `_params` en los servicios del back, respuestas con `responseUtility`, variables en snake_case en el back y en camelCase en el front; componentes del front en archivos kebab-case y servicios con el formato `xService.ts`.
- El dominio de programas y los seeders se generaron con el CLI de la plantilla. Donde el CLI habría sobrescrito archivos existentes (`leadRoute.ts`, `programModel.ts`), se replicó a mano lo que hace.
- Cada error del servicio tiene una clave y su código HTTP en `errors.ts`, y el front muestra el mensaje según esa clave.
- Código autoexplicativo: nombres descriptivos en lugar de comentarios. Se conservaron los marcadores `// @...`, porque el CLI los usa para insertar código.
