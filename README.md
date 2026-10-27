# Physics of Sports Analytics: Video Project Lab

An interactive, browser-native projectile motion video analysis and modeling lab suite built for **The Thinking Experiment** (PhysicsKit) curriculum. Designed for high school physics students to complete all stages of the Sports Analytics Projectile Motion Lab.

## Features
- **Video Setup & Sports Presets:** Universal video dropzone (MP4, MOV, WebM) plus built-in sports presets (Basketball 3-Pt Arc, Soccer Chip Kick, Baseball Toss).
- **Sub-Pixel Tracking:** Draggable SI scale stick, rotatable coordinate origin, frame stepper, and sub-pixel magnifying reticle loupe.
- **6-Graph Kinematics Studio:** Generates all six kinematics graphs ($y(t), x(t), v_y(t), v_x(t), a_y(t), a_x(t)$) with quadratic and linear regression fits, displaying general and particular equations with explicit units.
- **Interactive Tangent Line Slope Sampler:** Slide along the vertical position curve to measure instantaneous tangent slopes ($\frac{dy}{dt} = v_y$) and record 10 verified points onto the velocity graph (fulfilling the classroom rubric).
- **Guided Calculations Workspace:** Interactive lab worksheet matching `Lab: Physics of Sports Analytics Worksheet.docx` with automatic theoretical comparisons, percent difference calculations, consistency checks, and a Part 5 reflection editor with a live $\ge 5$ sentence counter.
- **1-Click Deliverables Exporter:**
  - **Download Presentation (.pptx):** Client-side generation via `pptxgenjs` of a 10-slide presentation matching the classroom template with embedded high-resolution graph snapshots, calculations, comparison tables, and equations.
  - **Print Lab Report (PDF):** Clean 4-page printable laboratory report with trajectory evidence, graphs, derivations, and authenticity verification seal.
  - **Copy Form Data:** Formatted for Google Form / Canvas submission.
  - **Save / Load Lab (.json):** Full project state persistence.

## Palette & Design System
- Strictly light mode (`color-scheme: light`)
- Primary Teal: `#0f7e9b`
- Accent Amber: `#d67b19`
- Background: `#ffffff`
