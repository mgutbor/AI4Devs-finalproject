# Fase 3 — Implementation Contract

**Proyecto:** AI Business Presence Builder  
**Fase:** Entrega 3 / Final Project  
**Rama objetivo:** `finalproject-MGB`  
**Estado:** Contracto de implementación  
**Propósito:** Guiar la evolución controlada del MVP de Entrega 2 hacia una versión final funcional, verificable, desplegable y documentada.

---

## 0. Propósito del contrato

Este documento establece el **contrato técnico de implementación de la Fase 3** del proyecto *AI Business Presence Builder*.

Su finalidad es transformar el resultado de la auditoría técnica de la Entrega 2 en un conjunto explícito de:

- objetivos;
- restricciones arquitectónicas;
- decisiones técnicas;
- criterios de aceptación;
- límites de alcance;
- requisitos de calidad;
- evidencias verificables;
- puntos de revisión humana.

La Fase 3 no constituye una reconstrucción del producto ni una redefinición del MVP.

Su objetivo es **evolucionar de forma incremental la implementación existente**, cerrando las principales brechas detectadas en la auditoría de Entrega 2 y completando los elementos necesarios para disponer de un producto final funcional con:

1. generación mediante un LLM real;
2. validación y grounding de los outputs;
3. resiliencia frente a fallos del proveedor;
4. controles básicos de seguridad, privacidad y coste;
5. testing reproducible;
6. CI/CD;
7. despliegue;
8. validación E2E en entorno desplegado;
9. documentación técnica y trazabilidad del uso de IA;
10. evidencia suficiente para la evaluación final del proyecto.

La regla fundamental de esta fase es:

> **La Fase 3 debe evolucionar el MVP de Entrega 2 sin redefinir innecesariamente su dominio, arquitectura o alcance funcional.**

Cualquier desviación relevante deberá estar técnicamente justificada y ser revisada antes de incorporarse.

---

# 1. Contexto y estado de partida

## 1.1. Producto

AI Business Presence Builder tiene como objetivo ayudar a pequeñas empresas y profesionales a transformar información estructurada de su negocio en una presencia digital coherente mediante generación asistida por IA.

El flujo funcional principal del MVP es:

```text
Registro / Login
      ↓
Creación de negocio
      ↓
Discovery estructurado
      ↓
Normalización
      ↓
BusinessProfile
      ↓
Revisión y aprobación humana
      ↓
Generación de assets
      ↓
Revisión / edición
      ↓
Regeneración
```

Los assets actualmente contemplados son:

- `BUSINESS_SUMMARY`
- `WEBSITE_CONTENT`
- `GOOGLE_BUSINESS_DESCRIPTION`
- `SOCIAL_MEDIA_BIO`
- `FAQ`

---

## 1.2. Arquitectura de partida

La implementación de Entrega 2 utiliza:

- **Backend:** NestJS + TypeScript
- **Frontend:** React + TypeScript + Vite
- **Persistencia:** PostgreSQL
- **ORM:** Prisma
- **Autenticación:** JWT
- **Hashing de contraseñas:** bcrypt
- **Arquitectura:** modular monolith
- **Generación AI:** abstracción `LLMGateway`
- **Proveedor actual:** implementación mock determinista
- **Persistencia de generación:** `AIGeneration`

La arquitectura lógica de generación es:

```text
DiscoveryResponses
        │
        ▼
BusinessProfile
        │
        ▼
ContextBuilder
        │
        ▼
PromptBuilder
        │
        ▼
LLMGateway
        │
        ▼
OutputValidator
        │
        ▼
Asset / AIGeneration
```

Esta separación deberá mantenerse durante la Fase 3.

---

# 2. Principios rectores

Toda implementación realizada durante la Fase 3 deberá respetar los siguientes principios.

## 2.1. Evolución incremental

Se priorizarán cambios pequeños, trazables y justificables frente a refactorizaciones amplias.

No se considera objetivo de esta fase rediseñar el sistema desde cero.

---

## 2.2. Preservación del dominio

El modelo conceptual de Entrega 2 constituye el baseline del dominio.

No deberán introducirse nuevas entidades, agregados o conceptos de dominio salvo que exista una necesidad técnica o funcional claramente justificada.

---

## 2.3. Separación entre dominio y proveedor LLM

El dominio no deberá depender directamente de:

- OpenAI;
- Gemini;
- Claude;
- Groq;
- Ollama;
- cualquier otro proveedor concreto.

La integración deberá realizarse mediante la abstracción existente:

```text
LLMGateway
```

El proveedor concreto será un detalle de infraestructura.

---

## 2.4. BusinessProfile como fuente canónica

La regla central de grounding del producto es:

> **El `BusinessProfile` aprobado es la única fuente canónica de contexto para la generación de assets.**

El flujo permitido es:

