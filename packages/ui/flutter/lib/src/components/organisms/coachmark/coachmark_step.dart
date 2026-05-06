// BTCoachmarkStep — single-step descriptor for [BTCoachmarkController].
//
// One [BTCoachmarkStep] describes one balloon in a coachmark tour:
// which widget to highlight (via [GlobalKey]), what copy to display,
// and where the balloon should appear relative to the target.

import 'package:btech_ui/src/components/molecules/tooltip_step/tooltip_step.types.dart';
import 'package:flutter/widgets.dart';

/// Descriptor for a single step in a [BTCoachmarkController] tour.
class BTCoachmarkStep {
  const BTCoachmarkStep({
    required this.targetKey,
    required this.description,
    this.label,
    this.stepLabel,
    this.stepVariant = BTTooltipStepVariant.button,
    this.position,
    this.prevLabel,
    this.nextLabel,
  });

  /// Key attached to the widget that should be highlighted.
  final GlobalKey targetKey;

  /// Description text inside the balloon (required).
  final String description;

  /// Optional bold title shown at the top of the balloon.
  final String? label;

  /// Step indicator, e.g. "Step 1 of 3".
  final String? stepLabel;

  /// Navigation footer style. Defaults to [BTTooltipStepVariant.button].
  final BTTooltipStepVariant stepVariant;

  /// Balloon position. When `null` it is auto-detected from the target's
  /// position in the viewport (bottom half → top, otherwise → bottom).
  final BTTooltipPosition? position;

  /// Per-step override for the prev button label.
  final String? prevLabel;

  /// Per-step override for the next button label.
  final String? nextLabel;
}
