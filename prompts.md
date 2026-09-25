# Prompt Registry — AI Business Presence Builder

> Consolidated registry of all AI prompts used across the three entregas of the project. Each section reproduces the literal prompts from its source document and links to the corresponding evidence or commit.

## Purpose

This document serves as the single point of reference for all prompts that shaped the product, architecture, implementation, and validation of AI Business Presence Builder. It consolidates:

- **Entrega 1:** product definition, architecture, data model, API, user stories
- **Entrega 2:** implementation, testing, validation, hardening
- **Entrega 3 (Fase 3):** LLM integration, Groq, CI/CD, deployment, E2E validation

---

## Entrega 1 — Product Definition

> Source: [`docs/prompts-entrega-1.md`](docs/prompts-entrega-1.md)

### 1. Descripción general del producto

**Prompt 1: Definición de las capacidades críticas del sistema**

*Contexto: Fase inicial — Definición del MVP*

"A partir de tus conocimientos sobre digitalización de SMB, generación de contenido asistida por IA y tendencias actuales de diseño de producto, describe las capacidades críticas que debe tener AI Business Presence Builder. Explica cómo el descubrimiento guiado del negocio, la normalización del perfil y la generación de activos mediante IA pueden crear diferenciación. Describe cómo cada capacidad reduce la fricción para el usuario."

*Resultado:* Identificación de ocho capacidades críticas, entre ellas: flujo guiado, validación inteligente, normalización de perfiles, generación de personas, narrativa de marca mediante IA, generación multiformato, recomendaciones de identidad y preparación para SEO local.

**Prompt 2: Oportunidades de diferenciación**

*Contexto: Estrategia de producto — Análisis competitivo*

"A partir de tu experiencia en digitalización de SMB, generación de contenido asistida por IA y tendencias actuales de diseño de producto, identifica oportunidades de diferenciación. En concreto, identifica nuevas capacidades que puedan mejorar significativamente una plataforma de presencia digital basada en IA respecto a los estándares actuales, así como capacidades existentes en productos similares que deberían replantearse, especialmente teniendo en cuenta el cambio desde la generación basada en prompts hacia la creación basada en perfiles empresariales estructurados."

*Resultado:* Identificación de ocho oportunidades: Business Identity Graph dinámica, generación sin prompts basada en datos, plantillas verticales, paquetes de contenido orientados a la intención, analizadores de diferenciación, motores de coherencia, ajuste interactivo de la voz de marca, entre otras.

**Prompt 3: Validación de la propuesta de valor con el cliente final**

*Contexto: Fase inicial — Alineación comercial*

"Formula la propuesta de valor principal de AI Business Presence Builder para pequeños propietarios de negocios. Considera las barreras para la adopción digital, las limitaciones presupuestarias, el nivel técnico y la disponibilidad de tiempo. ¿En qué se diferencia la solución de los servicios de agencia costosos y de las herramientas genéricas de contenido basadas en IA? ¿Qué problemas principales resolvemos?"

*Resultado:* Clarificación de una propuesta de valor centrada en la asequibilidad, la facilidad de uso, la coherencia de marca y la rapidez de puesta en marcha.

### 2. Arquitectura del sistema

**Prompt 1: Diseño de arquitectura de alto nivel**

*Contexto: Arquitectura — Estructura base*

"A partir de todo lo definido hasta ahora, describe una arquitectura de alto nivel para esta plataforma. Explica cómo debe organizarse el sistema de extremo a extremo, incluyendo los componentes principales, el flujo de datos y la integración de la capa de IA con el proceso estructurado de creación del perfil empresarial. Refleja claramente la separación entre el descubrimiento guiado del negocio, el perfil normalizado y la generación de activos mediante IA. Destaca los límites y las decisiones arquitectónicas principales."

*Resultado:* Arquitectura modular con capas de experiencia, aplicación, datos e IA, además de servicios desacoplados para evaluación de IA y notificaciones.

**Prompt 2: Representación gráfica con Mermaid**

*Contexto: Visualización — Diagramas técnicos*

"Representa la arquitectura descrita mediante un diagrama Mermaid. Estructúralo para mostrar claramente los componentes principales, sus relaciones y el flujo de datos desde el descubrimiento del negocio hasta el perfil normalizado y, finalmente, la generación de activos mediante IA. Mantén el diagrama limpio y centrado en los límites generales del sistema, sin incluir detalles de implementación innecesarios."

*Resultado:* Diagrama `flowchart LR` que visualiza el flujo completo entre las distintas capas y componentes.

**Prompt 3: Comparación de opciones arquitectónicas**

*Contexto: Decisiones técnicas — Trade-offs*

"Propón tres enfoques arquitectónicos viables para esta plataforma y descríbelos con el detalle suficiente para comprender cómo resuelven el descubrimiento del negocio, la normalización del perfil y la generación de activos mediante IA. Compáralos en escalabilidad, mantenibilidad, complejidad y adecuación para un sistema basado en IA. Recomienda la opción más apropiada con una justificación clara, incluyendo sus ventajas y compromisos."