```text
DiscoveryResponses
        ↓
normalización
        ↓
BusinessProfile
        ↓
human approval
        ↓
AI generation
```

No se deberá implementar:

```text
DiscoveryResponses
        ↓
LLM
```

de forma directa.

La IA no debe recibir como contexto de generación información que no haya pasado previamente por el modelo canónico del negocio.

---

## 2.5. Human-in-the-loop

La IA genera propuestas.

La persona usuaria conserva el control sobre:

- aprobación del perfil;
- revisión de resultados;
- edición;
- regeneración.

La Fase 3 no deberá convertir la generación en una operación irreversible o completamente autónoma.

---

## 2.6. Determinismo donde sea necesario

Las pruebas automatizadas no deberán depender de un proveedor LLM externo.

El `MockLLMGateway` deberá mantenerse disponible para:

- unit tests;
- integration tests;
- CI;
- desarrollo local;
- escenarios de error;
- pruebas deterministas.

---

## 2.7. Evidencia antes que afirmaciones

No se considerará que una capacidad está validada únicamente porque:

- existe código;
- existe un test;
- existe documentación;
- existe una ruta API.

Deberá distinguirse entre:

```text
Implementado
      ≠
Testeado
      ≠
Ejecutado
      ≠
Validado E2E
      ≠
Validado en producción
```

La documentación final deberá reflejar esta distinción.

---

# 3. Objetivos de la Fase 3

Los objetivos principales son:

### O1 — Reproducibilidad

Conseguir que el proyecto pueda instalarse, configurarse, migrarse, testearse y construirse de forma reproducible.

### O2 — LLM real

Sustituir el mock por una integración real con un proveedor LLM gratuito o con free tier compatible con el alcance del proyecto.

### O3 — Abstracción

Mantener `LLMGateway` como frontera entre dominio y proveedor.

### O4 — Calidad de generación

Mejorar el contrato de salida, validación, estructura y grounding de los cinco assets.

### O5 — Resiliencia

Controlar timeouts, errores del proveedor, retries limitados y fallos parciales.

### O6 — Seguridad

Proteger credenciales, controlar ownership y minimizar la exposición innecesaria de información sensible.

### O7 — Testing

Conseguir una suite reproducible que incluya unit tests y pruebas E2E reales contra PostgreSQL.

### O8 — CI/CD

Automatizar las comprobaciones principales del proyecto mediante CI y preparar un flujo reproducible de deployment.

### O9 — Deployment

Disponer de una versión desplegada del producto con frontend, backend, base de datos y proveedor LLM configurados.

### O10 — Validación E2E

Ejecutar el flujo principal completo en el entorno desplegado.

### O11 — Documentación

Actualizar README, prompts, arquitectura, evidencias y estado final del producto.

---

# 4. Alcance funcional obligatorio

La Fase 3 deberá preservar y completar el MVP existente.

## 4.1. Autenticación

Debe mantenerse:

- registro;
- login;
- JWT;
- protección de endpoints;
- ownership por usuario.

Se podrán realizar mejoras de seguridad sin redefinir el modelo de autenticación completo.

---

## 4.2. Business

Debe mantenerse:

- creación de negocio;
- asociación con usuario;
- recuperación del negocio;
- aislamiento entre usuarios.

---

## 4.3. Discovery

Debe mantenerse:

- recepción de respuestas estructuradas;
- validación;
- normalización;
- persistencia;
- generación del `BusinessProfile`.

---

## 4.4. BusinessProfile

Debe mantenerse como:

```text
canonical business context
```

Debe poder:

- visualizarse;
- revisarse;
- aprobarse;
- utilizarse como contexto para generación.

La generación deberá requerir un perfil válido y aprobado.

---

## 4.5. AI generation

Debe mantenerse la capacidad de generar los cinco tipos:

```text
BUSINESS_SUMMARY
WEBSITE_CONTENT
GOOGLE_BUSINESS_DESCRIPTION
SOCIAL_MEDIA_BIO
FAQ
```

La generación deberá realizarse mediante el `LLMGateway`.

En producción deberá existir una implementación real.

---

## 4.6. Asset lifecycle

Debe mantenerse:

- generación;
- consulta;
- edición;
- regeneración;
- persistencia;
- historial mediante `AIGeneration`.

No se deberá eliminar el historial existente como mecanismo de simplificación.

---

# 5. Integración del LLM real

## 5.1. Requisito

La Fase 3 deberá incorporar al menos un proveedor LLM real que pueda utilizarse dentro del alcance económico y técnico del proyecto.

La selección deberá documentarse.

---

## 5.2. Criterios de selección

La evaluación deberá considerar como mínimo:

| Criterio | Requisito |
|---|---|
| Disponibilidad | Debe poder utilizarse durante el desarrollo/demo |
| Coste | Preferentemente free tier |
| API | Debe existir acceso programático |
| Structured output | Deseable |
| Latencia | Compatible con generación síncrona |
| Límites | Deben estar documentados |
| Modelo | Debe ser adecuado para generación textual |
| Privacidad | Debe conocerse el tratamiento aplicable |
| Fiabilidad | Debe permitir gestionar errores |

