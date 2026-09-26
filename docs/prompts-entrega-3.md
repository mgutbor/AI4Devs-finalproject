# Prompts utilizados — Entrega 3

> Este documento registra los prompts utilizados durante la implementación de la Fase 3 del proyecto AI Business Presence Builder. La Fase 3 abarca desde la adición del gateway LLM real hasta la validación E2E desplegada, incluyendo CI/CD, deployment, UX y la integración de Groq como proveedor de producción.

## Estado actual

- **Proveedor actual de producción:** Groq (`openai/gpt-oss-120b`)
- **Proveedor histórico de la Fase 3:** OpenRouter (`liquid/lfm-2.5-2.6b:free`)
- **Mock:** sigue siendo relevante para tests y CI

## Índice

1. Auditoría de la línea base
2. Evaluación de proveedores LLM
3. Diseño del gateway y selección mock/real
4. Prompting estructurado y grounding
5. Validación de outputs
6. Resiliencia y errores del proveedor
7. Testing de la integración
8. Comparativa Mock vs LLM real (Hito 3.8)
9. Datos enviados al proveedor LLM (Hito 3.9 — minimización)
10. CI/CD y despliegue (Hito 3.10)
11. UX — estados de carga (Hito 3.12)
12. Groq como proveedor de producción (Hito 3.13)
13. Validación E2E desplegada
14. Trazabilidad

---

## 1. Auditoría de la línea base

**Prompt utilizado: revisión previa de la arquitectura existente**

> Lee completamente `docs/FASE3-IMPLEMENTATION-CONTRACT.md`. Revisa la arquitectura actual de `backend/src/ai-generation/`, cómo `AssetsService` consume `AIGenerationService`, `MockLlmGateway`, los tests de generación, las variables de entorno y el estado Git. Mantén la arquitectura existente, no elimines el mock, no envíes `DiscoveryResponses` directamente al LLM y no modifiques endpoints públicos sin justificación.

**Resultado:** Se confirmó que `LLMGateway`, `ContextBuilder`, `PromptBuilder`, `OutputValidator`, `MockLlmGateway` y `AIGenerationService` ya formaban el pipeline base. La implementación nueva se limitó a añadir un gateway real, selección por configuración, validación adicional y tests.

**Evidencia:** Commit `8e14519` — el archivo `docs/prompts-entrega-3.md` fue creado en este commit junto con el contrato de Fase 3 y el gateway OpenRouter.

---

## 2. Evaluación de proveedores LLM

**Prompt utilizado para la búsqueda de proveedor**

> Elige un proveedor LLM real para un backend NestJS + TypeScript que pueda integrarse mediante un adapter HTTP ligero detrás de `LLMGateway`. Debe tener free tier o coste muy bajo para una demo académica, generación textual en español, JSON estructurado cuando sea posible, límites y privacidad documentables, y no debe obligar a acoplar el dominio a un SDK concreto. Compara opciones actuales como Google Gemini, Groq y OpenRouter y recomienda una.

**Resultado:** La búsqueda de Gravity Index recomendó OpenRouter por su API HTTP unificada, compatibilidad con distintos modelos y posibilidad de utilizar modelos gratuitos. La integración utiliza `fetch` nativo, no un SDK del proveedor.

**Decisión humana:** Se seleccionó OpenRouter como primer adapter real, con `LLM_PROVIDER=mock` por defecto. La activación del proveedor real requiere configurar manualmente `LLM_PROVIDER=real` y `LLM_API_KEY`.

**Limitación:** La disponibilidad, límites y condiciones del modelo gratuito deben comprobarse de nuevo antes de una demo o deployment, porque dependen del proveedor y pueden cambiar.

---

## 3. Diseño del gateway y selección mock/real

**Prompt utilizado: diseño de integración desacoplada**

> Implementa la integración real sin reescribir el dominio. Mantén una abstracción equivalente a `LLMGateway`, conserva `MockLlmGateway` para desarrollo y tests, crea un gateway real como detalle de infraestructura y selecciona `mock` o `real` mediante configuración. El servicio de generación no debe conocer detalles HTTP, URLs ni credenciales del proveedor.

**Resultado:**

