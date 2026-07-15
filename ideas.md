# RapidVenta — Ideas de Diseño

## Tres enfoques posibles

### 1. Auction House Noir
**Probability: 0.07**
Fondo negro profundo, tipografía serif dorada, estética de sala de subastas Christie's/Sotheby's. Muy oscuro, muy exclusivo, pero puede sentirse pesado en dashboards.

### 2. Editorial Luxury (ELEGIDO)
**Probability: 0.04**
Blanco dominante con detalles azul marino y dorado. Inspirado en revistas de lujo como Architectural Digest y Robb Report. Limpio, editorial, con jerarquía tipográfica fuerte. Perfecto para plataforma de subastas premium que necesita transmitir confianza y claridad.

### 3. Digital Atelier
**Probability: 0.02**
Gris carbón + crema + oro. Estética de galería de arte contemporáneo. Muy artístico pero puede perder claridad en datos de subasta.

---

## Enfoque elegido: Editorial Luxury

### Design Movement
Luxury Editorial — inspirado en casas de subastas como Christie's, Sotheby's y Phillips, combinado con la claridad digital de plataformas fintech premium.

### Core Principles
1. **Claridad sobre ornamento**: Cada elemento tiene propósito. El espacio en blanco es un activo de diseño.
2. **Jerarquía editorial**: Los precios, countdowns y estados de subasta dominan visualmente sobre la descripción.
3. **Confianza a través del detalle**: Tipografía precisa, alineación perfecta, microinteracciones sutiles.
4. **Conversión sin agresividad**: Los CTAs son claros y dorados, pero no gritan — invitan.

### Color Philosophy
- **Azul marino profundo** `oklch(0.25 0.12 265)` — autoridad, confianza, profundidad. Usado en hero, navbar, fondos de sección oscura.
- **Dorado cálido** `oklch(0.72 0.14 72)` — exclusividad, valor, acción. Usado en CTAs, precios, badges, iconos de confianza.
- **Blanco puro** — respiro, limpieza, modernidad. Fondo principal.
- **Gris azulado suave** `oklch(0.97 0.008 220)` — secciones alternadas, cards, fondos secundarios.

### Layout Paradigm
Asimétrico-editorial: el hero usa composición diagonal con texto a la izquierda y espacio visual a la derecha. Las cards de lotes usan grid denso con jerarquía vertical clara. Los dashboards usan sidebar izquierdo con contenido principal expandido.

### Signature Elements
1. **Línea dorada fina** — separador horizontal de 1px en dorado que aparece bajo títulos de sección y en cards.
2. **Badge pill con pulso** — los badges LIVE usan un punto rojo animado con efecto pulse.
3. **Countdown en cajas oscuras** — cuatro cajas azul marino con números blancos grandes, separadas por dos puntos dorados.

### Interaction Philosophy
Las interacciones confirman valor: hover eleva cards con sombra suave, los botones tienen scale(0.97) en active, los dropdowns se despliegan con ease-out suave. Todo se siente deliberado, no reactivo.

### Animation
- Entradas: `opacity: 0 → 1` + `translateY(8px → 0)` en 200ms ease-out
- Cards hover: `translateY(-4px)` + sombra elevada en 160ms
- Botones active: `scale(0.97)` en 160ms ease-out
- Badge LIVE: `@keyframes pulse` en el punto rojo, 2s infinito
- Countdown: números actualizados con fade rápido 100ms
- Chatbot: slide-up desde abajo en 250ms

### Typography System
- **Playfair Display** (serif) — títulos hero, encabezados de sección, nombres de lotes destacados. Bold/Italic para énfasis.
- **Cormorant Garamond** (serif elegante) — subtítulos de sección, frases destacadas, citas.
- **Inter** (sans-serif) — navegación, precios, labels, formularios, datos, dashboards. Variable weight 400–700.

### Brand Essence
**RapidVenta** — La casa de subastas digitales para coleccionistas serios. Transparente, bilingüe, en tiempo real.
Personalidad: **Autoritativa · Transparente · Exclusiva**

### Brand Voice
- Titular: "Descubre, puja y vende piezas excepcionales con verificación experta."
- CTA: "Explorar subastas" / "Comenzar venta"
- Prohibido: "Bienvenido a nuestra plataforma" / "Haz click aquí"

### Wordmark & Logo
Símbolo: martillo de subasta estilizado en dorado sobre fondo azul marino oscuro. Sin texto en el símbolo.

### Signature Brand Color
**Dorado cálido** `oklch(0.72 0.14 72)` — el color que identifica a RapidVenta en cualquier contexto.

---

## Style Decisions
- Usar Playfair Display para todos los títulos de sección (h2) y nombres de lotes en cards.
- El countdown siempre usa cajas oscuras azul marino excepto sobre imágenes donde usa la variante píldora blanca.
- Los precios siempre en dorado con Inter Bold.
- Las sombras de cards: `0 2px 8px rgba(0,0,0,0.08)` en reposo, `0 8px 24px rgba(0,0,0,0.15)` en hover.
- Bordes redondeados: `0.5rem` para cards, `0.375rem` para botones, `9999px` para badges/pills.