La decisión deberá quedar registrada en `docs/prompts-entrega-3.md` y/o documentación técnica.

---

## 5.3. Adapter

La implementación deberá seguir una estructura conceptualmente equivalente a:

```text
Application
    │
    ▼
LLMGateway
    │
    ├── MockLLMGateway
    │
    └── RealLLMGateway
            │
            ▼
       LLM Provider
```

La lógica de negocio no deberá realizar llamadas HTTP directas al proveedor.

---

## 5.4. Configuración

Las credenciales deberán proporcionarse mediante variables de entorno.

Nunca deberán almacenarse:

- API keys;
- tokens;
- secretos;
- credenciales;

en código fuente, documentación operativa o Git.

---

## 5.5. Modelo y configuración

La configuración del proveedor deberá permitir definir, como mínimo cuando sea compatible:

```text
provider
model
api key
temperature
max tokens / output limit
timeout
```

Los valores deberán estar centralizados y documentados.

---

# 6. Prompting y grounding

## 6.1. Separación de responsabilidades

Debe conservarse la separación:

```text
ContextBuilder
        ↓
PromptBuilder
        ↓
LLMGateway
```

El `ContextBuilder` será responsable de construir el contexto autorizado.

El `PromptBuilder` será responsable de transformar dicho contexto en instrucciones.

El proveedor será responsable exclusivamente de ejecutar la inferencia.

---

## 6.2. Contexto canónico

El contexto enviado al LLM deberá derivarse de:

```text
approved BusinessProfile
```

No de información arbitraria de la request.

---

## 6.3. Prompt versioning

Toda generación deberá poder identificar al menos:

```text
promptVersion
contextVersion
modelUsed
```

El sistema actual utiliza:

```text
promptVersion = v1
contextVersion = v1
```

La evolución deberá mantener la trazabilidad.

---

## 6.4. Reglas de grounding

Los prompts deberán instruir explícitamente al modelo para:

- no inventar información;
- no introducir precios no proporcionados;
- no inventar servicios;
- no inventar certificaciones;
- no inventar horarios;
- no inventar localizaciones;
- no inventar datos de contacto;
- no atribuir características no presentes en el perfil.

Cuando un dato no esté disponible, el modelo deberá evitar presentarlo como hecho.

---

## 6.5. Especificidad por asset

Los cinco assets no deberán tratarse como un único bloque de texto indiferenciado.

Cada tipo deberá tener instrucciones específicas.

Como mínimo:

```text
BUSINESS_SUMMARY
→ resumen empresarial

WEBSITE_CONTENT
→ contenido web estructurado

GOOGLE_BUSINESS_DESCRIPTION
→ descripción breve orientada a ficha empresarial

SOCIAL_MEDIA_BIO
→ biografía breve

FAQ
→ preguntas y respuestas
```

Las restricciones concretas deberán estar documentadas.

---

# 7. Structured output y validación

## 7.1. Contrato de salida

La respuesta del LLM deberá transformarse a un formato interno controlado antes de persistirse.

La aplicación no deberá asumir que una respuesta textual arbitraria es válida.

---

## 7.2. Validación sintáctica

La validación deberá comprobar, según el asset:

- existencia de campos requeridos;
- tipos;
- longitud;
- estructura;
- contenido vacío;
- formato esperado.

---

## 7.3. Validación semántica

Cuando sea razonablemente implementable, deberá comprobarse:

- coherencia con `BusinessProfile`;
- ausencia de datos claramente inventados;
- cumplimiento de restricciones del asset;
- idioma;
- contenido sensible;
- formato.

---

## 7.4. Sanitización

El sistema deberá evitar que contenido generado pueda introducir directamente:

- scripts;
- contenido HTML peligroso;
- payloads no esperados;
- estructuras incompatibles con el frontend.

---

## 7.5. Rechazo de output inválido

Si el output no supera las validaciones:

```text
LLM response
    ↓
validation failed
    ↓
controlled failure
```

No deberá persistirse como asset válido.

La generación fallida podrá quedar registrada en `AIGeneration` para trazabilidad.

---

# 8. Resiliencia del proveedor

## 8.1. Timeout

Las llamadas al proveedor deberán tener un límite de tiempo explícito.

Una llamada externa no podrá bloquear indefinidamente una request.

---

## 8.2. Clasificación de errores

Se deberá distinguir, cuando el proveedor lo permita, entre:

- timeout;
- network error;
- authentication error;
- invalid request;
- rate limit;
- provider unavailable;
- malformed response;
- validation failure.

---

## 8.3. Retries

Se podrán implementar retries limitados para errores transitorios.

No deberán realizarse retries indiscriminados.

