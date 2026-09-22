# Hito 3.3 — Comparativa entre Mock y LLM real

**Proyecto:** AI Business Presence Builder  
**Fase:** 3 / Entrega final  
**Hito:** 3.3 — Comparativa técnica y funcional entre generación Mock y generación mediante LLM real  
**Fecha:** 2026-09-22  
**Estado:** Evidencia experimental completa

---

## 1. Objetivo

El Hito 3.3 tiene como objetivo documentar y evaluar las diferencias observables entre dos implementaciones del mismo contrato `LLMGateway`:

- `MockLlmGateway`: implementación determinista basada en plantillas, sin dependencias externas.
- `OpenRouterLlmGateway`: implementación real que invoca un modelo de lenguaje a través de la API de OpenRouter.

Ambos gateways generan los mismos cinco tipos de asset utilizando el mismo `BusinessProfile`, el mismo contexto canónico (`BusinessProfileContext`), los mismos prompts (`promptVersion=v2`) y las mismas validaciones de salida (`OutputValidator`). La única variable experimental es el gateway utilizado.

La comparativa no pretende establecer un ranking ni determinar un gateway superior. Su finalidad es producir evidencia técnica y cualitativa que permita documentar, de forma trazable, las diferencias observables entre ambas aproximaciones dentro del alcance de este proyecto.

---

## 2. Alcance y condiciones experimentales

### 2.1. BusinessProfile utilizado

| Campo | Valor |
|---|---|
| businessName | Café Central Madrid |
| category | Cafetería |
| location | Madrid, Spain |
| services | Coffee, brunch, catering |
| products | Specialty coffee, pastries, sandwiches |
| targetAudience | People from the surrounding neighborhood, remote workers and visitors looking for quality coffee and brunch. |
| tone | Friendly and welcoming |
| style | Modern, local and approachable |
| phone | null |
| website | null |
| gdprConsent | true |
| status | APPROVED |

### 2.2. Condiciones de igualdad

| Condición | Detalle |
|---|---|
| BusinessProfile | Mismos datos canónicos en ambas ejecuciones |
| ContextBuilder | Misma implementación, mismo `contextVersion=v1` |
| PromptBuilder | Misma implementación, mismo `promptVersion=v2` |
| OutputValidator | Misma implementación, mismas reglas de validación |
| Tipos de asset | Los mismos cinco: `BUSINESS_SUMMARY`, `WEBSITE_CONTENT`, `GOOGLE_BUSINESS_DESCRIPTION`, `SOCIAL_MEDIA_BIO`, `FAQ` |
| Pipeline | Mismo flujo: `ContextBuilder → PromptBuilder → LLMGateway → validateGenerationOutput → Asset/AIGeneration` |

### 2.3. Configuración del LLM real

| Parámetro | Valor |
|---|---|
| Provider | OpenRouter |
| Model | `liquid/lfm-2.5-2.6b:free` |
| Temperature | 0.2 |
| Max tokens | 2000 |
| Max retries | 0 |
| Response format | `json_object` |
| Timeout | 15000 ms (configurable) |

### 2.4. Configuración del Mock

| Parámetro | Valor |
|---|---|
| Model used | `mock-deterministic-v1` |
| Temperature | 0.2 (`AI_MOCK_TEMPERATURE`) |
| Determinismo | 100% — basado en plantillas de string |
| Dependencias externas | Ninguna |

### 2.5. Separación de ejecuciones

- **Ejecución Real (Hito 3.2):** 2026-09-22, BusinessProfile `3250c158-cfe3-4726-baa1-494f02c4b746`.
- **Ejecución Mock (Hito 3.3):** 2026-09-22, BusinessProfile `0aa11ec6-c6e4-44f8-8009-1aa47fa8040c` (mismos datos canónicos, ID distinto por aislamiento de ownership).