- Se mantuvo `LLMGateway`.
- Se añadió `OpenRouterLlmGateway`.
- La selección se realiza mediante `LLM_PROVIDER`.
- El mock continúa siendo la opción por defecto.
- Las credenciales solo se leen desde variables de entorno.
- El dominio continúa recibiendo `BusinessProfileContext`.

---

## 4. Prompting estructurado y grounding

**Prompt utilizado: refinamiento de prompts**

> Mantén `BusinessProfile` como única fuente canónica. Refina `PromptBuilder` para que cada uno de los cinco tipos de asset tenga instrucciones específicas, exija JSON con `title` y `content`, prohíba inventar precios, servicios, certificaciones, clientes, métricas, horarios, localizaciones y contactos, y omita cualquier dato no disponible.

**Resultado:**

- `PROMPT_VERSION` pasó de `v1` a `v2`.
- `CONTEXT_VERSION` se mantiene en `v1`.
- Cada asset tiene instrucciones específicas.
- El prompt exige salida JSON controlada.
- El gateway real añade un system prompt de grounding.
- El contexto continúa derivándose exclusivamente del perfil aprobado.

---

## 5. Validación de outputs

**Prompt utilizado: validación de respuesta del proveedor**

> Valida el output antes de persistirlo como `Asset`. Comprueba JSON válido, `title`, `content`, tipos, contenido vacío, límites razonables, formato FAQ, límite de biografía social, límite de descripción de directorio, ausencia de scripts o markup peligroso y una referencia mínima al contexto canónico cuando se dispone de él. Si falla, registra la generación como fallida y no la persistas como asset válido.

**Resultado:**

- El gateway real solo convierte respuestas JSON con `title` y `content`.
- `OutputValidator` valida estructura y límites.
- FAQ exige marcadores de pregunta y respuesta.
- Se rechazan patrones básicos de script, `javascript:` y event handlers.
- Se comprueba grounding mínimo mediante nombre, categoría, servicio o producto del perfil.
- Los tests existentes se actualizaron para cubrir el nuevo grounding.

---

## 6. Resiliencia y errores del proveedor

**Prompt utilizado: control de llamadas externas**

> Implementa llamadas HTTP controladas con timeout explícito, errores clasificados, retry limitado únicamente para errores transitorios, backoff, rate limit, respuestas vacías, JSON malformado, errores de autenticación y proveedor no disponible. No expongas secretos ni permitas que un fallo externo quede como excepción no controlada de infraestructura.

**Resultado:**

- Timeout configurable mediante `LLM_TIMEOUT_MS`.
- Retries configurables mediante `LLM_MAX_RETRIES`.
- Backoff exponencial limitado.
- Clasificación de timeout, red, autenticación, request inválida, rate limit, proveedor no disponible y respuesta malformada.
- El gateway no realiza peticiones si falta la API key.
- `AIGenerationService` registra fallos y devuelve errores controlados de generación.

**Limitación:** El rate limiting de aplicación por usuario o negocio no se implementa todavía; en esta iteración solo se clasifican y reintentan de forma limitada las respuestas 429 del proveedor.

---

## 7. Testing de la integración

**Prompt utilizado: tests sin consumo del proveedor**

> Añade tests deterministas para el gateway real usando `fetch` mockeado. Cubre respuesta JSON válida, respuesta malformada, error de autenticación, credenciales ausentes, timeout/rate limit cuando proceda y compatibilidad del pipeline existente con `MockLlmGateway`. No consumas créditos ni dependas de una API externa.

**Resultado:**

- Se añadieron tests unitarios de `OpenRouterLlmGateway`.
- Se mantienen los tests del mock y del pipeline.
- Se actualizó la expectativa de `promptVersion` a `v2`.
- No se ejecuta ninguna llamada externa durante los tests.

---

## 8. Comparativa Mock vs LLM real (Hito 3.8)

**Prompt utilizado: auditoría del estado actual**

> Lee `docs/FASE3-IMPLEMENTATION-CONTRACT.md` y revisa la implementación actual de `backend/src/ai-generation/`. Identifica requisitos explícitos relacionados con Mock vs LLM real, validación de outputs, grounding, trazabilidad, metadata y comparativas. No interpretes requisitos que no estén en el contrato como obligatorios.