Ejemplo conceptual:

```text
Transient error
      ↓
retry with backoff
      ↓
success → continue

failure
      ↓
controlled error
```

Los errores permanentes no deberán reintentarse innecesariamente.

---

## 8.4. Generación múltiple

La generación actual de cinco assets es síncrona.

No se deberá introducir una arquitectura de colas/workers únicamente por motivos de diseño teórico.

Si la generación secuencial produce un problema real de rendimiento o disponibilidad, deberá documentarse antes de introducir una solución de mayor complejidad.

---

# 9. Coste y rate limiting

Aunque el proveedor elegido disponga de free tier, la aplicación deberá incorporar controles básicos.

Como mínimo:

- límite de tamaño de inputs;
- límite razonable de output;
- control de generación repetitiva;
- rate limiting básico cuando resulte viable;
- configuración de máximo de tokens;
- registro del consumo cuando el proveedor lo proporcione.

La aplicación no deberá permitir que una operación de regeneración pueda disparar indefinidamente llamadas al proveedor.

---

# 10. Privacidad y PII

El contexto utilizado por la IA puede contener información potencialmente sensible del negocio.

Antes de enviar información a un proveedor externo deberá evaluarse qué campos son realmente necesarios.

Principios:

1. minimización de datos;
2. no enviar información innecesaria;
3. no registrar secretos;
4. evitar exposición accidental de credenciales;
5. documentar qué información puede enviarse al proveedor.

Los snapshots almacenados en `AIGeneration` deberán revisarse desde la perspectiva de privacidad.

La Fase 3 no requiere implementar un sistema GDPR completo si no es necesario para el MVP, pero sí evitar prácticas claramente inseguras.

---

# 11. Seguridad y ownership

## 11.1. Ownership

Las operaciones sobre:

- Business;
- BusinessProfile;
- Asset;
- AIGeneration;

deberán respetar el ownership del usuario.

---

## 11.2. Test de aislamiento

Debe existir al menos una prueba que demuestre que:

```text
User A
   ✕
Business/User B data
```

no puede accederse mediante los endpoints protegidos.

---

## 11.3. Secret management

Los secretos deberán estar fuera del repositorio.

El `.gitignore` deberá impedir la incorporación accidental de archivos de configuración locales.

---

## 11.4. JWT

La expiración y validación del JWT deberán seguir siendo configurables.

La Fase 3 podrá mejorar el manejo de expiración y errores `401`, pero no requiere introducir refresh tokens salvo necesidad justificada.

---

# 12. Base de datos y Prisma

## 12.1. Modelo

El modelo actual de seis entidades constituye el baseline:

```text
User
Business
DiscoveryResponses
BusinessProfile
Asset
AIGeneration
```

No deberá ampliarse sin justificación.

---

## 12.2. Migraciones

Las migraciones deberán ser reproducibles desde una base vacía.

Debe poder ejecutarse:

```text
database empty
      ↓
Prisma migrations
      ↓
valid schema
```

---

## 12.3. Inconsistencias detectadas

Deberá revisarse la diferencia existente entre:

- defaults definidos en `schema.prisma`;
- defaults efectivos en las migraciones existentes.

La corrección deberá realizarse únicamente si existe un impacto real sobre reproducibilidad, testing o deployment.

---

# 13. Testing

## 13.1. Principio

La Fase 3 deberá diferenciar:

```text
unit
integration
API
database E2E
deployed E2E
```

---

## 13.2. Unit tests

Deberán mantenerse y ampliarse cuando se modifique funcionalidad.

Especialmente:

- `ContextBuilder`;
- `PromptBuilder`;
- `OutputValidator`;
- `AI Generation`;
- `LLMGateway`;
- normalización;
- ownership;
- errores.

---

## 13.3. Mock provider

Los tests deberán utilizar preferentemente `MockLLMGateway`.

No se deberán consumir créditos del proveedor real durante CI.

---

## 13.4. Database E2E

Debe poder ejecutarse el flujo completo contra PostgreSQL real:

```text
register
→ login
→ create business
→ discovery
→ approve profile
→ generate assets
→ verify persistence
```

La prueba deberá utilizar la aplicación real, Prisma real y PostgreSQL real.

---

## 13.5. Deployed E2E

La versión final desplegada deberá validarse mediante al menos el flujo principal.

El objetivo no es solamente comprobar que la página carga, sino verificar:

```text
Frontend
   ↓
Backend
   ↓
Database
   ↓
LLM
   ↓
Persistence
```

---

# 14. CI/CD

La integración continua deberá ejecutar como mínimo:

```text
install
  ↓
lint
  ↓
typecheck
  ↓
unit tests
  ↓
database E2E
  ↓
build
```

Cuando sea necesario, PostgreSQL deberá estar disponible como servicio del pipeline.

La CI no deberá depender de:

- credenciales LLM reales;
- servicios externos innecesarios;
- estado local del desarrollador.

---

# 15. Deployment

La Fase 3 deberá dejar preparado un deployment reproducible de:

```text
Frontend
Backend
PostgreSQL
LLM Provider
```

La infraestructura concreta podrá elegirse en función de:

- free tier;
- simplicidad;
- disponibilidad;
- compatibilidad;
- facilidad de demostración;
- coste.

La decisión deberá documentarse.

---

## 15.1. Configuración de producción

Las variables sensibles deberán configurarse en el entorno de deployment.

No deberán introducirse en:

- Git;
- README;
- código;
- logs;
- capturas de pantalla.

---

## 15.2. Public URL

La entrega final deberá disponer de una URL pública o, si existiera una limitación externa debidamente documentada, de instrucciones reproducibles para acceder al sistema.

La URL final deberá incorporarse al README.

---

# 16. Frontend y UX

La interfaz deberá seguir soportando el flujo principal:

```text
auth
→ business
→ discovery
→ profile approval
→ generation
→ assets
→ edit/regenerate
```

La Fase 3 podrá mejorar:

- feedback de loading;
- errores;
- mensajes de generación;
- expiración de sesión;
- accesibilidad;
- validación;
- responsive;
- claridad del estado de generación.

---

## 16.1. Accesibilidad mínima

Cuando sea viable deberán revisarse:

- labels;
- navegación por teclado;
- mensajes de error;
- estados dinámicos;
- `aria-live`;
- foco;
- contraste;
- botones y formularios.

No se requiere convertir la Fase 3 en un proyecto independiente de accesibilidad.

---

# 17. Observabilidad

Debe existir un nivel mínimo de trazabilidad para diagnosticar:

- generación iniciada;
- generación finalizada;
- generación fallida;
- proveedor utilizado;
- modelo utilizado;
- duración;
- tipo de error;
- identificador de generación cuando proceda.

No se deberán registrar secretos ni contenido sensible innecesario.

No se requiere implantar una plataforma completa de observabilidad distribuida.

---

# 18. Documentación

## 18.1. README

El README deberá reflejar el estado real del proyecto.

Debe distinguir claramente:

- arquitectura histórica de Entrega 1;
- implementación de Entrega 2;
- implementación final de Fase 3;
- funcionalidades realmente verificadas;
- comandos;
- configuración;
- testing;
- deployment;
- URL pública;
- limitaciones.

No deberán mantenerse afirmaciones de tests o despliegues que no puedan demostrarse.

---

## 18.2. Prompts

Se mantendrán los documentos históricos:

```text
docs/prompts-entrega-1.md
docs/prompts-entrega-2.md
docs/prompts-entrega-3.md
```

Al finalizar el proyecto se consolidará:

```text
prompts.md
```

La consolidación no deberá destruir la trazabilidad histórica.

---

## 18.3. Registro de decisiones

Las decisiones relevantes deberán quedar documentadas cuando afecten a:

- arquitectura;
- proveedor LLM;
- prompts;
- validación;
- seguridad;
- deployment;
- testing.

---

# 19. Evidencia académica y trazabilidad

La Fase 3 deberá generar evidencia suficiente para demostrar la evolución del sistema.

Como mínimo:

### Arquitectura

- diagrama actualizado;
- explicación del `LLMGateway`;
- flujo AI;
- límites del sistema.

### Testing

- salida de tests;
- cobertura cuando esté disponible;
- evidencia E2E;
- evidencia de PostgreSQL.

### AI

- proveedor seleccionado;
- modelo;
- configuración;
- prompt;
- contexto;
- output;
- validación;
- resultado de revisión humana.

### Deployment

- URL;
- configuración relevante;
- evidencia del flujo;
- estado de servicios.

### Git

- commits;
- PR;
- branch;
- historial de cambios relevante.

---

# 20. Alcance explícitamente diferido

Las siguientes funcionalidades **no forman parte del alcance obligatorio de la Fase 3**, salvo que una necesidad técnica real y documentada obligue a reconsiderarlas:

- RAG;
- embeddings;
- búsqueda semántica;
- Redis;
- colas;
- workers;
- arquitectura distribuida;
- microservicios;
- publicación automática en Google;
- publicación automática en redes sociales;
- CMS;
- OAuth;
- colaboración multiusuario avanzada;
- notificaciones;
- analytics avanzados;
- métricas de negocio;
- AssetVariation;
- internacionalización completa;
- sistema avanzado de recomendaciones;
- infraestructura enterprise;
- fine-tuning.

Su ausencia no deberá considerarse un incumplimiento de la Fase 3.

---

# 21. Non-goals / No hacer

Esta sección tiene carácter normativo.

## 21.1. No reescribir la arquitectura

No realizar una migración de:

```text
modular monolith
```

a microservicios únicamente por motivos teóricos.

---

