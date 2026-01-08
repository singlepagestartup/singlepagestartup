# Website Builder Module

## 1. Purpose of the Module

The Website Builder module defines the content-building primitives used to compose UI sections. It focuses on structured content models (buttons, features, sliders, widgets, etc.) and the relations that connect them into reusable layouts. This module is the source of truth for UI content data and how pieces are assembled.

### It solves the following tasks:

- Defines reusable content models with localized text fields.
- Provides composition relations for assembling sections from smaller parts.
- Organizes call-to-action groups and navigation elements.
- Supports media attachments via file storage relations.
- Exposes frontend variants for runtime rendering and admin management.

### Typical use cases:

- Building section content such as hero blocks, sliders, and feature grids.
- Maintaining consistent button styles and CTA behavior across the UI.
- Attaching images/logotypes/files to content blocks.
- Reusing and reordering content via relations without duplicating data.
- Managing content through admin variants for create/edit workflows.

---

## 2. Models

| Model                                             | Purpose                           |
| ------------------------------------------------- | --------------------------------- |
| [button](./models/button/README.md)               | CTA links and actions             |
| [buttons-array](./models/buttons-array/README.md) | Ordered button groups             |
| [feature](./models/feature/README.md)             | Content feature blocks with media |
| [logotype](./models/logotype/README.md)           | Brand marks with links            |
| [slide](./models/slide/README.md)                 | Slider items with media and CTAs  |
| [slider](./models/slider/README.md)               | Carousel containers for slides    |
| [widget](./models/widget/README.md)               | Reusable content blocks           |

---

## 3. Relations

| Relation                                                                                               | Purpose                          |
| ------------------------------------------------------------------------------------------------------ | -------------------------------- |
| [buttons-arrays-to-buttons](./relations/buttons-arrays-to-buttons/README.md)                           | Order buttons inside arrays      |
| [buttons-to-file-storage-module-files](./relations/buttons-to-file-storage-module-files/README.md)     | Attach files to buttons          |
| [features-to-buttons-arrays](./relations/features-to-buttons-arrays/README.md)                         | Attach button arrays to features |
| [features-to-file-storage-module-files](./relations/features-to-file-storage-module-files/README.md)   | Attach files to features         |
| [logotypes-to-file-storage-module-files](./relations/logotypes-to-file-storage-module-files/README.md) | Attach files to logotypes        |
| [sliders-to-slides](./relations/sliders-to-slides/README.md)                                           | Order slides inside sliders      |
| [slides-to-buttons-arrays](./relations/slides-to-buttons-arrays/README.md)                             | Attach button arrays to slides   |
| [slides-to-file-storage-module-files](./relations/slides-to-file-storage-module-files/README.md)       | Attach files to slides           |
| [widgets-to-buttons-arrays](./relations/widgets-to-buttons-arrays/README.md)                           | Attach button arrays to widgets  |
| [widgets-to-features](./relations/widgets-to-features/README.md)                                       | Attach features to widgets       |
| [widgets-to-file-storage-module-files](./relations/widgets-to-file-storage-module-files/README.md)     | Attach files to widgets          |
| [widgets-to-logotypes](./relations/widgets-to-logotypes/README.md)                                     | Attach logotypes to widgets      |
| [widgets-to-sliders](./relations/widgets-to-sliders/README.md)                                         | Attach sliders to widgets        |

---