**Resultado:** Se confirmó que el contrato exige coexistencia de ambos gateways (§21.2), Mock mantenido para tests/CI (§2.6), evidencia verificable de generación real (§19) y trazabilidad mediante `AIGeneration` (§6.3).

---

**Prompt utilizado: captura de evidencia experimental**

> Recupera de PostgreSQL los registros del BusinessProfile "Café Central Madrid" y sus `AIGeneration` y `Asset` asociados. Verifica que los 5 outputs reales del Hito 3.2 siguen disponibles mediante `responseSnapshot`. Ejecuta una generación completa con `LLM_PROVIDER=mock` utilizando el mismo BusinessProfile. Captura la evidencia de ambas ejecuciones: assetType, status, title, content, tokensUsed, modelUsed, promptVersion, contextVersion, timestamps. Compara los outputs Mock v1 históricos con los Mock v2 actuales para verificar determinismo.

**Resultado:**
- Los 5 outputs reales de 3.2 están disponibles en `AIGeneration.responseSnapshot`.
- Se ejecutó Mock con el mismo BusinessProfile y `promptVersion=v2`.
- Se verificó que los outputs Mock v1 (históricos) y v2 (actuales) son idénticos en `title`, `content` y `tokensUsed`.
- Se verificó que `contextSnapshot` y `promptSnapshot` son idénticos entre Mock y Real para los 5 assets.
- Git permanece limpio.

---

**Prompt utilizado: verificación de evidencia**

> Comprueba si existen registros históricos de ejecuciones Mock anteriores del mismo BusinessProfile y compara los outputs. Verifica si la ejecución Mock sobreescritó los Assets del LLM real o creó Assets nuevos. Recalcula métricas agregadas desde los registros reales. Confirma que la latencia HTTP no fue instrumentada. Verifica la trazabilidad de los 5 outputs reales.

**Resultado:**
- Los outputs Mock v1 e v2 son idénticos (determinismo confirmado).
- La ejecución Mock creó 5 Assets nuevos bajo un BusinessProfile nuevo; los Assets del LLM real no fueron modificados.
- Las métricas fueron recalculadas y verificadas.
- La latencia del proveedor no fue instrumentada.
- Los 5 outputs reales están completos y trazables.

---

**Prompt utilizado: evaluación cualitativa asistida por LLM**

> Evalúa cada uno de los 10 outputs existentes (5 Mock + 5 Real) desde cuatro dimensiones: Grounding (Adecuado/Parcial/Problemático), Coherencia (Adecuada/Mejorable/Problemática), Utilidad (Alta/Media/Baja) y Tono (Adecuado/Parcialmente adecuado/Inadecuado). Utiliza únicamente el BusinessProfile como referencia de verdad. No generes nuevos outputs. No asignes puntuaciones numéricas. No declares un ganador. Documenta únicamente diferencias observables.

**Resultado:**
- 10 outputs evaluados: 5 Mock + 5 Real.
- Grounding: 7 Adecuado, 3 Parcial (WEBSITE_CONTENT Real, GOOGLE_BUSINESS_DESCRIPTION Real, FAQ Real — todos por embellishments/ampliaciones del LLM real).
- Coherencia: 10 Adecuada.
- Utilidad: 5 Media (Mock), 5 Alta (Real).
- Tono: 4 Parcialmente adecuado (Mock), 6 Adecuado (Real).
- Se documentaron 6 ejemplos concretos de ampliaciones semánticas del LLM real.

**Restricciones metodológicas:**
- Evaluación realizada por un LLM (MiMo v2.5), no por un evaluador humano.
- Una única ejecución del evaluador.
- n=10 outputs.
- No constituye evaluación humana ni métrica objetiva.
- No se utiliza para ranking.

**Referencia completa:** [`docs/evidence-3.3-comparison.md`](evidence-3.3-comparison.md)

---

## 9. Datos enviados al proveedor LLM (Hito 3.5 — minimización)

### Campos que se envían al proveedor

El contexto `BusinessProfileContext` que se serializa a JSON en el prompt y se envía al proveedor LLM contiene únicamente:

| Campo | Tipo | Descripción |
|---|---|---|
| `businessName` | `string` | Nombre del negocio |
| `category` | `string` | Categoría del negocio |
| `services` | `string[]` | Lista de servicios ofrecidos |
| `products` | `string[]` | Lista de productos ofrecidos |
| `targetAudience` | `string` | Público objetivo |
| `tone` | `string` | Tono de comunicación |
| `style` | `string \| null` | Estilo de comunicación (opcional) |
| `location` | `string` | Ubicación del negocio |

### Campos que NO se envían al proveedor

Los siguientes campos del `BusinessProfile` se utilizan internamente pero **no forman parte del contexto enviado al LLM**:

| Campo | Motivo de exclusión |
|---|---|
| `phone` | No es necesario para generar los assets textuales |
| `website` | No es necesario para generar los assets textuales |
| `gdprConsent` | Se valida internamente antes de autorizar la generación, pero no se envía al proveedor |
| `id` | Identificador interno, no relevante para la generación |
| `businessId` | Identificador interno, no relevante para la generación |
| `userId` | Identificador interno, no relevante para la generación |
| `status` | Estado interno del workflow, no relevante para la generación |

### Justificación

La exclusión de `phone`, `website` y `gdprConsent` responde al **principio de minimización de datos**: únicamente se envían al proveedor externo los campos estrictamente necesarios para generar los cinco assets textuales. Los campos excluidos no aportan información relevante para la generación de contenido de marketing digital.

### Snapshot de trazabilidad

Los campos excluidos tampoco aparecen en:
- `contextSnapshot` (almacenado en `AIGeneration`)
- `promptSnapshot` (almacenado en `AIGeneration`)

Esto garantiza que la información excluida del contexto LLM tampoco persiste en los snapshots de trazabilidad.

**Commit:** `7b7449f` — `fix: harden security and privacy`. Este commit implementó la exclusión de los tres campos del contexto LLM, añadió el test de aislamiento cross-user en `database.e2e-spec.ts` y documentó esta sección en el registro de prompts.

---

## 10. CI/CD y despliegue

### Contexto

La Fase 3 requiere un pipeline de integración continua que ejecute tests, lint, typecheck, migraciones de base de datos y build de forma reproducible, sin depender de credenciales LLM reales ni del estado local del desarrollador.

### Trabajo realizado

**Prompt documentado de forma resumida a partir del historial Git y de la evidencia generada.**

El prompt de implementación solicitó crear un workflow de GitHub Actions que:
- se ejecutara en push y pull request contra `finalproject-MGB`;
- incluyera un servicio PostgreSQL (`postgres:16-alpine`) como servicio del pipeline;
- utilizara `LLM_PROVIDER=mock` para evitar consumo de credenciales reales;
- ejecutara install, lint, typecheck, tests unitarios, migraciones, database E2E y build;
- mantuviera la separación entre tests que dependen de PostgreSQL y tests que no.

**Commit:** `2d768ee` — `ci: add GitHub Actions workflow for automated quality checks`.

### Configuración resultante

El archivo `.github/workflows/ci.yml` define un pipeline con los siguientes pasos:

1. `npm ci` — instalación de dependencias
2. `npm run prisma:generate` — generación del cliente Prisma
3. `npm run lint` — lint de backend y frontend
4. `npm run typecheck` — typecheck de backend y frontend
5. `npm --workspace backend test -- --testPathIgnorePatterns=database` — tests unitarios y API E2E
6. `npx prisma migrate deploy` — migraciones de base de datos
7. `npm --workspace backend test -- --testPathPattern=database` — database E2E
8. `npm run build` — build de backend y frontend

Variables de entorno del pipeline:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `postgresql://app:app@localhost:5432/ai_bpb?schema=public` |
| `JWT_SECRET` | `ci-test-only-secret-do-not-use-in-production` |
| `JWT_EXPIRES_IN` | `1d` |
| `LLM_PROVIDER` | `mock` |
| `AI_MOCK_TEMPERATURE` | `0.2` |

### Preparación para deployment

**Prompt documentado de forma resumida a partir del historial Git.**

Se solicitó preparar el repositorio para producción: actualizar `.env.example` con las variables necesarias, ajustar scripts de `package.json` y verificar que la configuración de Render pudiera construirse y desplegarse correctamente.

