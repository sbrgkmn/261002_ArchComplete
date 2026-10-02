ARCHCOMPLETE — GEOMETRY + IMAGE VIEWER

Open viewer.html in Chrome or Edge. No installation, internet connection, or local server is required. Keep viewer.html, viewer_assets/, and the named building folders together.

98 precedent folders contain 1,520 original dataset BINVOX files (380 original-resolution files and 1,140 augmented variants). Each folder also contains a ready-to-import voxel-derived OBJ: original 128³ for 95 precedents, augmented 64³ for the remaining 3.

Ennis House, La Rotonda and Muuratsalo Experimental House have ONLY AUGMENTED geometry in this public release. These variants are deformed geometry, not simply rotated copies of the building. The viewer labels them prominently.

Use the building list or search field to choose a precedent. Drag the model to orbit, scroll to zoom, and right-drag to pan. View presets, up-axis control, wireframe, and an adjustable cutaway support comparison. Cutaways clip the surface and do not create new section caps. Compare any exterior, interior or floor-plan image in the right panel. Full image opens the retained original; large images use a 1,600-pixel display copy in the comparison panel.

Model options include the original and every available augmented variant. Original preview resolutions are 64³, 128³ and 256³. Native 512³ files can be downloaded under Dataset files & precedent notes. The preview uses an exact block surface at the chosen resolution, not a smoothed or AI-generated reconstruction.

Every building's geometry/Original and geometry/Augmented subfolders contain byte-for-byte copies of the native dataset files. geometry/geometry.json provides source archive paths, SHA-256 checksums, header transforms, and derived OBJ provenance. Export OBJ exports the full displayed model at its selected resolution; cutaway and wireframe are viewing controls and do not modify the exported geometry. Dataset units are unspecified.

Comparison notes and review status are saved locally in the current browser. Export review notes downloads a JSON file for safekeeping. Notes are not sent anywhere and do not modify the images or dataset files.

Source dataset: https://gitlab.cg.tuwien.ac.at/srasoulzadeh/archcomplete
Native archive: https://drive.google.com/file/d/1tg78R_WkyCPVBpsG9uJnYkV5JAie3a2D/view
The repository's active download provides BINVOX. Its OBJ download code is commented out; the included OBJ files here are explicitly derived from the public voxels.
BINVOX specification: https://www.patrickmin.com/binvox/binvox.html
Viewer renderer: Three.js r128 and OrbitControls, included locally under MIT license (viewer_assets/THREE-LICENSE.txt).

Verified: all 1,520 native file checksums; all 98 default model loads; voxel occupancy and exposed-face counts against independent calculations; exported mesh volumes against occupied-voxel volumes; 256³ preview, augmented variants, cutaway, image filters, notes, exports, and narrow-screen layout. Tested offline using Chrome with all HTTP requests blocked.
