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
8. Comparativa Mock vs LLM real (Hito 3.3)

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

## 8. Comparativa Mock vs LLM real (Hito 3.3)

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

## Pendiente de documentar en iteraciones posteriores

No se han documentado prompts de CI/CD, deployment, UX/UI, accesibilidad ni E2E desplegado porque no se han implementado en esta iteración.