*Resultado:* Evaluación de un monolito modular, una SOA con orquestador dedicado y una arquitectura Serverless orientada a eventos. Se recomendó el monolito modular con servicios desacoplados para evaluación de IA y notificaciones.

### 3. Modelo de datos

**Prompt 1: Diseño entidad-relación**

*Contexto: Datos — Estructura base*

"A partir del sistema definido hasta ahora, genera un diagrama entidad-relación utilizando Mermaid. Representa las entidades principales del dominio, sus atributos y relaciones, especialmente en torno al perfil empresarial, los datos estructurados del descubrimiento y los activos digitales generados. Incluye claves primarias, claves foráneas y restricciones. Asegúrate de que el modelo soporte todos los casos de uso definidos anteriormente."

*Resultado:* Diagrama ER con nueve entidades: Organization, User, BusinessProfile, AssetPackage, GeneratedAsset, AssetVariation, QualityCheck, AIRecommendation y PublicationTask.

**Prompt 2: Descripción de entidades y cardinalidades**

*Contexto: Documentación — Catálogo de datos*

"Para cada entidad principal del modelo, describe su finalidad, claves primarias, claves foráneas, atributos relevantes y tipos de datos, restricciones, relaciones, cardinalidades y significado de negocio. Asegura la coherencia con la arquitectura y los casos de uso, y céntrate en que el diseño sea implementable en PostgreSQL."

*Resultado:* Documentación detallada de cada entidad, con cardinalidades, restricciones y ejemplos.

### 4. Especificación de la API

**Prompt 1: Diseño de endpoints OpenAPI**

*Contexto: API — Contrato técnico*

"Describe los tres endpoints principales de backend en formato OpenAPI 3.0 para soportar el flujo de descubrimiento, la gestión del perfil y la generación de activos. Para cada endpoint incluye esquemas de solicitudes y respuestas, métodos HTTP, códigos de estado, gestión de errores y ejemplos realistas. Los endpoints son: POST /api/discovery/sessions, GET /api/profiles/{profileId} y POST /api/assets/generate."

*Resultado:* Especificación completa con esquemas de solicitudes y respuestas, ejemplos y documentación de los endpoints.

**Prompt 2: Gestión de errores y códigos de estado**

*Contexto: API — Robustez operativa*

"Amplía el diseño de la API para incluir una gestión detallada de errores. Relaciona las condiciones específicas del PRD, como profile_not_normalized, gdpr_consent_required, quota_exceeded, invalid_format e insufficient_permissions, con códigos HTTP y cuerpos de respuesta. Asegúrate de que cada endpoint defina las respuestas 400/401/403/404/500 esperadas y utilice un esquema de error coherente."

*Resultado:* Descripción de errores y códigos de estado alineada con el PRD, con cuerpos de error reutilizables.

**Prompt 3: Validación de solicitudes/respuestas y restricciones**

*Contexto: API — Contratos de datos*

"Describe las reglas de validación y las restricciones de los esquemas de solicitudes y respuestas de la API. Incluye campos obligatorios, formatos, restricciones de enums, límites de arrays y su relación con reglas de dominio como el estado de BusinessProfile y el consentimiento GDPR. Indica cómo las peticiones inválidas deben fallar rápidamente con mensajes significativos."

*Resultado:* Reglas de validación claras para los esquemas de solicitudes y respuestas y criterios de rechazo temprano.

**Prompt 4: Aspectos transversales de la API**

*Contexto: API — Operaciones y seguridad*

"Describe cómo deben gestionarse los aspectos transversales de la capa API: autenticación, autorización, limitación de solicitudes, paginación y propagación de errores. Utiliza el comportamiento del PRD para explicar cuándo deben autenticarse las peticiones, qué endpoints requieren comprobaciones de roles y cómo se comunica la limitación de tráfico a los clientes."

*Resultado:* Recomendaciones sobre autenticación, autorización y operación de la API.

### 5. Historias de usuario

**Prompt 1: Generación de historias de usuario del MVP**

*Contexto: Requisitos — Backlog priorizado*

"Genera cinco historias de usuario imprescindibles para el MVP con el formato 'Como [rol], quiero [acción], para que [beneficio]'. Cada historia debe incluir criterios de aceptación en formato Dado/Cuando/Entonces, casos límite y resultados medibles. Cubre el descubrimiento del negocio, la normalización del perfil, la generación de activos y el control de calidad. Alinea el resultado con el Lean Canvas y la arquitectura."

*Resultado:* Cinco historias con criterios de aceptación detallados y casos límite.

**Prompt 2: Historias recomendadas para después del MVP**

*Contexto: Backlog futuro — Roadmap*

"Genera dos historias de usuario recomendadas para fases posteriores al MVP que amplíen la plataforma sin añadir complejidad al MVP. Céntrate en un panel de métricas y en el uso compartido de activos para revisión colaborativa. Incluye el mismo nivel de detalle que en las historias imprescindibles."

*Resultado:* Dos historias adicionales para fases posteriores, con criterios claros.

