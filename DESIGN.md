---
name: Audio Visualizer
description: A modular-synth patch bay for shaping audio-reactive 3D video.
colors:
  patch-amber: "#ff8a3d"
  patch-amber-dim: "#7a4420"
  chassis-black: "#0a0a0d"
  panel-graphite: "#16161b"
  panel-graphite-raised: "#1f1f26"
  hairline-steel: "#2b2b33"
  cream-ink: "#f2ede2"
  steel-label: "#8b8a92"
typography:
  display:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.1
  body:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    letterSpacing: "0.08em"
rounded:
  panel: "10px"
  button: "12px"
  selector: "999px"
components:
  button-render:
    backgroundColor: "{colors.panel-graphite-raised}"
    textColor: "{colors.cream-ink}"
    rounded: "{rounded.button}"
    padding: "12px 24px"
  button-render-active:
    backgroundColor: "{colors.panel-graphite-raised}"
    textColor: "{colors.patch-amber}"
---

# Design System: Audio Visualizer

## Overview

**Creative North Star: "The Patch Bay"**

The editor reads as a rack of hardware modules bolted into a dark chassis, the way a Eurorack synthesizer or a mixing console is - not a web dashboard wearing dark mode. Every control is a physical instrument: rotary knobs instead of native range sliders, backlit segmented selector switches instead of dropdowns, a recessed "scope" screen for the live 3D preview, a jack-socket input for the audio file, and one large illuminated push-button to render. The metaphor is chosen deliberately over the more obvious "Winamp/Milkdrop visualizer skin" reference - it is fresher, and it maps 1:1 onto what the product actually does: turning knobs to shape a reactive output driven by an audio signal is the literal job of both a modular synth and this editor.

Confirmed rejections: no generic SaaS-dashboard chrome (soft cards, drop shadows on everything, pill buttons everywhere); no literal skeuomorphic photorealism (no fake wood grain or brushed-metal photo textures) - the hardware reference stays graphic and modern, closer to a well-designed plugin UI than a photo of a real rack.

**Key Characteristics:**
- Matte near-black chassis with graphite panel modules, each carrying a small silkscreened caps label
- One committed accent color (amber, the LED/patch-cable color), used only for lit/active states
- Custom rotary knobs and backlit selector switches replace every native form control
- A recessed "scope" bezel frames the live 3D preview like a hardware display
- Mono type for panel labels and numeric readouts; geometric sans for everything else

## Colors

A near-black instrument chassis with one committed amber accent; color intensity itself communicates "on/active" vs. "off/idle", the way an LED does.

### Primary
- **Patch Amber** (`#ff8a3d`): the single accent. Used for lit LED indicators, the active state of knobs and selector switches, focus rings, the progress bar, and the render button's glow. Confined to lit/active states only - an idle control shows the dim variant, never the full accent.
- **Patch Amber Dim** (`#7a4420`): the "unlit" variant of the accent - used on inactive indicators, idle knob arcs, and disabled affordances so the lit/unlit contrast itself reads as state.

### Neutral
- **Chassis Black** (`#0a0a0d`): page background, the outer rack frame.
- **Panel Graphite** (`#16161b`): the surface of each module/panel.
- **Panel Graphite Raised** (`#1f1f26`): knob bodies, button faces, and other "raised" control surfaces sitting on a panel.
- **Hairline Steel** (`#2b2b33`): borders, dividers, and the fine rule between panels (a machined seam, not a soft card border).
- **Cream Ink** (`#f2ede2`): primary text - a warm off-white, like silkscreen ink on a panel, never pure white.
- **Steel Label** (`#8b8a92`): secondary/label text - panel captions, helper copy, muted numeric readouts.

### Named Rules
**The Lit/Unlit Rule.** Amber only appears "on" (full saturation, glow) for the control the user is actively touching or a state that is genuinely active (rendering in progress, file loaded, selected option). Everything else shows the dim variant or no amber at all. Amber covering more than roughly half of any panel at rest is a violation.

## Typography

**Display/Body Font:** Space Grotesk (with system sans-serif fallback)
**Label/Mono Font:** IBM Plex Mono (with monospace fallback)

**Character:** Space Grotesk carries a geometric, slightly technical warmth for headings and body copy; IBM Plex Mono handles anything that reads as an instrument readout - panel captions, parameter values, timers, percentages - reinforcing the "silkscreened panel" feel without tipping into full retro pastiche.

### Hierarchy
- **Display** (Space Grotesk, 600, clamp(1.75rem, 3vw, 2.25rem), 1.1 line-height): page title only.
- **Title** (Space Grotesk, 600, 1rem): module/panel names when not using the caps label plate treatment.
- **Body** (Space Grotesk, 400, 0.9375rem, 1.5 line-height): descriptions, helper text, buttons.
- **Label** (IBM Plex Mono, 500, 0.6875rem, letter-spacing 0.08em, uppercase): panel caption plates (e.g. "SHAPE", "BAR COUNT", "OUTPUT").
- **Readout** (IBM Plex Mono, 500, 0.8125rem): live numeric values under knobs, progress percentage, resolution labels.