Los Assets generados por cada ejecución están asociados a BusinessProfiles distintos. Los Assets originales del LLM real no fueron modificados ni sobreescritos por la ejecución Mock.

---

## 3. Metodología

### 3.1. Pipeline de generación

```text
BusinessProfile (APPROVED)
        │
        ▼
ContextBuilder.build(profile)
        │
        ▼
BusinessProfileContext
        │
        ▼
PromptBuilder.build(assetType, context)
        │
        ▼
prompt string (v2)
        │
        ▼
LLMGateway.complete({assetType, prompt, context})
        │
        ├── MockLlmGateway        → respuesta basada en plantilla
        └── OpenRouterLlmGateway  → respuesta del modelo LLM
        │
        ▼
validateGenerationOutput(assetType, response, context)
        │
        ▼
Asset (upsert) + AIGeneration (create)
```

### 3.2. Diseño experimental

El experimento compara dos implementaciones del contrato `LLMGateway`, que define un único método:

```typescript
complete(request: LlmRequest): Promise<LlmResponse>
```

Ambas implementaciones reciben el mismo `LlmRequest` (assetType, prompt, context) y deben devolver un `LlmResponse` (title, content, tokensUsed, modelUsed, temperature). El servicio de orquestación (`AiGenerationService`) y las validaciones (`OutputValidator`) son idénticos para ambos gateways.

La comparativa se realiza a nivel de outputs persistentes en PostgreSQL, no a nivel de código.

### 3.3. Evaluación cualitativa

La evaluación cualitativa de los 10 outputs fue realizada por un modelo de lenguaje (MiMo v2.5) siguiendo criterios predefinidos:

- **Grounding:** Adecuado / Parcial / Problemático
- **Coherencia:** Adecuada / Mejorable / Problemática
- **Utilidad:** Alta / Media / Baja
- **Tono:** Adecuado / Parcialmente adecuado / Inadecuado

La evaluación es cualitativa, no cuantitativa. No constituye una métrica objetiva de calidad ni una evaluación humana independiente.

---

## 4. Resultados cuantitativos

### 4.1. Resumen comparativo

| Métrica | Mock | Real |
|---|---|---|
| Generaciones ejecutadas | 5 | 5 |
| Generaciones SUCCEEDED | 5 | 5 |
| Generaciones FAILED | 0 | 0 |
| Tasa de éxito | 100% | 100% |
| Validaciones fallidas | 0 | 0 |
| Assets creados | 5 | 5 |
| Asset status | READY_FOR_REVIEW | READY_FOR_REVIEW |
| Tokens totales | 189 | 5.129 |
| Tokens medios por asset | 37,8 | 1.025,8 |
| Longitud total (title + content) | 1.417 caracteres | 2.223 caracteres |
| Longitud media por asset | 283,4 caracteres | 444,6 caracteres |

### 4.2. Longitud por asset (title + content, en caracteres)

| Asset | Mock | Real |
|---|---:|---:|
| BUSINESS_SUMMARY | 287 | 442 |
| WEBSITE_CONTENT | 346 | 368 |
| GOOGLE_BUSINESS_DESCRIPTION | 298 | 467 |
| SOCIAL_MEDIA_BIO | 244 | 264 |
| FAQ | 242 | 682 |

### 4.3. Latencia

La latencia HTTP del proveedor no fue instrumentada en esta ejecución. Los campos `createdAt` y `completedAt` de `AIGeneration` registran timestamps de la transacción de persistencia en PostgreSQL, no la duración de la llamada al proveedor LLM. Por tanto, la latencia no se utiliza como métrica comparativa en este experimento.

### 4.4. Trazabilidad

Ambas ejecuciones registraron en `AIGeneration` los siguientes campos de trazabilidad:

| Campo | Mock | Real |
|---|---|---|
| promptVersion | v2 | v2 |
| contextVersion | v1 | v1 |
| modelUsed | mock-deterministic-v1 | liquid/lfm-2.5-2.6b:free |
| temperature | 0.2 | 0.2 |
| promptSnapshot | Completo | Completo |
| contextSnapshot | Completo | Completo |
| responseSnapshot | Completo (con modelUsed, temperature) | Completo (con modelUsed, temperature) |

---

## 5. Resultados cualitativos

### 5.1. Evaluación asistida por LLM

**Evaluador:** MiMo v2.5 (modelo de lenguaje)  
**Fecha:** 2026-09-22  
**Outputs evaluados:** 10 (5 Mock + 5 Real)  
**Ejecuciones del evaluador:** 1  
**Naturaleza:** Evaluación cualitativa, no humana

La evaluación cualitativa no constituye una métrica objetiva de calidad. No debe utilizarse para establecer rankings, declarar un ganador o afirmar la superioridad general de un gateway frente a otro.

### 5.2. Matriz de evaluación

| # | Asset | Gateway | Grounding | Coherencia | Utilidad | Tono | Justificación |
|---|---|---|---|---|---|---|---|
| 1 | BUSINESS_SUMMARY | Mock | Adecuado | Adecuada | Media | Parcialmente adecuado | Utiliza nombre, categoría, ubicación, servicios, productos, audiencia y tono del perfil sin introducir datos externos. La estructura es una concatenación literal de campos: "It offers Coffee, brunch, catering, Specialty coffee, pastries, sandwiches for People from..." no funciona como resumen natural. El tono del texto es neutro-descriptivo, no refleja "friendly and welcoming". |
| 2 | BUSINESS_SUMMARY | Real | Adecuado | Adecuada | Alta | Adecuado | Integra todos los campos del perfil en oraciones con sentido propio. Reformula "targetAudience" como "its target audience of people from..." (paráfrasis razonable). Menciona tono y estilo del perfil de forma integrada. No introduce datos factuales nuevos. El tono del texto resultante es cálido y profesional, consistente con "friendly and welcoming". |
| 3 | WEBSITE_CONTENT | Mock | Adecuado | Adecuada | Baja | Parcialmente adecuado | Genera la misma estructura que BUSINESS_SUMMARY con un salto de línea y "Style:" añadido. No hay diferenciación real entre tipos de asset. No produce contenido con formato de página web (sin headings reales, sin secciones). El tono es neutro. |
| 4 | WEBSITE_CONTENT | Real | Parcial | Adecuada | Alta | Adecuado | Genera contenido con estructura de homepage: "Welcome" implícito, párrafos orientados a visitantes. Introduce "hearty sandwiches" (el perfil dice "sandwiches"; "hearty" es un adjetivo cualitativo no proporcionado) y "your neighborhood favorite" (interpretación de targetAudience que implica reputación no establecida). Ambas son paráfrasis con embellishment, no invenciones factuales. Omite "catering". Tono friendly. |
| 5 | GOOGLE_BUSINESS_DESCRIPTION | Mock | Adecuado | Adecuada | Media | Parcialmente adecuado | Genera exactamente el mismo contenido que BUSINESS_SUMMARY. No adapta el output al contexto de "ficha de directorio local". La información es correcta pero no diferenciada por tipo de asset. Tono neutro. |
| 6 | GOOGLE_BUSINESS_DESCRIPTION | Real | Parcial | Adecuada | Alta | Adecuado | Adapta al formato de directorio: "locally beloved cafetería", "contemporary, local feel". Introduce "locally beloved" (afirmación de reputación no presente en el perfil) y "excellent coffee" (el perfil dice "quality coffee"; "excellent" es una intensificación subjetiva). Ambas son valoraciones subjetivas añadidas, no datos factuales concretos. Mantiene la información canónica esencial. Tono friendly. |
| 7 | SOCIAL_MEDIA_BIO | Mock | Adecuado | Adecuada | Media | Parcialmente adecuado | Estructura pipe-separated con todos los datos del perfil: nombre, categoría, ubicación, servicios, productos, audiencia. No reformula: lista los elementos como un catálogo. Omite tono y estilo. Funciona como bio, pero el formato es más un listado que una biografía. |
| 8 | SOCIAL_MEDIA_BIO | Real | Adecuado | Adecuada | Alta | Adecuado | Bio concisa que integra identidad, ubicación, servicios, audiencia y estilo ("approachable vibe"). Omite "catering" (uno de los tres servicios). Utiliza vocabulario adaptado a redes sociales. Tono friendly y natural. |
| 9 | FAQ | Mock | Adecuado | Adecuada | Media | Adecuado | Solo 2 preguntas genéricas: "What does X offer?" y "Who is it for?". Las respuestas son listados literales de servicios/productos y copia textual de targetAudience. No genera preguntas que un usuario real podría hacer. Formato Q:/A: correcto. Tono neutro. |
| 10 | FAQ | Real | Parcial | Adecuada | Alta | Adecuado | 5 preguntas diferenciadas: café, brunch, catering, clientes, atmosfera. Introduce "a variety of brews to suit different tastes" (generalización de "specialty coffee") y "for events and gatherings" (ampliación de "catering"). Ambas son ampliaciones razonables en contexto de FAQ, no invenciones factuales. Formato Q:/A: correcto. Tono friendly. |