### 6. Tickets de trabajo

**Prompt 1: Descomposición en tareas técnicas**

*Contexto: Planificación — Desglose del sprint*

"A partir de las cinco historias imprescindibles, descompón el trabajo en tres tareas técnicas que cubran las capas de backend, frontend y de base de datos. Cada tarea debe incluir ID, nombre, descripción, objetivo, dependencias y alcance para una sola persona desarrolladora. Asegura la cobertura de la captura del descubrimiento, la lógica de backend de normalización del perfil y la infraestructura de generación de activos."

*Resultado:* Tres tareas (BE-101, FE-102 y DB-103) con descripción técnica completa.

**Prompt 2: Estimación con puntos de historia**

*Contexto: Estimación — Planificación Fibonacci*

"Estima los tres tickets técnicos utilizando la escala de Fibonacci (1, 2, 3, 5, 8, 13). Proporciona para cada uno el valor de puntos de historia y una breve justificación considerando la complejidad, las dependencias, la curva de aprendizaje y la experiencia del equipo. Asegúrate de que las estimaciones reflejen un esfuerzo realista para un MVP de una startup."

*Resultado:* BE-101 (5 puntos), FE-102 (3 puntos) y DB-103 (8 puntos), con su justificación.

### 7. Solicitudes de cambio

**Prompt 1: Descripción profesional de una PR**

*Contexto: Control de cambios — Documentación*

"Crea una descripción completa de una PR que explique la incorporación de siete historias de usuario completas con criterios de aceptación, la descomposición en tres tareas técnicas con estimación en puntos de historia y la justificación de las decisiones arquitectónicas. Incluye título, cambios realizados, motivación, impacto de negocio e impacto técnico. Dirige el documento a responsables de producto y de ingeniería."

*Resultado:* Descripción profesional de PR para comunicar el valor y los cambios a las partes interesadas.

---

## Entrega 2 — Implementation and Validation

> Source: [`docs/prompts-entrega-2.md`](docs/prompts-entrega-2.md)

### 1. Auditoría inicial y análisis de discrepancias

**Prompt 1: Auditoría técnica del repositorio**

*Contexto: Fase inicial de la Entrega 2 — Evaluación del punto de partida*

"Actúa como responsable técnico y realiza una auditoría completa del repositorio antes de implementar la Entrega 2. Comprueba qué partes de la arquitectura, backend, frontend, base de datos, tests, infraestructura y configuración existen realmente y cuáles son únicamente documentación.

Contrasta el estado real del repositorio con los requisitos de la Entrega 2 y proporciona una lista explícita de gaps. No asumas que una funcionalidad existe porque esté descrita en el README, PRD o documentación.

Para cada gap indica:
- requisito esperado;
- estado real;
- evidencia en el repositorio;
- impacto sobre la Entrega 2;
- prioridad;
- recomendación de implementación.

No modifiques ningún fichero durante esta auditoría."

*Resultado:* Se determinó que el repositorio partía esencialmente de una base documental y que era necesario implementar desde cero la aplicación ejecutable de la Entrega 2.

**Prompt 2: Resolución de inconsistencias entre documentación y requisitos de implementación**

*Contexto: Arquitectura — Alineación entre Entrega 1 y Entrega 2*

"Compara la documentación existente del proyecto con los requisitos explícitos de la Entrega 2. Identifica cualquier contradicción en tecnologías, modelo de datos, endpoints, número de activos, flujo funcional, estrategia de generación mediante IA o infraestructura.

Establece una regla de precedencia para resolver las contradicciones y selecciona la implementación mínima viable que permita cumplir la Entrega 2 sin ampliar innecesariamente el alcance.

No introduzcas funcionalidades futuras que no sean necesarias para el MVP. Documenta las decisiones resultantes y los elementos que deben quedar explícitamente aplazados."

*Resultado:* Se identificaron discrepancias como FastAPI frente a NestJS, un modelo de datos excesivamente amplio frente al modelo MVP, y una especificación inicial de activos inferior a los cinco exigidos finalmente.

### 2. Contrato de implementación y delimitación del MVP

**Prompt 1: Definición del contrato técnico de implementación**

*Contexto: Planificación — Conversión de requisitos en contrato ejecutable*

"A partir de los requisitos de la Entrega 2 y de las inconsistencias detectadas en la documentación, define un contrato técnico de implementación que pueda utilizarse como fuente de verdad durante el desarrollo.

El contrato debe fijar:
- stack tecnológico;
- estructura general del sistema;
- entidades persistentes;
- flujo funcional principal;
- endpoints necesarios;
- reglas de autenticación y autorización;
- reglas de ownership;
- estados de BusinessProfile y Asset;
- los cinco tipos de activos obligatorios;
- arquitectura de generación mediante IA;
- estrategia de persistencia de AIGeneration;
- estrategia de testing;
- elementos explícitamente fuera de alcance.

Prioriza la implementación mínima necesaria para disponer de un MVP funcional y verificable."

