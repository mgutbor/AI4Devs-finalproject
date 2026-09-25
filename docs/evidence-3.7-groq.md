# Evidence — Hito 3.7: Groq LLM Provider

## 1. Objetivo

Validar experimentalmente la integración del proveedor Groq como alternativa al proveedor gratuito de OpenRouter, que había presentado agotamiento de cuota diaria (`HTTP 429 Rate limit exceeded: free-models-per-day`) impidiendo la generación de assets.

El alcance del hito es exclusivamente:

- implementar `GroqLlmGateway`;
- integrarlo en el pipeline existente sin modificar dominio ni arquitectura;
- obtener evidencia real de su comportamiento en producción;
- documentar resultados de forma factual.

---

## 2. Implementación

### 2.1 Archivos creados/modificados

| Archivo | Acción |
|---|---|
| `backend/src/ai-generation/groq-llm.gateway.ts` | Creado — implementación completa del gateway |
| `backend/src/ai-generation/groq-llm.gateway.spec.ts` | Creado — 18 tests unitarios |
| `backend/src/ai-generation/ai-generation.module.ts` | Modificado — añadido GroqLlmGateway y selector de provider |

### 2.2 Arquitectura resultante

```
LLMGateway (interfaz)
├── MockLlmGateway          (por defecto)
├── OpenRouterLlmGateway    (LLM_PROVIDER=real)
└── GroqLlmGateway          (LLM_PROVIDER=groq)
```

### 2.3 Selección de provider

El `LLM_GATEWAY` se resuelve mediante un factory en `ai-generation.module.ts`:

```typescript
const provider = config.get<string>('LLM_PROVIDER', 'mock').toLowerCase();
if (provider === 'groq') return groqGateway;
if (provider === 'real') return realGateway;
return mockGateway;
```

### 2.4 Gateway Groq — Características

| Característica | Valor |
|---|---|
| Base URL | `https://api.groq.com/openai/v1` (hardcoded) |
| Endpoint | `POST /chat/completions` |
| Modelo por defecto | `openai/gpt-oss-120b` |
| Autenticación | `Authorization: Bearer <LLM_API_KEY>` |
| Response format | `json_schema` con `strict: true` |
| Timeout | 30,000 ms (configurable via `LLM_TIMEOUT_MS`) |
| Max tokens | 2,000 (configurable via `LLM_MAX_TOKENS`) |
| Temperature | 0.2 (configurable via `LLM_TEMPERATURE`) |
| Retries | 0 (configurable via `LLM_MAX_RETRIES`) |

### 2.5 Base URL hardcoded

La base URL de Groq está hardcoded deliberadamente como `https://api.groq.com/openai/v1` y NO lee `LLM_BASE_URL`. Esta decisión resuelve un bug de la primera versión donde la variable `LLM_BASE_URL` (que contiene la URL de OpenRouter) era compartida entre gateways, causando un `authentication_error` en producción porque las llamadas a Groq se dirigían a OpenRouter.

### 2.6 Instrumentación

El gateway instrumenta por cada llamada:

- **Tokens reales del proveedor:** `prompt_tokens`, `completion_tokens`, `total_tokens` extraídos de `response.usage`
- **Latencia:** medida con `performance.now()` (monothonic clock)
- **Rate-limit headers:** `x-ratelimit-limit-requests`, `x-ratelimit-remaining-requests`, `x-ratelimit-reset-requests`, `x-ratelimit-limit-tokens`, `x-ratelimit-remaining-tokens`, `x-ratelimit-reset-tokens`

### 2.7 Clasificación de errores

| HTTP Status | Error Code | Retryable |
|---|---|---|
| 401, 403 | `authentication_error` | No |
| 400, 404 | `invalid_request` | No |
| 429 | `rate_limit` | Sí |
| 5xx | `provider_unavailable` | Sí |
| Timeout | `timeout` | Sí |
| Network | `network_error` | Sí |
| JSON inválido | `malformed_response` | No |

### 2.8 Coexistencia

- `MockLlmGateway` — sin cambios, sigue funcionando con `LLM_PROVIDER=mock` (o sin variable)
- `OpenRouterLlmGateway` — sin cambios, sigue funcionando con `LLM_PROVIDER=real`
- `GroqLlmGateway` — nuevo, activo con `LLM_PROVIDER=groq`

---

## 3. Configuración

### 3.1 Variables de entorno para Groq