**Commit:** `c51ba61` — `fix: prepare repository for production deployment`.

### Despliegue en Render

La configuración de Render se realizó manualmente desde el dashboard (no existe IaC). El despliegue incluye:

- Frontend: estático (Vite build)
- Backend: servicio web (NestJS)
- PostgreSQL: base de datos gestionada por Render
- LLM: proveedor Groq, seleccionado mediante `LLM_PROVIDER=groq`

### Distinguir entre implementación, validación, incidencia y corrección

- **Implementación:** creación del workflow CI y preparación del repositorio para deployment.
- **Validación:** ejecución del pipeline CI que confirma que lint, typecheck, tests y build pasan.
- **Incidencia:** durante la validación Groq en producción, se observó un HTTP 404 transitorio asociado a un reinicio de la instancia de Render (documentado en `docs/evidence-3.7-groq.md:293-333`).
- **Corrección:** no se requirió corrección de código; la incidencia fue de infraestructura.

---

## 11. UX — estados de carga

### Contexto

La interfaz de usuario no proporcionaba feedback visual durante las operaciones asíncronas (generación de assets, regeneración, aprobación de perfil), lo que podía causar confusión o clics repetidos.

### Trabajo realizado

**Prompt documentado de forma resumida a partir del historial Git y del commit.**

Se solicitó añadir estados de carga a las acciones asíncronas del frontend: generación de assets, regeneración de asset, aprobación de perfil y cualquier operación HTTP que el usuario pudiera disparar. El objetivo era que el usuario recibiera feedback visual inmediato de que la operación estaba en curso.

**Commit:** `325961d` — `fix(frontend): add loading states to async actions`.

### Cambio resultante

Se modificó `frontend/src/App.tsx` para incluir estados de carga en las operaciones asíncronas. El cambio fue de 3 inserciones y 3 eliminaciones, lo que indica una implementación ligera de estados de carga existentes o patrones ya disponibles en el componente.

---

## 12. Groq como proveedor de producción (Hito 3.13)

### Contexto

OpenRouter, el primer proveedor LLM real integrado, presentó agotamiento de cuota diaria (`HTTP 429 Rate limit exceeded: free-models-per-day`) que impidió continuar utilizando de forma fiable el modelo gratuito seleccionado. Esto motivó la evaluación de Groq como alternativa.

### Implementación del GroqLlmGateway

**Prompt documentado de forma resumida a partir del historial Git y de la evidencia generada.**

Se solicitó implementar un nuevo gateway `GroqLlmGateway` que:
- siguiera la interfaz `LLMGateway` existente;
- se integrara en el pipeline sin modificar dominio ni arquitectura;
- estuviera seleccionable mediante `LLM_PROVIDER=groq`;
- preservara `MockLlmGateway` y `OpenRouterLlmGateway` sin cambios;
- incluyera instrumentación de tokens, latencia y rate-limit headers;
- implementara clasificación de errores con códigos tipados y retry logic;
- utilizara structured output con JSON Schema strict mode.

**Commit:** `a86dd4b` — `feat: add GroqLlmGateway for experimental Groq provider`.

### Corrección de base URL

Durante la validación en producción, se descubrió que la variable `LLM_BASE_URL` (que contiene la URL de OpenRouter: `https://openrouter.ai/api/v1`) era compartida entre gateways, causando un `authentication_error` porque las llamadas a Groq se dirigían a OpenRouter.

**Prompt documentado de forma resumida a partir del historial Git.**

Se solicitó hardcodear la base URL de Groq como `https://api.groq.com/openai/v1` para evitar la colisión con OpenRouter, y actualizar los tests correspondientes.

**Commit:** `004a24b` — `fix: hardcode Groq base URL to avoid OpenRouter collision`.

### Características del GroqLlmGateway

| Característica | Valor |
|---|---|
| Base URL | `https://api.groq.com/openai/v1` (hardcoded) |
| Modelo por defecto | `openai/gpt-oss-120b` |
| Response format | `json_schema` con `strict: true` |
| Timeout | 30,000 ms (configurable via `LLM_TIMEOUT_MS`) |
| Max tokens | 2,000 (configurable via `LLM_MAX_TOKENS`) |
| Temperature | 0.2 (configurable via `LLM_TEMPERATURE`) |
| Retries | 0 (configurable via `LLM_MAX_RETRIES`) |

