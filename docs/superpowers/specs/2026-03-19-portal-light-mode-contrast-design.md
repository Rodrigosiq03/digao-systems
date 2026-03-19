# Portal Light Mode Contrast Design

## Context
The portal visual direction is approved, but the light theme still loses readability in a few key places:
- muted copy over gradient-backed areas is too faint
- sidebar branding (`Control Center`) lacks enough contrast in light mode
- home page support copy and role chips blend into white surfaces
- user status badges and small info cards look tuned for dark mode, not light mode

## Goals
- improve contrast in light mode without undoing the approved dark mode
- give mini cards and chips visible surfaces in light mode
- keep the same overall visual language and layout
- solve the issue through shared tokens and shared components rather than page-specific hacks

## Non-Goals
- redesigning the portal palette from scratch
- changing the approved dark mode treatment
- introducing a new component library for this pass

## Design

### Global tokens
- strengthen light-mode `--muted` so supporting text survives over gradients
- slightly strengthen light-mode borders and card contrast
- preserve dark-mode token values

### Shared components
- light-mode `StatusBadge` gets proper bordered tinted backgrounds instead of very faint translucent fills
- reusable chips/badges in the home page get a visible surface and border in light mode
- small content cards inside user cards get a dedicated light-mode surface instead of `bg-black/10`

### Sidebar and support copy
- `Control Center` and similar secondary headings in the shell get stronger light-mode text treatment
- support copy such as the home/audit subtitles keeps muted hierarchy but remains readable over the portal background

## Verification
- frontend contracts assert the light-mode contrast primitives exist in the shared components
- portal typecheck and build stay green