```env
LLM_PROVIDER=groq
LLM_MODEL=openai/gpt-oss-120b
LLM_API_KEY=<groq_api_key>
LLM_MAX_RETRIES=0
LLM_TEMPERATURE=0.2
LLM_MAX_TOKENS=2000
LLM_TIMEOUT_MS=30000
```

### 3.2 Variables no utilizadas por Groq

| Variable | Motivo |
|---|---|
| `LLM_BASE_URL` | Hardcoded a `https://api.groq.com/openai/v1` para evitar conflicto con OpenRouter |
| `LLM_SITE_URL` | Solo utilizada por OpenRouter (`HTTP-Referer` header) |

---

## 4. Cobertura de tests

### 4.1 Resultados de validación local

```
Tests: 51 passed, 51 total
typecheck: PASS
lint: PASS
build: PASS
```

### 4.2 Tests de GroqLlmGateway (18 tests)

| Test | Verificación |
|---|---|
| Respuesta estructurada válida | Mapeo de `title`, `content`, `tokensUsed`, `modelUsed`, `temperature` |
| JSON Schema strict mode | Envía `response_format.type=json_schema` con schema y `strict: true` |
| Extracción de usage metadata | `prompt_tokens`, `completion_tokens`, `total_tokens` se extraen correctamente |
| Rate-limit headers | Se leen correctamente cuando están presentes |
| JSON malformado | Rechaza con `code=malformed_response` |
| Campos requeridos faltantes | Rechaza respuestas sin `title` o `content` |
| HTTP 401 | No reintenta, `retryable=false` |
| HTTP 400 | No reintenta, `retryable=false` |
| HTTP 429 | reintenta, `retryable=true` |
| HTTP 5xx | reintenta, `retryable=true` |
| Agotamiento de retries en 5xx | Lanza error tras agotar intentos |
| Timeout | Maneja `AbortError`, `retryable=true` |
| Network error | Maneja `TypeError`, `retryable=true` |
| Credenciales ausentes | Falla antes de hacer request, `code=authentication_error` |
| Markdown fences | Strip ` ```json ``` ` del contenido |
| Word count fallback | `tokensUsed` usa conteo de palabras si `usage` no está presente |
| Base URL siempre Groq | Ignora `LLM_BASE_URL` y usa siempre `https://api.groq.com/openai/v1` |
| Trailing slash | Normaliza trailing slash en la URL |

### 4.3 Tests existentes no modificados

- `openrouter-llm.gateway.spec.ts` — sin cambios
- `ai-generation.service.spec.ts` — sin cambios
- `output-validator.spec.ts` — sin cambios
- `context-builder.spec.ts` — sin cambios
- `database.e2e-spec.ts` — sin cambios
- `api.e2e-spec.ts` — sin cambios

---

## 5. Validación en producción

### 5.1 Configuración del experimento

- **Proveedor:** Groq
- **Modelo:** `openai/gpt-oss-120b`
- **Retries:** 0
- **Generaciones realizadas:** 3
- **BusinessProfile utilizado:** el mismo aprobado para las 3 generaciones
- **Plataforma:** Render (free tier)

### 5.2 Generación 1

| # | Asset | Latency (ms) | Input tokens | Output tokens | Total tokens | Remaining req | Remaining tok |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 | BUSINESS_SUMMARY | 1,395 | 498 | 327 | 825 | 999 | 7,203 |
| 2 | WEBSITE_CONTENT | 1,278 | 498 | 322 | 820 | 998 | 6,509 |
| 3 | GOOGLE_BUSINESS_DESCRIPTION | 1,218 | 499 | 473 | 972 | 997 | 5,894 |
| 4 | SOCIAL_MEDIA_BIO | 971 | 507 | 269 | 776 | 996 | 5,010 |
| 5 | FAQ | 1,642 | 551 | 668 | 1,219 | 995 | 4,382 |

Resultado: **5/5 assets generados correctamente.**

### 5.3 Generación 2

| # | Asset | Latency (ms) | Input tokens | Output tokens | Total tokens | Remaining req | Remaining tok |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 | BUSINESS_SUMMARY | 1,127 | 498 | 439 | 937 | 995 | 7,232 |
| 2 | WEBSITE_CONTENT | 1,602 | 498 | 676 | 1,174 | 994 | 6,439 |
| 3 | GOOGLE_BUSINESS_DESCRIPTION | 1,235 | 499 | 381 | 880 | 993 | 5,463 |
| 4 | SOCIAL_MEDIA_BIO | 1,229 | 507 | 494 | 1,001 | 992 | 4,680 |
| 5 | FAQ | 1,831 | 551 | 791 | 1,342 | 991 | 3,798 |