---

## 6. Observaciones por tipo de asset

### BUSINESS_SUMMARY

El Mock genera un texto con estructura de plantilla: `"X is a Y in Z. It offers A for D. Tone: E."` No hay reformulación; cada campo del perfil aparece como un fragmento concatenado. El Real reestructura la misma información en oraciones naturales con sujeto, verbo y complementos contextuales. El Real menciona tono y estilo de forma integrada en el texto; el Mock los inserta como etiquetas separadas ("Tone: Friendly and welcoming."). Ambos cubren la totalidad de los datos canónicos.

### WEBSITE_CONTENT

El Mock produce una estructura idéntica a BUSINESS_SUMMARY con un salto de línea y "Style:" añadido. No hay adaptación al formato de contenido web. El Real genera un texto con estructura de homepage: un "Welcome" de apertura, párrafos orientados a visitantes y vocabulario de presentación del negocio. El Real omite "catering" de los servicios. El Mock incluye la totalidad de servicios y productos pero como listado literal sin formato web.

### GOOGLE_BUSINESS_DESCRIPTION

El Mock genera un output textualmente idéntico a BUSINESS_SUMMARY, sin adaptación al contexto de directorio local. El Real adapta el contenido: "modern, locally beloved cafetería", "contemporary, local feel". El Real introduce dos valoraciones subjetivas ("locally beloved", "excellent coffee") no presentes en el perfil. El Mock no introduce valoraciones porque no reformula el contenido.

### SOCIAL_MEDIA_BIO

El Mock usa un formato pipe-separated que incluye todos los campos del perfil como un registro estructurado. El Real genera una bio con estructura natural: identidad + ubicación + servicios + audiencia + estilo. El Real omite "catering"; el Mock incluye la totalidad de servicios pero como listado literal. El vocabulario del Real es más adecuado para el contexto de redes sociales ("approachable vibe", "designed for").

### FAQ

El Mock genera 2 preguntas genéricas que cubren "qué ofrece" y "para quién", con respuestas que son copias literales de los campos del perfil. El LLM genera 5 preguntas diferenciadas que cubren aspectos específicos del negocio (café, brunch, catering, clientes, atmosfera). El Real amplía ligeramente la información en las respuestas ("variety of brews", "events and gatherings"). El Mock es correcto pero insuficiente como FAQ real; el Real es funcional como punto de partida para un usuario.

---

## 7. Grounding y ampliaciones semánticas

### 7.1. Afirmaciones no directamente presentes en el BusinessProfile

