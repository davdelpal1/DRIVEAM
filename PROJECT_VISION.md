# PROJECT_VISION.md

# Visión de producto — DRIVEAM

---

## 1. Visión

Crear una plataforma que se convierta en el **asistente de decisión de compra de vehículos de ocasión** del usuario.

No queremos limitar el producto a mostrar anuncios.

Queremos responder a una pregunta mucho más valiosa:

> **¿Cuál de estos coches debería comprar y por qué?**

---

## 2. Origen del problema

El proyecto nace durante un proceso real de búsqueda de un vehículo de ocasión con requisitos como:

- vehículo relativamente reciente;
- kilometraje contenido;
- buena relación calidad/precio;
- consumo reducido;
- buena reputación mecánica;
- posibilidad de financiación;
- presupuesto limitado;
- necesidad de comparar ofertas de diferentes webs.

Actualmente esa información está fragmentada.

Cada portal tiene:

- diferentes filtros;
- diferente estructura;
- diferentes condiciones;
- diferentes precios;
- distintas formas de mostrar la financiación.

El usuario termina tomando decisiones mediante múltiples pestañas, capturas, notas y hojas de cálculo.

---

## 3. Producto que queremos construir

DRIVEAM será una capa inteligente situada por encima de las distintas fuentes de vehículos.

```text
FUENTES
  ↓
INGESTA
  ↓
NORMALIZACIÓN
  ↓
BASE DE DATOS
  ↓
ANÁLISIS
  ↓
COMPARACIÓN
  ↓
RECOMENDACIÓN
```

El valor no reside únicamente en obtener datos.

El valor reside en **convertir esos datos en una decisión comprensible**.

---

## 4. Usuario objetivo inicial

### Usuario 0

El propio creador del proyecto.

Este usuario servirá para validar:

- qué información resulta realmente útil;
- qué filtros se utilizan;
- qué comparaciones importan;
- qué información falta en los portales;
- qué partes del proceso generan más fricción.

### Usuario objetivo futuro

Persona que:

- quiere comprar un coche usado;
- compara múltiples portales;
- no domina necesariamente la mecánica;
- tiene un presupuesto determinado;
- quiere evitar una mala compra;
- necesita entender financiación, consumo y coste;
- desea seguir varios candidatos durante días o semanas.

---

## 5. Jobs To Be Done

### JTBD 1

> Cuando encuentro un coche interesante, quiero guardarlo rápidamente para no perderlo.

### JTBD 2

> Cuando tengo varios candidatos, quiero compararlos objetivamente.

### JTBD 3

> Cuando un concesionario me ofrece financiación, quiero saber cuánto terminaré pagando realmente.

### JTBD 4

> Cuando veo un coche barato, quiero saber si es una oportunidad o existe una razón que justifica ese precio.

### JTBD 5

> Cuando llevo varios días buscando, quiero saber qué anuncios han bajado de precio.

### JTBD 6

> Cuando un mismo coche está publicado en varios sitios, quiero conocer dónde está más barato.

### JTBD 7

> Cuando tengo dudas entre vehículos, quiero una explicación sencilla adaptada a mis prioridades.

---

## 6. Pilares del producto

### 6.1 Agregación

Centralizar vehículos procedentes de fuentes heterogéneas.

### 6.2 Normalización

Traducir formatos diferentes a un modelo de datos común.

### 6.3 Comparación

Permitir comparar vehículos en igualdad de condiciones.

### 6.4 Contexto

Un precio aislado no significa mucho.

El producto debe contextualizar:

- año;
- kilómetros;
- motor;
- mercado;
- equipamiento;
- vendedor;
- garantía;
- financiación.

### 6.5 Personalización

El mejor coche no es igual para todos.

Cada usuario podrá definir prioridades.

### 6.6 Explicabilidad

Cada score o recomendación debe poder explicarse.

Evitar:

> Score: 91.

Preferir:

> Score: 91 porque está por debajo del precio de mercado, tiene pocos kilómetros y un buen coste estimado de uso.

### 6.7 Confianza

Nunca esconder:

- origen del dato;
- fecha de actualización;
- limitaciones;
- estimaciones;
- incertidumbre.

---

## 7. Car Score

El `Car Score` será una puntuación de ayuda a la decisión.

No debe presentarse como una verdad absoluta.

### Factores iniciales

Ejemplo:

| Factor | Peso inicial |
|---|---:|
| Precio respecto al mercado | 25 % |
| Kilometraje | 20 % |
| Antigüedad | 15 % |
| Fiabilidad | 15 % |
| Consumo | 10 % |
| Financiación | 10 % |
| Garantía / vendedor | 5 % |

Los pesos deberán ser:

- configurables;
- versionados;
- explicables.

### Evolución

#### V1

Reglas deterministas.

#### V2

Normalización estadística.

#### V3

Modelos entrenados con datos históricos.

#### V4

Personalización avanzada.

Nunca debemos utilizar IA generativa para inventar datos técnicos o precios.

---

## 8. Financiación como diferenciador

La aplicación debe distinguir claramente:

- precio al contado;
- precio financiado anunciado;
- entrada;
- importe financiado;
- número de cuotas;
- cuota;
- comisión;
- TIN;
- TAE;
- cuota final;
- servicios obligatorios;
- coste total.

Objetivo:

> Mostrar cuánto cuesta realmente el coche.

---

## 9. Historial del anuncio

Cada captura relevante de un anuncio puede generar un `ListingSnapshot`.

Ejemplo:

```text
12/08    11.490 €
18/08    10.990 €
25/08    10.490 €
```

Esto permitirá:

- detectar bajadas;
- calcular días anunciado;
- estudiar tendencia;
- mejorar negociación;
- generar alertas.

---

## 10. Detección de duplicados

El mismo vehículo puede aparecer en diferentes webs.

La plataforma deberá evolucionar hacia un sistema de deduplicación usando señales como:

- matrícula cuando legal y disponible;
- VIN cuando exista;
- vendedor;
- modelo;
- versión;
- año;
- kilómetros;
- precio;
- ubicación;
- fotografías mediante hashes;
- texto descriptivo.

El sistema debe almacenar un nivel de confianza.

Nunca fusionar automáticamente dos vehículos con baja confianza.

---

## 11. IA

La IA será una capa posterior.

No es requisito para validar el producto.

### Casos de uso futuros

- explicar comparaciones;
- resumir ventajas e inconvenientes;
- generar preguntas para el vendedor;
- detectar datos sospechosos;
- interpretar descripciones;
- ayudar al usuario a definir sus prioridades;
- responder preguntas sobre candidatos guardados.

Ejemplo:

> “De estos cuatro coches, ¿cuál encaja mejor si hago 25.000 km al año?”

La IA debe trabajar siempre sobre datos estructurados de la plataforma.

---

## 12. Lo que NO queremos ser

No queremos ser únicamente:

- un scraper;
- un listado de enlaces;
- un clon de un portal de anuncios;
- una página llena de publicidad;
- un marketplace desde el primer día;
- un producto dependiente de una única fuente.

---

## 13. Estrategia de datos

Cada fuente tendrá una estrategia explícita.

Posibles métodos:

```text
API
FEED
AFFILIATE
USER_IMPORT
MANUAL
SCRAPER
```

Metadatos mínimos:

```text
source
integration_type
commercial_use
images_allowed
refresh_policy
legal_notes
enabled
```

Un scraper es una implementación.

No forma parte del dominio principal.

---

## 14. Principios legales y comerciales

Para una integración pública se revisará individualmente cada proveedor.

Una fuente no se considerará apta para producción hasta validar:

- derecho de acceso;
- derecho de almacenamiento;
- derecho de redistribución;
- derecho de uso de imágenes;
- uso comercial;
- atribución;
- límites de peticiones;
- condiciones de API o feed.

La versión personal y la versión pública pueden tener conjuntos de fuentes distintos.

---

## 15. Estrategia web

La web será inicialmente una aplicación privada.

Posteriormente podrá incluir páginas indexables:

```text
/coches/
/coches/seat/
/coches/seat/leon/
/coches/diesel/
/coches-segunda-mano/sevilla/
/guias/financiar-coche-segunda-mano/
```

El SEO será una fase de crecimiento, no una dependencia del MVP.

---

## 16. Estrategia móvil

No se desarrollará una app nativa desde el primer día.

Orden:

1. Web responsive.
2. PWA si aporta valor.
3. React Native + Expo.
4. Publicación en Play Store.
5. Publicación en App Store.

Función móvil clave:

```text
Portal de coches
    ↓
Compartir
    ↓
DRIVEAM
    ↓
Guardar candidato
```

---

## 17. Posibles modelos de negocio futuros

No son objetivos del MVP.

### Afiliación

Comisiones por leads o servicios.

### Premium

- alertas avanzadas;
- mayor número de candidatos;
- análisis históricos;
- informes;
- seguimiento automático.

### Servicios complementarios

- informe del vehículo;
- financiación;
- seguros;
- inspección previa;
- transporte.

### B2B

Herramientas para concesionarios.

Nunca comprometer la imparcialidad del ranking por monetización.

Los resultados patrocinados deberán identificarse.

---

## 18. Métrica norte

En una primera fase:

> **Número de decisiones de compra ayudadas por la plataforma.**

Métricas operativas:

- vehículos guardados;
- comparaciones realizadas;
- usuarios que vuelven;
- alertas consultadas;
- anuncios importados correctamente;
- candidatos descartados;
- candidatos marcados como “ir a ver”;
- compra finalmente realizada.

---

## 19. Definición de éxito del MVP

El MVP habrá tenido éxito si durante una búsqueda real:

1. sustituye a notas y pestañas del navegador;
2. permite comparar candidatos más rápido;
3. facilita descartar coches;
4. identifica al menos una diferencia importante que inicialmente no era evidente;
5. ayuda a tomar una decisión con mayor confianza.

---

## 20. Principio rector

> **Primero construimos una herramienta que nosotros mismos queramos utilizar cada día. Después la convertimos en producto.**