Resultado: **5/5 assets generados correctamente.**

### 5.4 Generación 3

| # | Asset | Latency (ms) | Input tokens | Output tokens | Total tokens | Remaining req | Remaining tok |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 | BUSINESS_SUMMARY | 1,397 | 501 | 506 | 1,007 | 991 | 6,942 |
| 2 | WEBSITE_CONTENT | 1,462 | 501 | 618 | 1,119 | 990 | 6,661 |
| 3 | GOOGLE_BUSINESS_DESCRIPTION | 959 | 502 | 339 | 841 | 989 | 5,687 |
| 4 | SOCIAL_MEDIA_BIO | 1,112 | 510 | 292 | 802 | 988 | 4,491 |
| 5 | FAQ | 1,894 | 554 | 793 | 1,347 | 987 | 4,291 |

Resultado: **5/5 assets generados correctamente.**

---

## 6. Resultados cuantitativos

### 6.1 Totales del experimento

| Métrica | Valor |
|---|---|
| Total de llamadas | 15 |
| Llamadas exitosas | 15 |
| Tasa de éxito | 100% |
| Errores del proveedor | 0 |
| HTTP 429 | 0 |

### 6.2 Tokens

| Métrica | Valor |
|---|---|
| Input tokens totales | 7,674 |
| Output tokens totales | 7,388 |
| Total tokens | 15,062 |
| Media input tokens/llamada | 511.6 |
| Media output tokens/llamada | 492.5 |
| Media total tokens/llamada | 1,004.1 |

### 6.3 Latencia

| Métrica | Valor |
|---|---|
| Latencia mínima | 959 ms |
| Latencia máxima | 1,894 ms |
| Latencia media | 1,348 ms |
| Rango | 935 ms |

### 6.4 Latencia por generación

| Generación | Latencia media (ms) |
|---|---|
| Generación 1 | 1,301 |
| Generación 2 | 1,405 |
| Generación 3 | 1,365 |

### 6.5 Tokens por tipo de asset

| Asset | Media input | Media output | Media total |
|---|---|---|---|
| BUSINESS_SUMMARY | 499 | 424 | 923 |
| WEBSITE_CONTENT | 499 | 539 | 1,038 |
| GOOGLE_BUSINESS_DESCRIPTION | 500 | 398 | 898 |
| SOCIAL_MEDIA_BIO | 508 | 352 | 860 |
| FAQ | 552 | 751 | 1,303 |

### 6.6 Nota sobre cálculos

Las medias se calculan exclusivamente a partir de los 15 datos observados. No constituyen una caracterización estadística del proveedor ni deben extrapolarse a otras condiciones de uso, modelos o periodos temporales.

---

## 7. Rate limits observados

### 7.1 Headers registrados

Los headers `x-ratelimit-remaining-requests` y `x-ratelimit-remaining-tokens` fueron capturados correctamente en las 15 llamadas.

**Remaining requests (inicio → fin):**

| Generación | Inicio | Fin | Consumo |
|---|---|---|---:|
| 1 | 999 | 995 | 4 |
| 2 | 995 | 991 | 4 |
| 3 | 991 | 987 | 4 |

**Remaining tokens (inicio → fin):**

| Generación | Inicio (tok) | Fin (tok) | Consumo (tok) |
|---|---|---|---:|
| 1 | 7,203 | 4,382 | 2,821 |
| 2 | 7,232 | 3,798 | 3,434 |
| 3 | 6,942 | 4,291 | 2,651 |

### 7.2 Interpretación

Los headers de rate limit representan el estado de la ventana de rate del proveedor al momento de cada llamada. Los valores de `remaining-*` son snapshots del estado reportado por Groq y no deben interpretarse como una garantía de capacidad diaria. Las ventanas de reset, la política de counting y las condiciones de cuenta pueden variar.

---

## 8. Incidencia observada durante la validación

Durante una de las generaciones, el frontend mostró:

```
AI generation failed for SOCIAL_MEDIA_BIO
```

y el navegador registró:

```
POST /api/v1/assets/generate-digital-presence
404
```

Los logs de Render correspondientes a esa generación muestran las cinco llamadas Groq como:

```
Groq call OK
```

También apareció durante ese intervalo:

```
==> Detected service running on port 10000
```

posteriormente se inició otra instancia/periodo de ejecución.

### Análisis

El análisis read-only del código concluyó que:

- Los errores HTTP 404 conocidos del backend corresponden a comprobaciones previas de recursos/ownership (`Business not found`, `Business profile not found`, `Asset not found`), todas ejecutadas **antes** de las llamadas al proveedor LLM.
- No se identificó en el código una ruta que produzca HTTP 404 **después** de que las cinco llamadas al LLM hayan sido exitosas.
- Existe una correlación temporal entre el 404 observado y el reinicio/detección de la instancia de Render (`Detected service running on port 10000`).
- Se considera la explicación más probable que el reinicio de infraestructura durante la transacción de persistencia causó la pérdida de la conexión HTTP, resultando en un error reportado por el load balancer.

### Conclusión de la incidencia

Esta incidencia **no constituye un fallo del proveedor Groq**, ya que las llamadas al proveedor asociadas a la generación aparecen como exitosas en los logs. Es una incidencia de infraestructura (Render deployment lifecycle) independiente de la integración con Groq.

---

## 9. Comparación contextual con OpenRouter

### OpenRouter (proveedor previo)

- Utilizado inicialmente como proveedor externo del pipeline de generación.
- Se observó HTTP 429 con el mensaje: `Rate limit exceeded: free-models-per-day`.
- Headers: `X-RateLimit-Limit: 50`, `X-RateLimit-Remaining: 0`.
- Esto impidió continuar utilizando de forma fiable el modelo gratuito seleccionado.

### Groq (proveedor experimental)

- Integración mediante gateway independiente (`GroqLlmGateway`).
- Endpoint específico: `https://api.groq.com/openai/v1`.
- 15 llamadas reales observadas en producción.
- 15/15 llamadas exitosas (`Groq call OK`).
- Instrumentación de tokens, latencia y rate limits.
- Sin errores del proveedor durante las tres generaciones.
- Structured output con JSON Schema strict mode.

### Contexto comparativo

En el escenario experimental realizado, Groq permitió completar las generaciones observadas sin reproducir el agotamiento de cuota que había afectado al proveedor gratuito utilizado previamente. Esta comparación es descriptiva del experimento específico y no debe interpretarse como una valoración general de los proveedores.

---

## 10. Limitaciones del experimento

1. El experimento se realizó con un único modelo: `openai/gpt-oss-120b`.

2. Se utilizaron únicamente 3 generaciones completas / 15 llamadas al proveedor.

3. No constituye una caracterización estadística exhaustiva del proveedor Groq.

4. Las métricas de latencia corresponden a las llamadas observadas desde el backend y no deben interpretarse automáticamente como latencia extremo a extremo percibida por el usuario.

5. Los límites de rate limit observados son snapshots de los headers del proveedor y pueden depender de ventanas temporales y condiciones de cuenta específicas de la cuenta utilizada.

6. No se evaluó coste económico porque el objetivo era validar la integración y el comportamiento operativo del proveedor en tier gratuito.

7. La evaluación cualitativa del contenido generado no se incluye en este documento y no debe presentarse como una comparación estadísticamente significativa.

8. La incidencia 404 observada no se puede atribuir con certeza causal absoluta a Render únicamente a partir de los logs disponibles; se considera la explicación más probable basada en la evidencia temporal.

---

## 11. Conclusión

La integración experimental de Groq como proveedor LLM queda **validada bajo las condiciones y alcance descritos** en este documento.

Se ha demostrado:

| Aspecto | Estado |
|---|---|
| Gateway Groq implementado | Completado |
| Integración seleccionable mediante `LLM_PROVIDER=groq` | Completado |
| Tests automatizados (18 unitarios) | Todos pasan |
| Structured output (JSON Schema strict) | Funcional en producción |
| Token usage real del proveedor | Capturado en las 15 llamadas |
| Rate-limit instrumentation | Funcional, headers capturados |
| Latency instrumentation | Funcional, medidas con `performance.now()` |
| Manejo de errores | Clasificación y mapeo completados |
| Generación real en producción (Render) | 3 generaciones, 15/15 llamadas exitosas |
| Generación de los 5 tipos de asset | BUSINESS_SUMMARY, WEBSITE_CONTENT, GOOGLE_BUSINESS_DESCRIPTION, SOCIAL_MEDIA_BIO, FAQ |

El experimento confirma que la implementación actual del pipeline de generación de Digital Presence puede ejecutarse correctamente utilizando Groq como proveedor, con observabilidad completa de tokens, latencia y rate limits, y sin errores del proveedor durante las generaciones observadas.