### Instrumentación

El gateway instrumenta por cada llamada:
- **Tokens reales del proveedor:** `prompt_tokens`, `completion_tokens`, `total_tokens`
- **Latencia:** medida con `performance.now()` (monotonic clock)
- **Rate-limit headers:** `x-ratelimit-limit-requests`, `x-ratelimit-remaining-requests`, `x-ratelimit-reset-requests`, `x-ratelimit-limit-tokens`, `x-ratelimit-remaining-tokens`, `x-ratelimit-reset-tokens`

### Clasificación de errores

| HTTP Status | Error Code | Retryable |
|---|---|---|
| 401, 403 | `authentication_error` | No |
| 400, 404 | `invalid_request` | No |
| 429 | `rate_limit` | Sí |
| 5xx | `provider_unavailable` | Sí |
| Timeout | `timeout` | Sí |
| Network | `network_error` | Sí |
| JSON inválido | `malformed_response` | No |

### Factory de selección de provider

La selección del proveedor se realiza en `ai-generation.module.ts` mediante un factory:

```typescript
const provider = config.get<string>('LLM_PROVIDER', 'mock').toLowerCase();
if (provider === 'groq') return groqGateway;
if (provider === 'real') return realGateway;
return mockGateway;
```

### Coexistencia de gateways

- `MockLlmGateway` — sin cambios, sigue funcionando con `LLM_PROVIDER=mock` (o sin variable)
- `OpenRouterLlmGateway` — sin cambios, sigue funcionando con `LLM_PROVIDER=real`
- `GroqLlmGateway` — nuevo, activo con `LLM_PROVIDER=groq`

### Validación en producción

Se realizaron 3 generaciones completas en Render (free tier) con el BusinessProfile aprobado:

| Métrica | Valor |
|---|---|
| Total de llamadas | 15 |
| Llamadas exitosas | 15 (100%) |
| Errores del proveedor | 0 |
| Total tokens | 15,062 |
| Latencia media | 1,348 ms |

**Nota:** estas métricas corresponden a 3 ejecuciones con un único BusinessProfile y un único modelo (`openai/gpt-oss-120b`). No constituyen una caracterización estadística exhaustiva del proveedor.

### Evidencia completa

El experimento completo está documentado en [`docs/evidence-3.7-groq.md`](evidence-3.7-groq.md).

**Commit de documentación:** `2958e49` — `docs: document phase 3.7 Groq validation evidence`.

---

## 13. Validación E2E desplegada

### Contexto

Una vez desplegado el sistema en Render con Groq como proveedor, se ejecutó una validación manual del flujo principal completo contra la API desplegada, utilizando HTTP directo desde el cliente.

### Trabajo realizado

**Prompt documentado de forma resumida a partir del historial Git y de la evidencia generada en el README.**

Se solicitó ejecutar manualmente el flujo completo de usuario contra la API desplegada en Render:
1. Register — crear usuario
2. Login — obtener JWT
3. Create Business — crear negocio
4. Discovery — enviar respuestas de descubrimiento
5. Approve Profile — aprobar el BusinessProfile
6. Generate — generar los 5 assets con Groq
7. Edit — modificar un asset
8. Regenerate — regenerar un asset
9. Verificar estado final

### Resultado

| Etapa | Resultado | Evidencia |
|---|---|---|
| Register | PASS | HTTP 201, user creado, JWT devuelto |
| Login | PASS | HTTP 201, JWT devuelto |
| Create Business | PASS | HTTP 201, business creado |
| Discovery | PASS | HTTP 201, perfil status=NORMALIZED |
| Approve Profile | PASS | HTTP 201, perfil status=APPROVED |
| Generate | PASS | HTTP 201, 5/5 assets generados, ~5 s, 3,570 tokens |
| Edit | PASS | HTTP 200, título y contenido actualizados, status=EDITED |
| Regenerate | PASS | HTTP 201, asset regenerado, status=READY_FOR_REVIEW, ~1 s |
| Final state | PASS | 5/5 assets presentes, todos status=READY_FOR_REVIEW |

