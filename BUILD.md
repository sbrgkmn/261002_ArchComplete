# Build and implementation

## Delivered version

This repository contains the complete, working offline viewer and the original local reference collection. The abandoned ChatGPT Sites staging copy is excluded. No website deployment is required.

## Runtime architecture

`Precedent_Images/viewer.html` loads local CSS, Three.js r128, OrbitControls, `catalog.js`, and `viewer.js` from `viewer_assets/`. Each building has a `geometry/viewer_data.js` payload containing gzip-compressed, base64-encoded native voxel data. A Blob Web Worker uses the browser DecompressionStream API and generates an exact block surface with greedy face merging. This permits file:// operation without fetching local JSON files.

BINVOX coordinates follow the native order: X outermost, Z next, Y fastest. Original preview resolutions are 64, 128, and 256; original 512 files remain available for download. The default OBJ uses original 128 geometry for 95 buildings and augmented 64 geometry for the other three. Meshes are not smoothed. Dataset units are unspecified.

Cutaway clips the displayed surface without adding section caps. Export OBJ exports the full selected geometry, unaffected by cutaway or wireframe. Review notes use localStorage and are private to the browser, not shared between partners.

The viewer uses 1,600-pixel display copies where appropriate, but Full image links retain the original high-resolution local files. The source gallery includes photographs, renderings, models, and drawings, with captions and provenance. Coverage gaps are recorded rather than filled with invented images.

## Files and data

- `Precedent_Images/`: ready-to-use application, all images, native geometry, derived OBJ files, inventories, source records, and per-building notes.
- `outputs/archcomplete_buildings/`: Excel building index.
- `research/building_files.json`, `building_records.json`, `base_ids.json`: dataset/building mapping.
- `research/BINVOX.zip`: original public voxel archive used to generate the delivered geometry.
- `work/`: selected generation and verification scripts and saved validation results.

The native archive is published at https://drive.google.com/file/d/1tg78R_WkyCPVBpsG9uJnYkV5JAie3a2D/view . The upstream repository's active download is BINVOX; its OBJ download is commented out. Native files are preserved byte-for-byte, with SHA-256 checksums in geometry metadata.

## Run without rebuilding

Open `Precedent_Images/viewer.html` in a current Chrome or Edge browser. All runtime dependencies are vendored. Alternatively, from the repository root run `python -m http.server 8000` and visit `http://localhost:8000/Precedent_Images/viewer.html`.

## Regeneration tools

The committed output is the authoritative runnable version; rebuilding is optional. Python scripts require NumPy and Pillow. Browser verification/OBJ generation uses Node.js, Playwright, and an installed Chromium browser. Spreadsheet generation uses the OpenAI artifact-tool runtime.

Main geometry pipeline, in order:

1. `python work/prepare_geometry.py`: extract native geometry, write metadata and embedded payloads, and create the catalog. It also obtains the vendored renderer and adds gallery links.
2. `python work/build_viewer_previews.py`: create optimized display copies and update catalog paths.
3. `node work/test_viewer.mjs`: exercise the browser viewer and generate per-building OBJ surfaces.
4. `python work/finalize_geometry.py`: independently validate geometry, update the catalog with OBJ links, and write summary inventories.
5. `node work/check_viewer_delivery.mjs`: check local links and final viewer behavior.

Some original scripts retain the author's absolute Windows workspace/browser paths. Update those constants before running on another machine. Install Playwright in your own Node environment; no node_modules is committed. The spreadsheet builder is `work/build.mjs`. Do not run catalog generation alone over an existing finalized build: later steps add preview and OBJ metadata. Image collection is a curated snapshot with source records, not a guaranteed reproducible web crawler.

## Validation recorded for this version

- All 1,520 native file SHA-256 checksums matched the source archive.
- All 98 default models loaded, including the three augmented-only precedents.
- Independent voxel occupancy, exposed-face counts, and OBJ signed volume matched.
- Checked 256-resolution previews, augmentation, cutaway, image filtering, browser-local notes, JSON/OBJ exports, and narrow-screen layout.
- Offline Chrome test blocked external HTTP requests.
- 2,636 final local asset references passed verification.

Results: `work/geometry_validation.json` and `work/geometry_viewer_checks.json`.

## Storage and exclusions

Reference raster images use Git LFS to preserve full resolution. Native BINVOX, OBJ meshes, app code, metadata, and the spreadsheet are tracked normally. Download caches, cookies, local dependencies, screenshots, temporary deployment archives, and the unfinished Sites staging directory are excluded. This repository does not include credentials or personal browser review notes.