## 21.2. No eliminar el mock

No sustituir definitivamente:

```text
MockLLMGateway
```

por el proveedor real.

Ambos deben coexistir.

---

## 21.3. No saltarse BusinessProfile

Está prohibido implementar:

```text
DiscoveryResponses → LLM
```

como fuente directa de generación.

---

## 21.4. No acoplar el dominio al proveedor

No deberá existir lógica de negocio dependiente de un SDK concreto.

---

## 21.5. No introducir funcionalidades fuera de MVP

No convertir la Fase 3 en una expansión de producto.

---

## 21.6. No introducir complejidad prematura

No añadir:

- Redis;
- Kafka;
- RabbitMQ;
- workers;
- Kubernetes;
- microservicios;

sin una necesidad funcional o técnica demostrable.

---

## 21.7. No eliminar historial de IA

No borrar `AIGeneration` para simplificar el modelo.

La trazabilidad es una característica del producto.

---

## 21.8. No almacenar secretos

Ningún secreto podrá entrar en Git.

---

## 21.9. No romper contratos sin justificación

Los endpoints existentes no deberán cambiarse arbitrariamente.

Cualquier breaking change deberá:

1. estar justificado;
2. documentarse;
3. actualizar tests;
4. actualizar README;
5. comprobarse E2E.

---

## 21.10. No modificar el dominio sin evidencia

No se modificarán entidades o relaciones únicamente para hacer más cómoda una implementación.

---

# 22. Cambios permitidos

Durante la Fase 3 se consideran razonablemente permitidos:

- nuevos adapters LLM;
- nuevos servicios internos;
- DTOs;
- validators;
- configuración;
- manejo de errores;
- tests;
- mejoras de prompts;
- pequeñas mejoras de schema si están justificadas;
- middleware/guards de seguridad;
- configuración CI;
- configuración deployment;
- mejoras UX;
- observabilidad básica;
- documentación.

Todos los cambios deberán mantenerse alineados con este contrato.

---

# 23. Cambios que requieren revisión

Requieren revisión explícita antes de implementarse:

- nuevas entidades de dominio;
- cambios significativos de Prisma;
- breaking changes de API;
- cambio de arquitectura;
- eliminación de funcionalidades;
- introducción de infraestructura adicional;
- procesamiento asíncrono;
- cambio de modelo de autenticación;
- incorporación de nuevos proveedores externos;
- envío de nueva información sensible a terceros.

---

# 24. Definition of Done

La Fase 3 se considerará terminada cuando se cumplan, como mínimo, los siguientes puntos.

## Producto

- [ ] El MVP sigue funcionando.
- [ ] El flujo principal es ejecutable de extremo a extremo.
- [ ] Los cinco assets continúan disponibles.
- [ ] Edición y regeneración funcionan.
- [ ] El historial de generación se conserva.

## AI

- [ ] Existe un proveedor LLM real.
- [ ] El proveedor está encapsulado detrás de `LLMGateway`.
- [ ] `MockLLMGateway` sigue disponible.
- [ ] `BusinessProfile` sigue siendo el contexto canónico.
- [ ] Los cinco assets se generan mediante IA real.
- [ ] Existe versionado de prompt/contexto.
- [ ] Existe validación de output.
- [ ] Existe grounding básico.
- [ ] Existen límites de generación.
- [ ] Existen controles de errores del proveedor.

## Seguridad

- [ ] No existen secretos en Git.
- [ ] Las credenciales se configuran mediante entorno.
- [ ] Ownership está validado.
- [ ] Existe al menos una prueba de aislamiento entre usuarios.
- [ ] Se ha revisado la exposición de PII.

## Testing

- [ ] Typecheck pasa.
- [ ] Lint pasa.
- [ ] Unit tests pasan.
- [ ] Database E2E pasa contra PostgreSQL real.
- [ ] Build pasa.
- [ ] El flujo E2E desplegado ha sido ejecutado.

## CI/CD

- [ ] CI configurada.
- [ ] Tests ejecutados automáticamente.
- [ ] Build automatizado.
- [ ] Deployment reproducible.

## Deployment

- [ ] Frontend desplegado.
- [ ] Backend desplegado.
- [ ] PostgreSQL disponible.
- [ ] LLM real configurado.
- [ ] URL pública disponible.
- [ ] Flujo principal validado.

## Documentation

- [ ] README actualizado.
- [ ] `docs/prompts-entrega-3.md` completado.
- [ ] `prompts.md` consolidado.
- [ ] Arquitectura actualizada.
- [ ] Evidencias registradas.
- [ ] Limitaciones documentadas.
- [ ] Estado final de testing documentado.

## Git

- [ ] Cambios relevantes integrados en `finalproject-MGB`.
- [ ] Working tree limpio.
- [ ] PR final preparado.
- [ ] Opcionalmente creado `v1.0-final-MGB`.

---