### Observaciones

Las siguientes observaciones corresponden a **una única ejecución manual del flujo E2E desplegado** realizada el 25/09/2026. No constituyen un benchmark ni una garantía de rendimiento.

- La generación de los cinco assets completos tomó aproximadamente 5 segundos.
- La regeneración de un asset individual tomó aproximadamente 1 segundo.
- Se utilizaron 3,570 tokens en total durante la generación.
- No se observó cold start en esta validación.
- El incidente 404 documentado previamente no se reprodujo.

### Distinguir entre evidencia de código y evidencia de producción

| Tipo | Descripción |
|---|---|
| Evidencia de código/tests | 51 tests automatizados, 14 suites, typecheck, lint, build |
| Evidencia de producción | E2E desplegado documentado en el README (sección 11) |
| Observaciones experimentales | Métricas de tokens, latencia y comportamiento del proveedor Groq |

---

## 14. Trazabilidad

| Hito | Objetivo | Evidencia | Commit/documento |
|---|---|---|---|
| 3.1 — Auditoría línea base | Revisar arquitectura existente antes de implementar | Revisión de `FASE3-IMPLEMENTATION-CONTRACT.md` y código | `8e14519` |
| 3.2 — Selección proveedor | Elegir OpenRouter como primer LLM real | Búsqueda Gravity Index, decisión humana | `8e14519` |
| 3.3 — Gateway y selección | Implementar `OpenRouterLlmGateway` con selección por config | Código: `openrouter-llm.gateway.ts`, `ai-generation.module.ts` | `8e14519` |
| 3.4 — Prompting y grounding | Refinar prompts v2, BusinessProfile como fuente canónica | Código: `prompt-builder.ts` (`PROMPT_VERSION=v2`) | `8e14519` |
| 3.5 — Validación outputs | Validar estructura, grounding mínimo, sanitización | Código: `output-validator.ts` | `8e14519` |
| 3.6 — Resiliencia | Timeout, retries, clasificación de errores | Código: `openrouter-llm.gateway.ts` | `8e14519` |
| 3.7 — Testing integración | Tests unitarios del gateway real con fetch mockeado | Tests: `openrouter-llm.gateway.spec.ts` | `8e14519` |
| 3.8 — Comparativa Mock vs Real | Evidencia cualitativa y cuantitativa de ambos gateways | [`docs/evidence-3.3-comparison.md`](evidence-3.3-comparison.md) | `9264d61` |
| 3.9 — Minimización PII | Excluir phone, website, gdprConsent del contexto LLM | Código: `context-builder.ts`, test cross-user en `database.e2e-spec.ts` | `7b7449f` |
| 3.10 — CI/CD | Workflow GitHub Actions con PostgreSQL service | `.github/workflows/ci.yml` | `2d768ee` |
| 3.11 — Preparación deployment | Preparar repo para producción en Render | `.env.example`, `package.json` | `c51ba61` |
| 3.12 — UX loading states | Estados de carga en operaciones asíncronas | `frontend/src/App.tsx` | `325961d` |
| 3.13 — Groq gateway | Implementar `GroqLlmGateway` con instrumentación completa | Código: `groq-llm.gateway.ts`, tests: `groq-llm.gateway.spec.ts` | `a86dd4b` |
| 3.14 — Corrección base URL Groq | Hardcodear URL de Groq para evitar colisión con OpenRouter | Código: `groq-llm.gateway.ts` | `004a24b` |
| 3.15 — Evidencia Groq | Documentar validación experimental de Groq | [`docs/evidence-3.7-groq.md`](evidence-3.7-groq.md) | `2958e49` |
| 3.16 — E2E desplegado | Validar flujo completo en Render con Groq | README sección 11 | Validación manual 25/09/2026 |

### Nota sobre prompts literales vs síntesis

Las secciones 1-9 contienen prompts documentados literalmente, preservados desde la implementación original.

Las secciones 10-13 contienen descripciones del trabajo realizado, basadas en el historial Git, los commits, los archivos generados y la evidencia documentada. Los prompts exactos de estas secciones no fueron preservados de forma literal durante la implementación; la documentación se basa en la reconstrucción a partir de evidencia verificable.
