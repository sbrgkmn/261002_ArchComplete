# ArchComplete precedent library

A local reference library for **98 unique buildings** in the public ArchComplete dataset, with **632 reference images**, an Excel index, and an interactive geometry-and-image viewer.

## Open the viewer

1. Install Git LFS and clone this repository:

```sh
git lfs install
git clone https://github.com/sbrgkmn/261002_ArchComplete.git
cd 261002_ArchComplete
git lfs pull
```

2. Open `Precedent_Images/viewer.html` in Chrome or Edge. Keep the folder structure intact. No server or build step is needed.

Use `Precedent_Images/index.html` for the image gallery. The spreadsheet is `outputs/archcomplete_buildings/ArchComplete_Buildings.xlsx`.

Large reference images are stored with Git LFS. A normal clone plus `git lfs pull` retrieves the original image files; downloading a source ZIP may yield LFS pointers instead.

## Contents

- 98 building folders with named exterior, interior, and plan references, source links, and coverage notes.
- 1,520 native BINVOX files: 380 original-resolution files and 1,140 augmented files.
- 98 OBJ meshes derived from the dataset voxels, plus browser-side OBJ export.
- Search, orbit/zoom, view presets, resolution and augmentation selection, wireframe, cutaway, image filters, and browser-local review notes with JSON export.

Ennis House, La Rotonda, and Muuratsalo Experimental House have **augmented geometry only** in the public release. These are deformed variants, not just rotated originals. The viewer marks them explicitly. OBJ files are derived voxel surfaces, not original CAD models.

See [BUILD.md](BUILD.md) for implementation, provenance, regeneration, and validation details. Per-building source files retain image attribution; images and dataset assets remain subject to their respective source terms. The included Three.js distribution has its MIT license alongside it.

Dataset: https://gitlab.cg.tuwien.ac.at/srasoulzadeh/archcomplete
