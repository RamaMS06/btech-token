// BTTooltipStep — type definitions.
//
// Figma: node 478-2463 (Pagination Step variants).
// https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=478-2463

export 'package:btech_ui/src/components/atoms/tooltip/tooltip.types.dart'
    show BTTooltipArrowPosition, BTTooltipPosition;

/// Navigation button style shown in the step footer.
enum BTTooltipStepVariant {
  /// Secondary rounded buttons (Prev / Next). Default.
  button,

  /// Text-link buttons — grey Prev, blue Next.
  link,

  /// Icon-only chevron buttons flanking the step label. Centred.
  centered,
}