*Resultado:* Se creó [`docs/ENTREGA2-IMPLEMENTATION-CONTRACT.md`](docs/ENTREGA2-IMPLEMENTATION-CONTRACT.md), utilizado como referencia durante la implementación y validación de la entrega.

**Prompt 2: Plan de implementación incremental**

*Contexto: Desarrollo — Organización de la implementación*

"Descompón la implementación de la Entrega 2 en incrementos técnicos que permitan mantener el sistema ejecutable y verificable en cada etapa.

Ordena las tareas de forma que primero se establezcan la infraestructura y persistencia, después el dominio y API, posteriormente la integración de IA, el frontend y finalmente las pruebas y validaciones.

Para cada incremento indica:
- objetivo;
- componentes afectados;
- dependencias;
- criterios de finalización;
- riesgos.

Evita implementar funcionalidades fuera del alcance del contrato."

*Resultado:* La implementación se estructuró progresivamente en foundation, dominio, IA, frontend, testing/seguridad y documentación.

### 3. Implementación del backend y modelo de datos

**Prompt 1: Implementación del backend y persistencia**

*Contexto: Backend — Implementación del MVP*

"Implementa el backend de AI Business Presence Builder utilizando NestJS, TypeScript, Prisma y PostgreSQL, siguiendo estrictamente el contrato de implementación de la Entrega 2.

Debe incluir como mínimo:
- autenticación mediante registro y login;
- gestión de negocios;
- ownership por usuario;
- captura y persistencia de DiscoveryResponses;
- normalización determinista de BusinessProfile;
- revisión y aprobación del perfil;
- generación y gestión de los cinco activos;
- persistencia de AIGeneration;
- validación de DTOs;
- protección de endpoints mediante JWT;
- comprobaciones de autorización y ownership.

Mantén la separación entre controllers, services, dominio y persistencia. No implementes funcionalidades que estén fuera del MVP."

*Resultado:* Se implementó el backend NestJS con PostgreSQL y Prisma, incluyendo autenticación, negocio, descubrimiento, BusinessProfile, activos y registros de generación.

**Prompt 2: Validación del modelo de datos frente al flujo funcional**

*Contexto: Datos — Coherencia entre dominio, persistencia y casos de uso*

"Revisa el modelo Prisma implementado y comprueba que soporta completamente el flujo de la Entrega 2.

Verifica especialmente:
- relaciones entre User y Business;
- relación Business–DiscoveryResponses;
- relación Business–BusinessProfile;
- relación Business–Asset;
- persistencia independiente de AIGeneration;
- posibilidad de conservar el historial de generaciones;
- restricciones de enums;
- claves foráneas;
- ownership;
- timestamps y campos de auditoría.

Comprueba también que el modelo no introduce entidades innecesarias del roadmap futuro.

Si detectas problemas, propón únicamente los cambios necesarios para cumplir el contrato."

*Resultado:* Se validó el modelo compacto de seis entidades persistentes y se comprobó su correspondencia con el flujo MVP y la trazabilidad de generaciones.

### 4. Implementación de la arquitectura de generación mediante IA

**Prompt 1: Implementación de un pipeline de IA desacoplado**

*Contexto: IA — Integración controlada y reproducible*

"Implementa una arquitectura de generación de contenidos basada en un pipeline desacoplado:

`DiscoveryResponses → BusinessProfile → ContextBuilder → PromptBuilder → LLMGateway → Validation → Asset/AIGeneration`

La regla fundamental es que `BusinessProfile` sea la única fuente canónica de información utilizada por la generación de IA.

Las respuestas originales del wizard no deben enviarse directamente al LLM.

Implementa interfaces claras para:
- construcción del contexto;
- construcción del prompt;
- gateway del modelo;
- validación de la respuesta.

Utiliza una implementación mock determinista del `LLMGateway` para que el MVP pueda ejecutarse y validarse sin depender de un proveedor externo.

Persiste snapshots del contexto, prompt y respuesta generados para permitir trazabilidad y auditoría."

*Resultado:* Se implementó el pipeline desacoplado y síncrono, con `MockLLMGateway`, validación antes de persistencia y snapshots asociados a `AIGeneration`.

**Prompt 2: Validación de las garantías de grounding de la IA**

*Contexto: IA — Control de la fuente de conocimiento*

"Audita la implementación de la generación de activos y comprueba que la IA únicamente recibe información derivada del BusinessProfile aprobado.

Revisa todo el flujo desde DiscoveryResponses hasta LLMGateway e identifica cualquier punto donde datos sin normalizar puedan llegar directamente al modelo.

Verifica también que:
- ContextBuilder recibe BusinessProfile;
- PromptBuilder trabaja únicamente con el contexto canónico;
- LLMGateway recibe prompt/contexto y no DiscoveryResponses;
- las respuestas se validan antes de persistirse;
- AIGeneration conserva snapshots suficientes para reconstruir qué contexto y prompt se utilizaron.

Si existe alguna violación de estas garantías, corrígela sin cambiar el alcance funcional del MVP."