### Named Rules
**The Silkscreen Rule.** Any text identifying a control (not its value) is IBM Plex Mono, uppercase, letter-spaced, and Steel Label gray - it should read like paint stencilled onto a panel, never like a UI form label.

## Layout

A rack of modules on a dark chassis. Desktop: the "scope" module (live 3D preview) spans the full width near the top; control modules (Scene, Shape, Color, Motion, Output) sit in a responsive grid below it, each module a distinct bordered panel. Mobile: everything stacks single-column, scope first, output/render module last (it is the natural end of the signal chain). Spacing is generous between modules (chassis gaps, `16-24px`) and tighter within a module's own controls (`12-16px`), so the rack-of-separate-units feeling survives at every width.

## Elevation & Depth

Hybrid: panels themselves are flat (a matte graphite fill, no drop shadow) - depth comes from a hairline border plus a very subtle inner highlight, like a machined panel edge, not a floating card. Controls that are physically "raised" (knobs, buttons) get a soft outer shadow plus a subtle top highlight to read as tactile; the scope module is recessed instead, with an inward shadow so the preview reads as sunken behind glass. Active/lit states add an ambient amber glow (`box-shadow` blur, low opacity) rather than lifting the element - light, not elevation, signals "on".

### Shadow Vocabulary
- **panel-flat**: `border: 1px solid #2b2b33` only, no shadow - the resting state of every module.
- **control-raised**: `0 1px 0 rgba(255,255,255,0.04) inset, 0 2px 6px rgba(0,0,0,0.4)` - knob/button bodies at rest.
- **glow-active**: `0 0 16px rgba(255,138,61,0.45)` - added to whatever is lit (active knob, loaded input, rendering button).
- **scope-recessed**: `inset 0 2px 12px rgba(0,0,0,0.6)` - the preview bezel.

## Shapes

Modules use a modest corner radius (`10px`) - enough to feel machined/modern, not enough to feel like a soft app card. Knobs are perfect circles. The render button and other primary actions use a chunkier radius (`12px`) with a visible bevel. Selector switches (Scene, Resolution) are the one place a fuller pill radius (`999px`) is intentional - it is the real-world shape of a backlit rocker/segment switch, not a stylistic default. Small circular corner rivets (`4px`, subtle radial gradient) decorate the scope module's frame only, as the one signature ornamental detail - they must not spread to every panel.

## Components

### Knob (signature component)
An SVG rotary control: a circular body (Panel Graphite Raised, control-raised shadow), a thin track arc in Hairline Steel, and a value arc in Patch Amber that fills proportionally to the current value; a small indicator line marks the current angle. A mono readout of the live value sits directly below, with the caption plate (Label style) above. Drag vertically (or scroll) to adjust; focus/active state adds glow-active. This replaces every native `<input type="range">` in the editor.

### Segmented Selector
A row of backlit, pill-shaped (`999px`) buttons sharing one Hairline Steel outline, used for Scene (visualizer style) and Resolution. The selected segment fills Panel Graphite Raised with a Patch Amber label and glow-active; unselected segments show Steel Label text on transparent background.

### Input Jack (upload zone)
A circular dashed-ring drop target styled like a jack socket, with a small centered plug/waveform glyph. Once a file loads, the ring solidifies, a small signal-present dot lights (Patch Amber), and the filename appears in mono below.

### Render Button
A large, chunky, bevelled push-button (Panel Graphite Raised at rest). While idle it reads "RENDER" in Space Grotesk 600. While active it shows a live mono percentage readout, gains glow-active, and its fill pulses gently. Disabled state drops to a flat, unlit Panel Graphite with no bevel.

### Scope (preview module)
A recessed bezel (scope-recessed shadow, `10px` radius, corner rivets) framing the `@remotion/player` canvas. A thin amber hairline traces the inner edge only while the preview is actively playing.

## Do's and Don'ts

### Do:
- **Do** keep Patch Amber confined to lit/active states (Lit/Unlit Rule); an idle screen should show mostly graphite, steel, and cream ink.
- **Do** use IBM Plex Mono, uppercase, letter-spaced for every control caption (Silkscreen Rule).
- **Do** use the pill/`999px` radius only for backlit segmented selectors - it is a real switch shape, not a default corner style.
- **Do** give every "raised" control (knob, button) a tactile shadow; give the scope module a recessed one.

### Don't:
- **Don't** introduce a second saturated accent color competing with Patch Amber - this is a Committed, one-accent palette.
- **Don't** fall back to native `<input type="range">` sliders, plain `<select>` dropdowns, or generic rounded "card" containers with drop shadows - every control is a purpose-built instrument component.
- **Don't** render knobs or panels as photorealistic skeuomorphic textures (no wood grain, no photographic brushed metal) - the hardware language stays graphic/vector.
- **Don't** let corner rivets spread beyond the scope module frame; they are one signature detail, not a repeating pattern.
