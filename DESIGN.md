---
name: Site-81 Terminal
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#b9ccb2'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#84967e'
  outline-variant: '#3b4b37'
  surface-tint: '#00e639'
  primary: '#ebffe2'
  on-primary: '#003907'
  primary-container: '#00ff41'
  on-primary-container: '#007117'
  inverse-primary: '#006e16'
  secondary: '#ffd393'
  on-secondary: '#432c00'
  secondary-container: '#fdaf00'
  on-secondary-container: '#694600'
  tertiary: '#fff7f6'
  on-tertiary: '#690100'
  tertiary-container: '#ffd2cb'
  on-tertiary-container: '#c40100'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#72ff70'
  primary-fixed-dim: '#00e639'
  on-primary-fixed: '#002203'
  on-primary-fixed-variant: '#00530e'
  secondary-fixed: '#ffddaf'
  secondary-fixed-dim: '#ffba43'
  on-secondary-fixed: '#281800'
  on-secondary-fixed-variant: '#614000'
  tertiary-fixed: '#ffdad4'
  tertiary-fixed-dim: '#ffb4a8'
  on-tertiary-fixed: '#410000'
  on-tertiary-fixed-variant: '#930100'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-lg:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  border-thick: 2px
  border-thin: 1px
---

## Brand & Style
The design system embodies a high-security, retro-futuristic terminal aesthetic tailored for the SCP Foundation’s internal database. It draws heavily from **Brutalism** and **Terminal UI** philosophies, emphasizing raw functionality, information density, and an atmosphere of bureaucratic secrecy.

The UI should evoke a sense of "Controlled Chaos"—a system designed for high-stakes containment and technical data processing. Visuals must feel industrial and slightly dated yet technologically advanced, mimicking a 1980s mainframe interface optimized for modern high-resolution displays. Key characteristics include:
- **Monochrome Dominance:** A primary focus on dark-state values to reduce eye strain in windowless containment sites.
- **Tactical Utility:** Every element serves a purpose; ornamentation is limited to structural reinforcement or security status signaling.
- **Digital Decay:** Subtle references to analog hardware, such as scanlines and slight CRT phosphor persistence.

## Colors
The palette is rooted in a "Phosphor-on-Black" scheme to maximize contrast and reinforce the terminal aesthetic.

- **Primary (Matrix Green):** Used for standard text, active states, and successful system pings. It should feel like a glowing CRT beam.
- **Secondary (Warning Amber):** Reserved for classified warnings, Level 4 clearance headers, and non-critical system alerts.
- **Tertiary (Containment Breach Red):** Used exclusively for SCP object class "Keter" designations, active breaches, and critical error states.
- **Backgrounds:** The foundation is absolute black (`#000000`), with `#0D0D0D` used for structural panels to maintain a deep, infinite depth.

## Typography
Typography is strictly monospaced to ensure data alignment and a technical, programmatic feel. 

- **JetBrains Mono** is the workhorse, chosen for its exceptional legibility in dense data environments and its modern-technical construction.
- **Space Mono** is utilized for labels and metadata to provide a subtle geometric variation in bureaucratic forms.
- **Styling:** All headers should be uppercase. Technical data should be presented in "code-sm" to allow for maximum information density on "Classified" file pages.

## Layout & Spacing
The layout follows a **Fixed Grid** system that feels like a rigid hardware frame. 

- **The Terminal Frame:** All content is encased in a primary 2px border with "bracketed" corners. 
- **Modular Blocks:** Information is partitioned into distinct rectangular modules. Avoid fluid, airy layouts; instead, pack components tightly using 4px increments to simulate a data-rich terminal environment.
- **Breaks:** Use horizontal rules (`<hr>`) composed of repeating characters (e.g., `_` or `=`) to separate sections, rather than whitespace.
- **Mobile Adaption:** On mobile, the multi-column technical data stacks into a single "Command Line" vertical flow.

## Elevation & Depth
In this design system, depth is achieved through **Tonal Layering** and **Luminance**, rather than shadows. 

- **Layering:** Level 0 is the black void. Level 1 is a dark charcoal surface (`#121212`) for containers. 
- **Glow & Bloom:** Depth is suggested by the intensity of the text glow. Interactive elements have a subtle "outer glow" (bloom) effect using the primary color at low opacity.
- **Scanlines:** A global overlay of 1px semi-transparent horizontal lines (scanlines) should be applied to the entire viewport to simulate a CRT glass screen.
- **Borders:** Instead of shadows, use high-contrast outlines to define hierarchy. Active windows receive a 2px solid primary-color border; inactive windows use a 1px dimmed grey border.

## Shapes
The shape language is strictly **Sharp (0px)**. 

Curves are perceived as soft and "consumer-friendly," which contradicts the industrial, secure nature of the Foundation. All buttons, containers, and input fields must have 90-degree corners. 

- **Inverted Corners:** For high-clearance buttons, use an "inverted-ear" corner (clipped at 45 degrees) to suggest specialized military or industrial hardware.
- **Pixelation:** Small UI accents, like checkboxes or loading bars, should use blocky, pixelated shapes.

## Components
- **Buttons:** Rectangular with a 1px border. The default state is a stroke-only; the hover state is a full color fill with black text (inverted).
- **Input Fields:** Styled as command-line prompts. Every input should be preceded by a `>` character. Use a blinking block cursor for active focus.
- **Cards (Containment Files):** Feature a header block with "CLASSIFIED" or "TOP SECRET" watermarks. Include a small, low-resolution "dithered" image placeholder for SCP objects.
- **Progress Bars:** Constructed of individual blocks `[██████░░░░]`.
- **Chips/Labels:** Small, solid-fill rectangles with uppercase text. Used primarily for "Object Class" (e.g., [EUCLID]).
- **Security Checkboxes:** Large, blocky squares that fill with an `X` when selected, mimicking old digital forms.
- **Data Tables:** Heavy use of vertical and horizontal lines to create a rigid spreadsheet look. No zebra-striping; use line borders only.