*Resultado:* Se verificó la propiedad de `BusinessProfile` como fuente canónica y se corrigieron/hardene​aron los puntos necesarios para impedir el acceso directo de la capa LLM a `DiscoveryResponses`.

### 5. Implementación del frontend y flujo end-to-end

**Prompt 1: Implementación del flujo funcional completo**

*Contexto: Frontend — Experiencia MVP*

"Implementa el frontend del MVP utilizando React, TypeScript y Vite.

El usuario debe poder completar el flujo:

`REGISTER → LOGIN → CREATE BUSINESS → COMPLETE DISCOVERY → REVIEW PROFILE → APPROVE PROFILE → GENERATE DIGITAL PRESENCE → REVIEW ASSETS`

El wizard debe cubrir las seis áreas definidas en el contrato. El frontend debe comunicarse con la API real, gestionar autenticación y estados de carga/error y permitir revisar y editar los activos generados.

No simules respuestas de backend en el frontend: utiliza los endpoints reales implementados."

*Resultado:* Se implementó la interfaz React conectada al backend real, incluyendo autenticación, wizard de seis pasos, revisión/aprobación del perfil y gestión de los cinco activos.

**Prompt 2: Implementación de edición y regeneración**

*Contexto: Frontend — Ciclo de revisión humana*

"Amplía el flujo de gestión de activos para que el usuario pueda:
- revisar cada activo;
- editar título y contenido;
- guardar los cambios;
- regenerar un activo;
- visualizar correctamente los estados del activo;
- evitar acciones duplicadas mientras una operación está en curso.

La regeneración debe utilizar nuevamente el BusinessProfile aprobado y no debe eliminar el historial de AIGeneration anterior.

Mantén el comportamiento coherente con el backend y no añadas una interfaz de historial si no existe un endpoint específico para ello."

*Resultado:* Se implementó el ciclo de revisión humana, edición y regeneración, preservando las generaciones anteriores.

### 6. Testing, seguridad y validación

**Prompt 1: Diseño de una prueba E2E real con persistencia**

*Contexto: Testing — Validación del sistema completo*

"Diseña e implementa una prueba E2E que valide el flujo principal de la Entrega 2 utilizando el AppModule real, Prisma y una instancia real de PostgreSQL.

La prueba debe cubrir:

`REGISTER → LOGIN → CREATE BUSINESS → DISCOVERY → APPROVE PROFILE → GENERATE FIVE ASSETS → VERIFY DATABASE PERSISTENCE`

No utilices repositories mockeados ni sustituyas la persistencia real.

Comprueba además:
- autenticación;
- relaciones entre entidades;
- existencia de exactamente cinco tipos de Asset;
- persistencia de AIGeneration;
- snapshots de prompt, contexto y respuesta;
- uso del BusinessProfile como contexto canónico.

La prueba debe ser reproducible en un entorno local."

*Resultado:* Se implementó una prueba E2E basada en la aplicación real y PostgreSQL, verificando persistencia, cinco tipos de activos y snapshots de generación.

**Prompt 2: Auditoría de seguridad y aislamiento por ownership**

*Contexto: Seguridad — Autorización y aislamiento de datos*

"Realiza una auditoría de seguridad del MVP centrada en autenticación, autorización y aislamiento de recursos por usuario.

Comprueba:
- hashing de contraseñas;
- firma y expiración del JWT;
- validación del payload JWT;
- protección de endpoints;
- validación de DTOs;
- UUIDs;
- comprobaciones server-side de ownership;
- ausencia de passwordHash y secretos en respuestas;
- ausencia de claves de proveedores IA en frontend o código;
- exclusión de `.env` del repositorio.

Diseña pruebas que demuestren que un usuario no puede acceder, modificar o regenerar recursos pertenecientes a otro usuario."

*Resultado:* Se verificó el aislamiento por ownership y se incorporaron validaciones adicionales sobre JWT, DTOs, UUIDs, secretos y respuestas de API.

**Prompt 3: Auditoría completa previa a la entrega**

*Contexto: QA — Criterio de aceptación de la Entrega 2*

"Realiza una auditoría final de la Entrega 2 sin modificar código inicialmente.

Contrasta:
1. requisitos de la Entrega 2;
2. contrato de implementación;
3. documentación;
4. implementación real;
5. tests;
6. persistencia;
7. seguridad;
8. flujo funcional E2E.

No des por implementada una funcionalidad únicamente porque aparezca documentada.

Clasifica los resultados como:
- PASS;
- PASS WITH NOTES;
- FAIL.

Para cada problema indica evidencia, impacto y acción recomendada."

*Resultado:* La auditoría final concluyó `PASS WITH NOTES`, sin defectos críticos, identificando únicamente aspectos de documentación, cobertura adicional y deuda técnica.

### 7. Hardening, correcciones y preparación de la entrega

**Prompt 1: Corrección de defectos detectados durante la validación**

*Contexto: Hardening — Corrección sin ampliación de alcance*

