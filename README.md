# Formato Universal y Solicitud de Crédito de Vehículo — App de Diligenciamiento

Aplicación web (React + TypeScript + Vite) para diligenciar digitalmente el
formulario `SSF_UNIVERSAL.pdf` y generar un PDF final idéntico al original
(mismas 2 páginas, mismo diseño), usando **campos de formulario PDF reales
(AcroForm)** creados con `pdf-lib` sobre una copia del PDF original.

**Arquitectura**: el PDF original nunca se redibuja ni se reconstruye. Sobre
cada espacio en blanco se crea un campo AcroForm real (texto o casilla),
transparente (sin fondo ni borde propio), y se le asigna el valor
diligenciado por el usuario. El documento nunca se dibuja con
`page.drawText()`; todo el texto vive dentro de campos de formulario PDF
reales, verificables con cualquier lector de PDF o herramienta como `pdftk`.

## Cómo ejecutar

Requisitos: Node.js 18+ y npm.

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (por defecto http://localhost:5173).

Para generar una build de producción:

```bash
npm run build
npm run preview
```

## Estructura del proyecto

```
/src
  /components   Componentes de UI (campos, pasos, revisión, vista previa)
  /config       pdfFieldMapping.ts (coordenadas de cada campo sobre el PDF)
                sections.ts (estructura de las 10 secciones del formulario)
  /hooks        useDraft.ts (guardado automático en localStorage)
  /services     pdfGenerator.ts (generación del PDF final con pdf-lib)
  /utils        validation.ts (validaciones de campos)
/public/templates/formulario-original.pdf   Plantilla PDF original (NO modificar)
```

## Ajustar la posición o tamaño de un campo

Todas las coordenadas están centralizadas en:
`src/config/pdfFieldMapping.ts`

Este archivo **NO** define posiciones de texto dibujado — define el
**rectángulo** de cada campo AcroForm: `x`, `y` (esquina inferior izquierda,
en puntos PDF), `width`, `height`, `fontSize` y `align`. La aplicación usa
estos datos para crear los campos de formulario reales sobre el PDF. Si un
campo queda mal ubicado o su tamaño no es el adecuado, ajusta solo esos
valores para ese campo — no es necesario tocar ningún otro archivo.

## Flujo de la aplicación

Abrir → Diligenciar por secciones → Guardado automático de borrador →
Revisión final → **Generar PDF** (crea/llena los campos AcroForm) → Vista
previa del PDF real (2 páginas, el mismo archivo que se descarga) →
Aplanar (opcional, recomendado para impresión) → **Descargar PDF** →
Imprimir → Firma y huella físicas (los espacios quedan vacíos a propósito).

## Aplanado del PDF

En la vista previa hay una casilla "Aplanar PDF para impresión". Al
descargar con esta opción activa, los campos AcroForm se convierten en
contenido estático (`form.flatten()` de pdf-lib): dejan de ser editables,
el valor queda integrado visualmente, y el diseño original permanece
intacto. Sin aplanar, el PDF descargado conserva los campos como
formulario editable (útil si el usuario quiere corregir algo directamente
en Adobe Acrobat u otro lector compatible con AcroForm).

## Notas

- El PDF final conserva exactamente las 2 páginas y el diseño del original;
  los datos viven dentro de campos de formulario PDF reales (AcroForm),
  nunca como texto dibujado libremente sobre la página.
- El archivo `public/templates/formulario-original.pdf` nunca se modifica
  en disco: cada generación parte de sus bytes originales en memoria.
- Los espacios de Firma, Firma y CC, y Huella Dactilar NO tienen campo
  asociado a propósito — quedan siempre vacíos para diligenciarse
  físicamente después de imprimir.
- El borrador se guarda automáticamente en el navegador (localStorage);
  no se envía a ningún servidor.
- Verificado con `pdftk dump_data_fields` y con un segundo motor de
  renderizado (MuPDF) independiente de pdf-lib, para confirmar que los
  campos son AcroForm reales y que el diseño original no se altera.
- `pdfGenerator.ts` limpia automáticamente las anotaciones huérfanas que
  `form.flatten()` de pdf-lib deja en `/Annots` tras aplanar (no afectan
  la validez del PDF, pero algunos visores dibujan un resaltado gris de
  más para ellas); así el aplanado se ve idéntico en cualquier lector.
