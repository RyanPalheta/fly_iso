# Design System Document: The Sovereign Quality Standard

## 1. Overview & Creative North Star
### The Creative North Star: "The Architectural Curator"
In the high-stakes world of ISO 9001 compliance, clarity is not just an aesthetic choice—it is a functional requirement. However, "functional" does not mean "generic." This design system rejects the cluttered, line-heavy density of traditional enterprise software in favor of **The Architectural Curator**.

We treat information as a gallery space. By leveraging intentional asymmetry, expansive breathing room, and a sophisticated editorial type scale, we transform a "compliance tool" into an "authoritative experience." We break the standard SaaS template by replacing rigid 1px dividers with **Tonal Depth** and **Spatial Logic**, ensuring the user feels in control of a premium, high-integrity environment.

---

## 2. Colors & Surface Philosophy
The palette moves beyond "blue and gray." It utilizes a multi-tiered surface system to create a sense of physical architecture.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to define primary sections. 
*   **The Strategy:** Boundaries are created through background shifts. A `surface-container-low` sidebar sits against a `surface` main canvas. 
*   **The Benefit:** This removes visual "noise" and eye strain, allowing the data to take center stage.

### Surface Hierarchy & Nesting
Treat the UI as layered sheets of premium material.
*   **Base Layer (`surface`):** The primary application canvas.
*   **Mid Layer (`surface-container-low`):** Used for secondary navigation or side-panels.
*   **Top Layer (`surface-container-lowest`):** Reserved for primary data cards and interactive modals. This "brightest" white creates a natural "lift" against the gray-toned background.

### The "Glass & Gradient" Rule
To inject "soul" into the enterprise environment:
*   **Glassmorphism:** Use for floating notifications and dropdown menus. Apply `surface` color at 80% opacity with a `20px` backdrop-blur.
*   **Signature Gradients:** Primary CTAs should not be flat. Use a subtle linear gradient from `primary` (#004ac6) to `primary_container` (#2563eb) at a 135-degree angle to provide a sense of "active" energy.

---

## 3. Typography: Editorial Authority
We utilize a dual-typeface system to balance technical precision with executive authority.

*   **Display & Headlines (Manrope):** A geometric sans-serif with high legibility. Used for page titles and high-level metrics. The wide apertures feel modern and transparent—key for an ISO platform.
*   **Body & Labels (Inter):** The workhorse. Inter’s tall x-height ensures that complex data tables and multi-step forms remain readable at small sizes.

**Scale Highlight:**
*   **Display-LG (3.5rem):** Reserved for empty state heroes or dashboard welcome messages.
*   **Title-SM (1rem):** The standard for "Card Headers," providing a bold, clear anchor for content blocks.
*   **Label-SM (0.6875rem):** Used for micro-data and status pills, always set in Medium or Semi-Bold weight for crispness.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows often look "dirty" in minimal systems. We achieve depth through light and tone.

*   **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card on a `surface-container` background. The 2-3% difference in hex value creates a "cleaner" hierarchy than any drop-shadow could.
*   **Ambient Shadows:** For floating elements (Modals/Popovers), use: `box-shadow: 0 12px 40px rgba(25, 28, 29, 0.06);`. The shadow is tinted with the `on_surface` color, making it feel like a natural part of the environment.
*   **The "Ghost Border" Fallback:** If a divider is mandatory (e.g., in a dense data table), use `outline_variant` at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Refined Interaction

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`), `lg` (0.5rem) corner radius. Focus states use a 2px offset ring of `primary`.
*   **Secondary:** No background. Use `on_surface` text with the "Ghost Border" (15% `outline_variant`).

### Data Tables (The Core Component)
*   **No Vertical Lines:** Separate rows with a simple change in background color on hover (`surface-container-high`).
*   **Header:** Use `label-md` in `on_surface_variant` (all caps, 0.05em letter spacing) to distinguish from live data.

### Status Pills
*   **Styling:** Use a `full` (9999px) radius. 
*   **Coloration:** Instead of harsh red/green, use `error_container` with `on_error_container` text. The low-contrast "tone-on-tone" approach maintains the professional aesthetic while still communicating status.

### Horizontal Steppers
*   **The Logic:** Steppers should not be boxed. Use a thin `outline_variant` line at 20% opacity as the track, with `primary` circles for active states and `surface-dim` for upcoming steps.

### Input Fields
*   **The "Soft Inset" Look:** Use `surface-container-low` as the background for inputs instead of white. This makes the `surface-container-lowest` cards they sit on feel like the "primary container."

---

## 6. Do’s and Don'ts

### Do:
*   **Do** use whitespace as a separator. If you think you need a line, try adding 16px of padding instead.
*   **Do** use `primary` sparingly. It is a "surgical" accent for actions and indicators, not a background color.
*   **Do** align all text to a strict 4px baseline grid to maintain the "Editorial" feel.

### Don’t:
*   **Don’t** use pure black (#000000) for text. Use `on_surface` (#191C1D) for a softer, high-end feel.
*   **Don’t** use standard "Drop Shadows" from component libraries. Always use the Ambient Shadow spec defined in Section 4.
*   **Don’t** crowd the sidebar. ISO platforms are complex; give the navigation items room to "breathe" with a minimum of 12px vertical padding.

---

## 7. Signature Pattern: The "Focus Drawer"
For ISO audits and form-filling, avoid full-screen modals. Use a **Side Drawer** that slides from the right, occupying 40% of the screen. Use a `surface-container-lowest` background with a heavy `25px` backdrop-blur on the content behind it. This maintains context while providing a dedicated, high-focus workspace.