"A partir de los problemas detectados durante las pruebas y la auditoría, corrige únicamente los defectos que puedan afectar a la robustez, seguridad, reproducibilidad o cumplimiento del contrato de la Entrega 2.

Prioriza:
- errores de validación;
- errores de tipos;
- respuestas controladas ante entradas inválidas;
- validación del JWT;
- validación de UUIDs;
- normalización de inputs;
- configuración reproducible;
- exclusión de secretos y artefactos generados.

No introduzcas funcionalidades nuevas ni modifiques el alcance del producto."

*Resultado:* Se realizaron correcciones de robustez en validación de respuestas de IA, JWT, DTOs, UUIDs, inputs, configuración y control de artefactos generados.

**Prompt 2: Auditoría final de packaging y trazabilidad**

*Contexto: Entrega — Preparación de PR*

"Realiza una auditoría final del repositorio antes de abrir la PR de la Entrega 2.

Comprueba:
- estado de Git;
- cambios incluidos;
- ausencia de secretos;
- consistencia de README;
- coherencia entre documentación e implementación;
- tests y builds;
- Prisma schema y migraciones;
- configuración Docker;
- estructura de commits;
- separación entre documentación histórica de Entrega 1 e implementación de Entrega 2.

Ejecuta las validaciones disponibles y proporciona un veredicto final.

No realices cambios destructivos, no hagas push y no modifiques main."

*Resultado:* Se verificó el estado final del repositorio y se preparó la rama `feature-entrega2-MGB` para revisión mediante PR, manteniendo separada la implementación de la documentación histórica.

---

## Entrega 3 / Fase 3 — LLM Integration and Deployment

> Source: [`docs/prompts-entrega-3.md`](docs/prompts-entrega-3.md)

### 1. Auditoría de la línea base

**Prompt utilizado: revisión previa de la arquitectura existente**

"Lee completamente `docs/FASE3-IMPLEMENTATION-CONTRACT.md`. Revisa la arquitectura actual de `backend/src/ai-generation/`, cómo `AssetsService` consume `AIGenerationService`, `MockLlmGateway`, los tests de generación, las variables de entorno y el estado Git. Mantén la arquitectura existente, no elimines el mock, no envíes `DiscoveryResponses` directamente al LLM y no modifiques endpoints públicos sin justificación."

*Resultado:* Se confirmó que `LLMGateway`, `ContextBuilder`, `PromptBuilder`, `OutputValidator`, `MockLlmGateway` y `AIGenerationService` ya formaban el pipeline base.

**Commit:** `8e14519`

### 2. Evaluación de proveedores LLM

**Prompt utilizado para la búsqueda de proveedor**

"Elige un proveedor LLM real para un backend NestJS + TypeScript que pueda integrarse mediante un adapter HTTP ligero detrás de `LLMGateway`. Debe tener free tier o coste muy bajo para una demo académica, generación textual en español, JSON estructurado cuando sea posible, límites y privacidad documentables, y no debe obligar a acoplar el dominio a un SDK concreto. Compara opciones actuales como Google Gemini, Groq y OpenRouter y recomienda una."

*Resultado:* Se seleccionó OpenRouter como primer adapter real. La integración utiliza `fetch` nativo, no un SDK del proveedor.

**Decisión humana:** `LLM_PROVIDER=mock` por defecto. La activación del proveedor real requiere configurar manualmente `LLM_PROVIDER=real` y `LLM_API_KEY`.

### 3. Diseño del gateway y selección mock/real

**Prompt utilizado: diseño de integración desacoplada**

"Implementa la integración real sin reescribir el dominio. Mantén una abstracción equivalente a `LLMGateway`, conserva `MockLlmGateway` para desarrollo y tests, crea un gateway real como detalle de infraestructura y selecciona `mock` o `real` mediante configuración. El servicio de generación no debe conocer detalles HTTP, URLs ni credenciales del proveedor."

*Resultado:*
- Se mantuvo `LLMGateway`.
- Se añadió `OpenRouterLlmGateway`.
- La selección se realiza mediante `LLM_PROVIDER`.
- El mock continúa siendo la opción por defecto.
- Las credenciales solo se leen desde variables de entorno.
- El dominio continúa recibiendo `BusinessProfileContext`.

### 4. Prompting estructurado y grounding

**Prompt utilizado: refinamiento de prompts**

"Mantén `BusinessProfile` como única fuente canónica. Refina `PromptBuilder` para que cada uno de los cinco tipos de asset tenga instrucciones específicas, exija JSON con `title` y `content`, prohíba inventar precios, servicios, certificaciones, clientes, métricas, horarios, localizaciones y contactos, y omita cualquier dato no disponible."

*Resultado:*
- `PROMPT_VERSION` pasó de `v1` a `v2`.
- `CONTEXT_VERSION` se mantiene en `v1`.
- Cada asset tiene instrucciones específicas.
- El prompt exige salida JSON controlada.
- El gateway real añade un system prompt de grounding.
- El contexto continúa derivándose exclusivamente del perfil aprobado.

### 5. Validación de outputs

