---
name: Design library atomic
overview: Store Chakra colour schemes, molecules, and sections (organisms) in Postgres, link the existing site templates to those colour schemes, and edit them from an admin screen that subscribes to live updates.
todos:
  - id: model
    content: Valibot schemas, Chakra token mapping, seeds, and reference checks in @so/model
    status: completed
  - id: migration
    content: Tables, realtime, anon read, and seed rows linked to existing site templates
    status: completed
  - id: admin
    content: Admin Design screen plus template colour-scheme picker and live subscription
    status: completed
isProject: true
---

# Design library

Atoms stay in code (button, icon button, image button, link, switch, text). A molecule is either a flex tree or a combine of atoms and other molecules. Style (radius, border, colours) and flex (gap, alignment, wrap) are optional keys added from a menu. Content slots are names on the molecule and values on a template item. Sections are organisms. Existing `site_template` rows stay the template layer and gain `colour_scheme_id` and `items`.

Colour schemes are stored as Chakra theme tokens (`{ value }`) plus heading case and hero background. Applying a scheme writes those tokens into the template's `theme`, which the public page already renders.
