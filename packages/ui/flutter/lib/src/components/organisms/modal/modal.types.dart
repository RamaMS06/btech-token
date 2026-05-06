// BTModal types — Figma source: M-Modal node 2124:2190.
//
// Mobile modals are full-width (328 px on the design canvas) with a
// vertically stacked footer (primary on top, secondary below) — there
// is no `BTModalSize` analogue for the web on mobile.

/// Width preset placeholder kept for cross-framework parity. On Flutter
/// the modal renders at the natural 328 dp width regardless of the
/// chosen size — this enum exists only so Vue / React / Flutter
/// `component.meta.yaml` shapes line up.
enum BTModalSize { sm, md, lg }