**Prompt utilizado: validación de respuesta del proveedor**

"Valida el output antes de persistirlo como `Asset`. Comprueba JSON válido, `title`, `content`, tipos, contenido vacío, límites razonables, formato FAQ, límite de biografía social, límite de descripción de directorio, ausencia de scripts o markup peligroso y una referencia mínima al contexto canónico cuando se dispone de él. Si falla, registra la generación como fallida y no la persistas como asset válido."

*Resultado:*
- El gateway real solo convierte respuestas JSON con `title` y `content`.
- `OutputValidator` valida estructura y límites.
- FAQ exige marcadores de pregunta y respuesta.
- Se rechazan patrones básicos de script, `javascript:` y event handlers.
- Se comprueba grounding mínimo mediante nombre, categoría, servicio o producto del perfil.

### 6. Resiliencia y errores del proveedor

**Prompt utilizado: control de llamadas externas**

"Implementa llamadas HTTP controladas con timeout explícito, errores clasificados, retry limitado únicamente para errores transitorios, backoff, rate limit, respuestas vacías, JSON malformado, errores de autenticación y proveedor no disponible. No expongas secretos ni permitas que un fallo externo quede como excepción no controlada de infraestructura."

*Resultado:*
- Timeout configurable mediante `LLM_TIMEOUT_MS`.
- Retries configurables mediante `LLM_MAX_RETRIES`.
- Backoff exponencial limitado.
- Clasificación de timeout, red, autenticación, request inválida, rate limit, proveedor no disponible y respuesta malformada.
- El gateway no realiza peticiones si falta la API key.

### 7. Testing de la integración

**Prompt utilizado: tests sin consumo del proveedor**

"Añade tests deterministas para el gateway real usando `fetch` mockeado. Cubre respuesta JSON válida, respuesta malformada, error de autenticación, credenciales ausentes, timeout/rate limit cuando proceda y compatibilidad del pipeline existente con `MockLlmGateway`. No consumas créditos ni dependas de una API externa."

*Resultado:*
- Se añadieron tests unitarios de `OpenRouterLlmGateway`.
- Se mantienen los tests del mock y del pipeline.
- Se actualizó la expectativa de `promptVersion` a `v2`.
- No se ejecuta ninguna llamada externa durante los tests.

### 8. Comparativa Mock vs LLM real (Hito 3.3)

**Prompt utilizado: auditoría del estado actual**

"Lee `docs/FASE3-IMPLEMENTATION-CONTRACT.md` y revisa la implementación actual de `backend/src/ai-generation/`. Identifica requisitos explícitos relacionados con Mock vs LLM real, validación de outputs, grounding, trazabilidad, metadata y comparativas. No interpretes requisitos que no estén en el contrato como obligatorios."

*Resultado:* Se confirmó que el contrato exige coexistencia de ambos gateways (§21.2), Mock mantenido para tests/CI (§2.6), evidencia verificable de generación real (§19) y trazabilidad mediante `AIGeneration` (§6.3).

**Prompt utilizado: captura de evidencia experimental**

"Recupera de PostgreSQL los registros del BusinessProfile 'Café Central Madrid' y sus `AIGeneration` y `Asset` asociados. Verifica que los 5 outputs reales del Hito 3.2 siguen disponibles mediante `responseSnapshot`. Ejecuta una generación completa con `LLM_PROVIDER=mock` utilizando el mismo BusinessProfile. Captura la evidencia de ambas ejecuciones: assetType, status, title, content, tokensUsed, modelUsed, promptVersion, contextVersion, timestamps. Compara los outputs Mock v1 históricos con los Mock v2 actuales para verificar determinismo."

*Resultado:*
- Los 5 outputs reales de 3.2 están disponibles en `AIGeneration.responseSnapshot`.
- Se ejecutó Mock con el mismo BusinessProfile y `promptVersion=v2`.
- Se verificó que los outputs Mock v1 (históricos) y v2 (actuales) son idénticos.
- Se verificó que `contextSnapshot` y `promptSnapshot` son idénticos entre Mock y Real para los 5 assets.

**Prompt utilizado: evaluación cualitativa asistida por LLM**

"Evalúa cada uno de los 10 outputs existentes (5 Mock + 5 Real) desde cuatro dimensiones: Grounding (Adecuado/Parcial/Problemático), Coherencia (Adecuada/Mejorable/Problemática), Utilidad (Alta/Media/Baja) y Tono (Adecuado/Parcialmente adecuado/Inadecuado). Utiliza únicamente el BusinessProfile como referencia de verdad. No generes nuevos outputs. No asignes puntuaciones numéricas. No declares un ganador. Documenta únicamente diferencias observables."

*Resultado:* 10 outputs evaluados. Grounding: 7 Adecuado, 3 Parcial. Coherencia: 10 Adecuada. Utilidad: 5 Media (Mock), 5 Alta (Real). Tono: 4 Parcialmente adecuado (Mock), 6 Adecuado (Real).

