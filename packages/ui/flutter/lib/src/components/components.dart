// Top-level component barrel — exports each atomic-design layer.
//
// Layers (mirrored from buma_design_system + @buma-dev/buma-ui-v2):
//  * `atoms/`     — single-purpose primitives (loading_skeleton, button, ...)
//  * `molecules/` — small compositions (avatar, dropdown trigger, ...)
//  * `organisms/` — multi-molecule widgets (avatar_group, modal, ...)
//  * `patterns/`  — page-level patterns (empty state, table, ...)
export 'atoms/atoms.dart';
export 'molecules/molecules.dart';
export 'organisms/organisms.dart';