La siguiente tabla documenta las expresiones del LLM real que introducen información no explícita en el BusinessProfile:

| # | Asset | Expresión | Categoría | Explicación |
|---|---|---|---|---|
| 1 | WEBSITE_CONTENT | "hearty sandwiches" | Embellishment | El perfil dice "sandwiches". "Hearty" es un adjetivo cualitativo no proporcionado. No constituye una invención factual, pero sí una embellishment. |
| 2 | WEBSITE_CONTENT | "your neighborhood favorite" | Paráfrasis con implicación | Reformula "People from the surrounding neighborhood" como "neighborhood favorite". Implica una reputación no establecida en el perfil, pero es una reformulación publicitaria esperable en contenido web. |
| 3 | GOOGLE_BUSINESS_DESCRIPTION | "locally beloved" | Afirmación de reputación | El perfil no indica que el café sea "beloved" (querido/apreciado). Es una afirmación de reputación no respaldada por el perfil. |
| 4 | GOOGLE_BUSINESS_DESCRIPTION | "excellent coffee" | Intensificación subjetiva | El perfil dice "quality coffee". "Excellent" es una intensificación subjetiva no proporcionada. |
| 5 | FAQ | "a variety of brews to suit different tastes" | Generalización | El perfil dice "specialty coffee". "Variety of brews" es una generalización razonable en contexto de FAQ, pero añade información no específica. |
| 6 | FAQ | "for events and gatherings" | Ampliación razonable | El perfil dice "catering". "Events and gatherings" es una interpretación del contexto de catering. Consistente pero ampliada. |

### 7.2. Clasificación de las ampliaciones

- **Paráfrasis razonable:** ítems 2, 6 — reformulan o amplían información del perfil de forma consistente con el contexto del asset.
- **Embellishment o intensificación:** ítems 1, 4, 5 — introducen adjetivos o generalizaciones que embellecen pero no alteran el sentido factual.
- **Afirmación de reputación no soportada:** ítem 3 — "locally beloved" es una afirmación sobre la percepción del negocio que no está respaldada por el perfil.

### 7.3. Implicación para guardrails

Una mayor capacidad de reformulación lingüística puede introducir información no explícita en el contexto canónico. Esto no constituye necesariamente un error factual, pero requiere que el pipeline de validación disponga de guardrails adecuados para detectar afirmaciones que excedan el perfil. El `OutputValidator` actual valida grounding mínimo (presencia de al menos un anchor canónico), pero no valida la ausencia de ampliaciones semánticas.

---

## 8. Reproducibilidad y determinismo

### 8.1. Mock: determinismo verificado

El `MockLlmGateway` es determinista. Dado el mismo `BusinessProfileContext`, produce exactamente el mismo output sin importar el `promptVersion`. Esto se verificó comparando:

- 5 outputs Mock con `promptVersion=v1` (ejecución histórica, 2026-09-03)
- 5 outputs Mock con `promptVersion=v2` (ejecución actual, 2026-09-22)

Los `title`, `content` y `tokensUsed` son idénticos en las 10 ejecuciones comparadas (5 × 2).

### 8.2. Real: no determinismo

El `OpenRouterLlmGateway` no es determinista. Un modelo de lenguaje con `temperature > 0` puede producir outputs diferentes para el mismo input. No se asume ni se documenta determinismo del LLM real. Los outputs del Hito 3.2 corresponden a una ejecución concreta y no deben generalizarse como representativos de todas las ejecuciones posibles del mismo modelo.

### 8.3. Implicación para testing

El `MockLlmGateway` sigue siendo la implementación preferida para tests automatizados, CI y desarrollo local, tal como establece el contrato de Fase 3 (sección 2.6). El LLM real se reserva para generación en entorno de aplicación, no para tests.

---

## 9. Limitaciones

1. **Un único BusinessProfile:** Los resultados corresponden a un único perfil de negocio ("Café Central Madrid", categoría "Cafetería"). No permiten generalizar el comportamiento de los gateways para otros tipos de negocio, categorías o longitudes de perfil.

