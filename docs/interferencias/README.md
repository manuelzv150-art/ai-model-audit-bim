# AI model audit

Revisión de entregas BIM con IA: compara dos versiones IFC contra el BEP y las actas de coordinación, con evidencia por elemento.

**Lo que cambió. Lo que falta. La evidencia.**

## Qué contiene

Un solo archivo, `index.html`, con dos partes:

- **Sitio**: problema, solución, integración de IA, mercado, precio y solicitud de piloto.
- **Prototipo navegable** (botón «Probar la demo»): el flujo principal de la solución.
  1. **Entrega**: carga de V01, V02 y los acuerdos escritos. Los archivos se leen en el navegador; no se suben a ningún servidor.
  2. **Requisitos**: la IA propone reglas a partir del BEP y las actas; el coordinador las aprueba, corrige o devuelve.
  3. **Visor**: modelo 3D por estado de cambio o de cumplimiento, con la vista Antes · Ahora · Esperado por elemento.
  4. **Avance**: información y geometría por separado, con alerta de retrocesos.
  5. **Reporte**: observaciones con evidencia, descargables en CSV y HTML, más el registro de medición para el Kit.

El botón «Recorrido» guía las 4 tareas de la prueba con coordinadores (T1 a T4) y mide el tiempo de cada una.

## Visor IFC

- **Geometría real**: con archivos propios, el visor lee la geometría del IFC con [web-ifc](https://github.com/ThatOpen/engine_web-ifc) (se descarga solo al abrir el visor y corre en el navegador). Las partes agregadas (muros cortina, escaleras) se asignan a su elemento.
- **Respaldo**: si el IFC no trae geometría (como el caso de ejemplo) o no hay conexión, se usa la vista simplificada con una caja por elemento.
- **Herramientas**: vistas 3D, planta y elevación; encuadrar selección; rayos X; aristas; colores del modelo; corte horizontal; captura PNG; pantalla completa. Girar con clic izquierdo, desplazar con clic derecho o Shift, zoom con la rueda.
- Los elementos eliminados se muestran con la geometría de V01; los movidos, con un fantasma punteado de su posición anterior.
- `ifc_prueba/` contiene dos IFC sintéticos con geometría para probar el visor.

## Planes

| Plan | Precio (hipótesis H4) | Incluye |
|---|---|---|
| **Comparador** | US$ 90 / proyecto-mes, sin configuración | Comparación V01 frente a V02, visor 3D de cambios y reporte de cambios |
| **Auditoría IA** | US$ 180 / proyecto-mes + US$ 250 de configuración | Comparador + reglas propuestas por IA desde el BEP y las actas, cumplimiento, retrocesos, avance y reporte de observaciones |
| **Plus** | US$ 260 / proyecto-mes + US$ 250 de configuración | Auditoría IA + visor de interferencias, reglas de interferencia con IA, tablero y BCF 2.1 |

La demo de `index.html` tiene dos botones arriba: **Avance del modelo** (Comparador y Auditoría IA, pasos 1 a 5) e **Interferencias** (plan Plus), que abre el visor de interferencias dentro de la demo con los modelos ya cargados. La calculadora de la sección de planes usa el precio del plan elegido.

## Visor de interferencias (Plan Plus)

Página `interferencias.html`, que la demo muestra en el botón **Interferencias**; también funciona sola.

- **Carga**: la nueva entrega (V02, obligatoria) y la anterior (V01, opcional). Botón **Usar caso de ejemplo** (o `interferencias.html#ejemplo`).
- **Reglas** por disciplina (MEP, Estructura, Arquitectura) o por clase IFC (ductos, tuberías, vigas, muros, columnas…), activables y con holgura editable.
- **Proponer reglas con IA** (mismo botón del paso 2 de la demo): la IA lee el **BEP y las actas** de la revisión (o un texto pegado) o su **matriz en CSV o Excel**, convierte cada requisito de interferencia en una regla y la deja «por aprobar». Nada se verifica sin aprobación. Sin IA conectada, un asistente local interpreta la matriz por palabras clave (aproximado). Ejemplo: `ifc_prueba/matriz_interferencias_ejemplo.xlsx` y `.csv` (también «Usar matriz de ejemplo» dentro del visor).
- **Motor determinista**: filtro por cajas envolventes y prueba exacta entre triángulos. Un choque duro exige penetración mayor a 1 mm; también detecta elementos contenidos dentro de otros. La holgura se mide entre cajas envolventes (aproximada).
- **V02 frente a V01**: cada interferencia queda como Nueva, Activa o Resuelta; los contadores también filtran.
- **Visor**: color por estado o por disciplina; A en rojo y B en ámbar, visibles a través de muros; rayos X, aislar el par, corte, vistas, captura y pantalla completa; flechas ← → para recorrer.
- **Tablero** (botón TABLERO junto a VISOR 3D): indicadores (activas, nuevas, persisten, resueltas, choques duros, holguras, elementos involucrados y % de corrección), anillos por estado y por disciplina, comparación entre entregas, barras por regla, por nivel, por gestión y elementos con más choques. Filtros por nivel, regla, tipo, estado y gestión; un clic en un segmento o barra filtra también la lista, y un clic en un elemento lo abre en el visor 3D.
- **Exportación**: BCF 2.1 (`.bcfzip`, validado contra los esquemas oficiales de buildingSMART), reporte HTML con capturas y CSV. Dentro de Claude el BCF se descarga como `.bcf.zip` (renómbrelo a `.bcfzip` si su programa lo pide).
- Archivos de prueba: `ifc_prueba/V01_interferencias.ifc` y `V02_interferencias.ifc` (5 nuevas, 2 activas, 2 resueltas).

## Sobre la IA en esta versión publicada

- Con el **caso de ejemplo**, la propuesta de reglas es una respuesta de IA pregrabada (modo demostración).
- Con **archivos propios**, sin conexión a un modelo, se usa un asistente local aproximado por coincidencia de palabras.
- Dentro de Claude, la misma página llama al modelo en vivo.

En todos los casos la IA solo propone: ninguna regla se verifica sin aprobación humana, y el cumplimiento lo calcula un motor determinista.

## Transparencia

Los datos del caso de ejemplo son sintéticos. Las cifras de mercado citan su fuente; precios, ahorros y escenarios son supuestos en validación. Claude (Anthropic) apoyó el código y la redacción, con revisión del equipo.

## Equipo

- Manuel Daniel Bencomo Rojas
- Rainer Luice Murrieta Huaranca

Diplomado Internacional IA en Ingeniería y Construcción, AECODE ED.03. Eje Startup, Hito 2.
