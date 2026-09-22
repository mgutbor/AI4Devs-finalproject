# Prompts utilizados — Entrega 3

> Este documento registra únicamente los prompts utilizados durante la primera iteración de implementación de la Fase 3. La iteración se limita al gateway LLM real, la configuración, la validación básica, la resiliencia inicial y sus tests. CI/CD, deployment y rediseño UX/UI quedan fuera de esta iteración.

## Índice

1. Auditoría de la línea base
2. Evaluación de proveedores LLM
3. Diseño del gateway y selección mock/real
4. Prompting estructurado y grounding
5. Validación de outputs
6. Resiliencia y errores del proveedor
7. Testing de la integración

---

## 1. Auditoría de la línea base

**Prompt utilizado: revisión previa de la arquitectura existente**

> Lee completamente `docs/FASE3-IMPLEMENTATION-CONTRACT.md`. Revisa la arquitectura actual de `backend/src/ai-generation/`, cómo `AssetsService` consume `AIGenerationService`, `MockLlmGateway`, los tests de generación, las variables de entorno y el estado Git. Mantén la arquitectura existente, no elimines el mock, no envíes `DiscoveryResponses` directamente al LLM y no modifiques endpoints públicos sin justificación.

**Resultado:** Se confirmó que `LLMGateway`, `ContextBuilder`, `PromptBuilder`, `OutputValidator`, `MockLlmGateway` y `AIGenerationService` ya formaban el pipeline base. La implementación nueva se limitó a añadir un gateway real, selección por configuración, validación adicional y tests.

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

## Pendiente de documentar en iteraciones posteriores

No se han documentado prompts de CI/CD, deployment, UX/UI, accesibilidad ni E2E desplegado porque no se han implementado en esta iteración.