2. **Una única ejecución comparativa:** Cada gateway fue ejecutado una única vez con el BusinessProfile de referencia. No se realizan múltiples ejecuciones para estimar variabilidad.

3. **Cinco tipos de asset:** Los resultados cubren los cinco tipos de asset definidos en el MVP. No se evalúan tipos de asset adicionales.

4. **Un único modelo LLM:** Los resultados corresponden al modelo `liquid/lfm-2.5-2.6b:free` de OpenRouter. Un modelo diferente podría producir resultados cualitativamente distintos.

5. **Evaluación cualitativa asistida por LLM:** La evaluación fue realizada por un modelo de lenguaje (MiMo v2.5), no por un evaluador humano independiente. Las valoraciones son cualitativas y subjetivas.

6. **Ausencia de evaluación humana:** No se realizó una revisión humana de los outputs como parte de este experimento. La matriz de evaluación cualitativa está preparada para recepcionar una revisión humana posterior.

7. **Ausencia de métrica instrumental de latencia:** La latencia del proveedor LLM no fue instrumentada. Los timestamps de `AIGeneration` no representan la duración de la llamada HTTP.

8. **Posible variabilidad del proveedor externo:** El modelo gratuito `liquid/lfm-2.5-2.6b:free` es proporcionado por OpenRouter y su disponibilidad, límites y comportamiento pueden cambiar sin previo aviso.

9. **Las categorías cualitativas no son métrica objetiva:** Las categorías "Adecuado", "Parcial", "Alta", etc. son juicios cualitativos, no mediciones objetivas. No deben convertirse en puntuaciones numéricas ni utilizarse para inferir calidad general.

10. **No permite generalizar estadísticamente:** Con n=1 por gateway y un único BusinessProfile, los resultados son descriptivos, no estadísticamente significativos.

---

## 10. Conclusión

La sustitución del gateway Mock por el gateway LLM real no requiere modificar el pipeline de generación ni el contrato de persistencia. Ambos gateways procesan el mismo contexto canónico y atraviesan las mismas etapas de validación y persistencia.

La ejecución analizada muestra diferencias observables en las siguientes dimensiones:

- **Determinismo:** El Mock es determinista y reproducible; el LLM real depende del modelo, la temperatura y la ejecución.
- **Consumo de tokens:** El Mock utiliza 189 tokens totales (37,8 de media); el LLM real utiliza 5.129 tokens totales (1.025,8 de media).
- **Extensión de las salidas:** El Mock produce 1.417 caracteres totales (283,4 de media); el LLM real produce 2.223 caracteres totales (444,6 de media).
- **Reformulación y adaptación:** El Mock concatena literalmente los campos del perfil sin adaptar al tipo de asset; el LLM real reformula y adapta el contenido al contexto de cada asset, con mayor naturalidad lingüística.
- **Grounding:** El Mock mantiene un grounding estricto al contenido literal del perfil; el LLM real presenta pequeñas ampliaciones semánticas (embellishments, intensificaciones, generalizaciones) que deben ser controladas mediante guardrails de validación.

Ambos gateways alcanzan una tasa de éxito del 100% y pasan todas las validaciones del `OutputValidator`. La elección entre uno u otro depende de los requisitos de cada contexto de uso: determinismo y reproducibilidad (tests, CI) frente a naturalidad y adaptación (generación para usuarios finales).

---

## Referencias internas

- Contrato de Fase 3: [`docs/FASE3-IMPLEMENTATION-CONTRACT.md`](FASE3-IMPLEMENTATION-CONTRACT.md)
- Prompts de Entrega 3: [`docs/prompts-entrega-3.md`](prompts-entrega-3.md)
- Implementación del pipeline: `backend/src/ai-generation/`
- Configuración LLM: `.env.example`