# 25. Criterios de aceptación

## AC-01 — Generación real

Dado un `BusinessProfile` aprobado, cuando se solicita la generación, el sistema debe poder utilizar el proveedor LLM real y persistir los cinco assets válidos.

---

## AC-02 — Canonical context

Dado un negocio con `DiscoveryResponses`, la generación debe utilizar el `BusinessProfile` aprobado como contexto canónico.

---

## AC-03 — Provider abstraction

El cambio entre mock y proveedor real no debe requerir modificar la lógica de negocio principal.

---

## AC-04 — Invalid output

Cuando el LLM devuelve un output incompatible con el contrato, el sistema debe rechazarlo de forma controlada.

---

## AC-05 — Provider failure

Cuando el proveedor falla, el sistema debe devolver un error controlado sin dejar la aplicación bloqueada indefinidamente.

---

## AC-06 — Persistence

Una generación válida debe persistirse correctamente y mantener su trazabilidad.

---

## AC-07 — Ownership

Un usuario no debe poder acceder o modificar assets pertenecientes a otro usuario.

---

## AC-08 — Reproducibility

Una instalación limpia debe poder ejecutar las migraciones y tests contra PostgreSQL de forma reproducible.

---

## AC-09 — CI

Un Pull Request debe poder ejecutar automáticamente las comprobaciones principales del proyecto.

---

## AC-10 — Deployment

El producto final debe estar disponible en un entorno desplegado accesible para evaluación.

---

## AC-11 — E2E

El flujo:

```text
register
→ login
→ create business
→ discovery
→ approve profile
→ generate
→ edit
→ regenerate
```

debe haber sido validado en el entorno final o mediante una estrategia de evidencia equivalente explícitamente documentada.

---

## AC-12 — Documentation consistency

La documentación debe representar el estado real del sistema y no atribuir como verificado aquello que únicamente está implementado o diseñado.

---

# 26. Orden obligatorio de implementación

La implementación deberá seguir preferentemente este orden:

```text
1. Baseline de Entrega 2
        ↓
2. Reproducibilidad de PostgreSQL / tests
        ↓
3. Correcciones estructurales menores
        ↓
4. Selección y validación del proveedor LLM
        ↓
5. RealLLMGateway
        ↓
6. Prompt/context refinement
        ↓
7. Structured output
        ↓
8. Validation + grounding
        ↓
9. Resilience + limits
        ↓
10. Security hardening
        ↓
11. CI
        ↓
12. Deployment
        ↓
13. Deployed E2E
        ↓
14. UX/accessibility
        ↓
15. Observability
        ↓
16. Documentation
        ↓
17. Final regression
        ↓
18. Final evidence
```

No se deberá saltar directamente a deployment si el baseline local continúa siendo irreproducible.

---

# 27. Puntos de aprobación humana

La implementación deberá detenerse para revisión humana en los siguientes puntos.

## Gate 1 — Baseline

Confirmar que la auditoría de Entrega 2 ha sido traducida correctamente a tareas técnicas.

## Gate 2 — LLM Provider

Revisar:

- proveedor;
- modelo;
- free tier;
- privacidad;
- límites;
- arquitectura.

## Gate 3 — First real generation

Revisar una generación real de los cinco assets.

## Gate 4 — Validation

Revisar casos:

- output válido;
- output incompleto;
- información inventada;
- provider failure.

## Gate 5 — Deployment

Revisar configuración de producción antes de exponer el sistema.

## Gate 6 — Final

Revisar:

- E2E;
- documentación;
- prompts;
- evidencias;
- Git;
- README;
- PR final.

---

# 28. Estrategia de commits

Los commits deberán mantener un alcance pequeño y semánticamente coherente.

Se recomienda Conventional Commits:

```text
fix:
feat:
test:
refactor:
docs:
ci:
build:
chore:
```

Ejemplos:

```text
fix: make database e2e reproducible
feat: add real llm gateway adapter
feat: validate generated asset outputs
test: add provider failure scenarios
ci: add backend validation workflow
ci: add postgres service for e2e tests
docs: document phase 3 llm integration
```

Debe evitarse agrupar en un único commit cambios no relacionados.

---

# 29. Estrategia de Pull Requests

Cada bloque significativo deberá poder revisarse mediante PR.

La descripción de cada PR deberá incluir, cuando proceda:

```text
Context
Problem
Changes
Tests
Evidence
Risks
Deferred work
```

El PR final deberá representar la evolución completa de la Fase 3 y enlazar con la documentación correspondiente.

---

# 30. Registro de uso de IA

Cada intervención de IA que produzca un cambio relevante deberá poder trazarse mediante:

```text
Context
Prompt
Result
Human review
Changes
```

No es necesario registrar prompts triviales o conversaciones irrelevantes.

Sí deberán registrarse especialmente:

- decisiones arquitectónicas;
- integración LLM;
- prompts de generación;
- validación;
- testing;
- CI/CD;
- deployment;
- documentación final.

---

# 31. Riesgos principales

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Free tier insuficiente | Alto | Evaluar límites antes de integrar |
| LLM no determinista | Medio | Mock en tests + validación |
| Hallucinations | Alto | Grounding + validation |
| Provider outage | Alto | Timeout + retries + errores controlados |
| Cost overrun | Medio | Limits + rate limiting |
| PII exposure | Alto | Minimización + revisión de contexto |
| E2E irreproducible | Alto | PostgreSQL reproducible + CI |
| Scope creep | Alto | Non-goals + contract |
| Breaking API changes | Medio | Tests + revisión |
| Deployment instability | Alto | CI + configuración documentada |
| Secrets exposure | Alto | Environment configuration |
| Prompt drift | Medio | Versionado |
| Insufficient evidence | Medio | Evidence log durante la implementación |

---

# 32. Métricas de validación

Siempre que sea posible, la Fase 3 deberá registrar métricas objetivas.

Ejemplos:

```text
unit tests passed
integration tests passed
database E2E passed
deployed E2E passed
build passed
lint passed
typecheck passed
generation success rate
generation latency
provider error rate
validation rejection rate
```

No deberán inventarse métricas que no hayan sido medidas.

---

# 33. Regla de interpretación del contrato

En caso de conflicto entre:

1. este contrato;
2. el código existente;
3. documentación histórica;
4. decisiones tomadas durante la implementación;

deberá aplicarse el siguiente principio:

> **La decisión deberá basarse en el objetivo del producto, la trazabilidad de las decisiones y la evidencia técnica disponible, no en la conveniencia de realizar una modificación rápida.**

Las contradicciones deberán documentarse y resolverse explícitamente.

---

# 34. Regla de parada

La implementación deberá detenerse y reportar el conflicto cuando una tarea requiera:

- romper la arquitectura acordada;
- introducir una entidad de dominio no prevista;
- eliminar una garantía existente;
- saltarse `BusinessProfile`;
- eliminar el mock;
- introducir secretos;
- realizar una migración destructiva;
- cambiar un contrato API de forma incompatible;
- añadir infraestructura compleja no contemplada.

No deberá realizarse una modificación de este tipo silenciosamente.

---

# 35. Resultado esperado

El resultado final de la Fase 3 deberá ser un sistema que pueda describirse mediante:

```text
                         ┌──────────────────────┐
                         │      Frontend        │
                         │ React + TypeScript   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       Backend        │
                         │ NestJS + TypeScript  │
                         └──────────┬───────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
        PostgreSQL             BusinessProfile        LLMGateway
             │                      │                      │
             │                      │             ┌────────┴────────┐
             │                      │             │                 │
             │                      │             ▼                 ▼
             │                      │        MockLLMGateway   RealLLMGateway
             │                      │                              │
             │                      │                              ▼
             │                      │                         LLM Provider
             │                      │
             └──────────────────────┴──────────────────────────────┘
```

Con el pipeline:

```text
Discovery
   ↓
Normalization
   ↓
BusinessProfile
   ↓
Human Approval
   ↓
ContextBuilder
   ↓
PromptBuilder
   ↓
LLMGateway
   ↓
Structured Output
   ↓
Validation
   ↓
Grounding
   ↓
Asset
   ↓
AIGeneration History
```

Y con las garantías:

```text
                 ┌───────────────────────┐
                 │ Reproducible testing  │
                 └───────────┬───────────┘
                             │
                 ┌───────────▼───────────┐
                 │       CI / Build      │
                 └───────────┬───────────┘
                             │
                 ┌───────────▼───────────┐
                 │       Deployment      │
                 └───────────┬───────────┘
                             │
                 ┌───────────▼───────────┐
                 │   Deployed E2E        │
                 └───────────────────────┘
```

---

# 36. Declaración final del contrato

La Fase 3 no pretende maximizar el número de funcionalidades implementadas.

Pretende maximizar la **calidad, trazabilidad, reproducibilidad y verificabilidad del MVP**, incorporando IA real sin perder control sobre el dominio ni sobre los resultados generados.

Por tanto, el criterio de éxito no será:

> “se han añadido muchas funcionalidades”.

Será:

> **“el producto definido en Entrega 2 ha evolucionado hasta una implementación final funcional, con IA real, validación, seguridad, pruebas reproducibles, CI/CD, deployment y evidencia verificable, manteniendo una arquitectura proporcional al alcance del proyecto.”**

La implementación deberá priorizar siempre:

```text
Correctness
    >
Traceability
    >
Reproducibility
    >
Security
    >
Simplicity
    >
Feature breadth
```

Este contrato constituye el **baseline técnico de implementación de la Fase 3** y deberá utilizarse como referencia para valorar cualquier cambio relevante realizado hasta la preparación de la entrega final.