**Restricciones metodológicas:** Evaluación realizada por un LLM (MiMo v2.5), no por un evaluador humano. Una única ejecución del evaluador. n=10 outputs. No constituye evaluación humana ni métrica objetiva.

**Referencia completa:** [`docs/evidence-3.3-comparison.md`](docs/evidence-3.3-comparison.md)

### 9. Datos enviados al proveedor LLM (Hito 3.5 — minimización)

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

Los campos `phone`, `website` y `gdprConsent` se excluyen del contexto LLM según el principio de minimización de datos. Tampoco aparecen en `contextSnapshot` ni `promptSnapshot`.

**Commit:** `7b7449f` — `fix: harden security and privacy`

### 10. CI/CD y despliegue

**Prompt documentado de forma resumida a partir del historial Git.**

El prompt solicitó crear un workflow de GitHub Actions que:
- se ejecutara en push y pull request contra `finalproject-MGB`;
- incluyera un servicio PostgreSQL (`postgres:16-alpine`) como servicio del pipeline;
- utilizara `LLM_PROVIDER=mock` para evitar consumo de credenciales reales;
- ejecutara install, lint, typecheck, tests unitarios, migraciones, database E2E y build.

**Commit:** `2d768ee` — `ci: add GitHub Actions workflow for automated quality checks`

**Commit:** `c51ba61` — `fix: prepare repository for production deployment`

### 11. UX — estados de carga

**Prompt documentado de forma resumida a partir del historial Git.**

Se solicitó añadir estados de carga a las acciones asíncronas del frontend: generación de assets, regeneración de asset, aprobación de perfil y cualquier operación HTTP que el usuario pudiera disparar.

**Commit:** `325961d` — `fix(frontend): add loading states to async actions`

### 12. Groq como proveedor de producción (Hito 3.7)

**Prompt documentado de forma resumida a partir del historial Git.**

Se solicitó implementar un nuevo gateway `GroqLlmGateway` que:
- siguiera la interfaz `LLMGateway` existente;
- se integrara en el pipeline sin modificar dominio ni arquitectura;
- estuviera seleccionable mediante `LLM_PROVIDER=groq`;
- preservara `MockLlmGateway` y `OpenRouterLlmGateway` sin cambios;
- incluyera instrumentación de tokens, latencia y rate-limit headers;
- implementara clasificación de errores con códigos tipados y retry logic;
- utilizara structured output con JSON Schema strict mode.

**Commit:** `a86dd4b` — `feat: add GroqLlmGateway for experimental Groq provider`

**Commit:** `004a24b` — `fix: hardcode Groq base URL to avoid OpenRouter collision`

### 13. Validación E2E desplegada

Se ejecutó manualmente el flujo completo contra la API desplegada en Render con Groq (`openai/gpt-oss-120b`): Register → Login → Create Business → Discovery → Approve Profile → Generate (5 assets) → Edit → Regenerate → Verificar estado final. Todas las etapas PASS.

**Observaciones:** 3,570 tokens totales, ~5s generación, ~1s regeneración, 0 errores del proveedor. Una única ejecución; no constituye benchmark.

---

## Global Traceability

| Entrega | Objetivo | Evidencia |
|---|---|---|
| Entrega 1 | Definición del producto, arquitectura, datos, API, historias, tickets, PR | [`docs/prompts-entrega-1.md`](docs/prompts-entrega-1.md) |
| Entrega 2 | Implementación, testing, validación, hardening | [`docs/prompts-entrega-2.md`](docs/prompts-entrega-2.md), [`docs/ENTREGA2-IMPLEMENTATION-CONTRACT.md`](docs/ENTREGA2-IMPLEMENTATION-CONTRACT.md) |
| Entrega 3 / Fase 3 | LLM gateways, Groq, CI/CD, deployment, E2E | [`docs/prompts-entrega-3.md`](docs/prompts-entrega-3.md), [`docs/FASE3-IMPLEMENTATION-CONTRACT.md`](docs/FASE3-IMPLEMENTATION-CONTRACT.md), [`docs/evidence-3.3-comparison.md`](docs/evidence-3.3-comparison.md), [`docs/evidence-3.7-groq.md`](docs/evidence-3.7-groq.md) |

---

## Methodological Notes

- **Entrega 1 prompts** were designed to translate directly into concrete, measurable artifacts (architecture diagrams, data models, API specs, user stories, tickets).
- **Entrega 2 prompts** followed the cycle: `Audit → Specification → Implementation → Validation → Correction → Re-validation`. All generated code was reviewed and corrected by a human before integration.
- **Entrega 3 prompts (sections 1–9)** are documented literally. **Sections 10–13** are synthesis from git history, commits, and evidence — the exact prompts were not preserved during implementation.
- **Human-in-the-loop** was maintained throughout: AI outputs were always reviewed, validated against requirements, and corrected before being considered definitive.
- **Provider history:** OpenRouter (Hito 3.2, historical) → Groq (Hito 3.7, current production). Mock remains for CI/tests.
- **No prompts were invented.** All content in this document is extracted directly from the three source documents or from verifiable git history and evidence.
