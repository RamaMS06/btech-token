/// BTLoadingSkeleton — shimmer skeleton placeholder utility.
///
/// Thin wrapper around the `skeletonizer` package that applies the
/// btech design-system shimmer colors (`bg.subtler` → `bg.primary`)
/// automatically from the current theme context. Mirrors the
/// `UILoadingSkeleton` pattern from `buma_design_system`.
///
/// Two constructors:
///   * [BTLoadingSkeleton] — wraps an entire subtree in [Skeletonizer].
///     All child containers and text are replaced by shimmer blocks.
///   * [BTLoadingSkeleton.leaf] — marks a single terminal widget as a
///     shimmer leaf via [Skeleton.leaf]. Use this when you only want
///     one specific widget skeletonised inside a larger [Skeletonizer].
///
/// ## Usage:
/// ```dart
/// // Wrap any widget tree — all content becomes shimmer while loading.
/// BTLoadingSkeleton(
///   enabled: isLoading,
///   child: MyCard(),
/// );
///
/// // Inside an existing Skeletonizer — mark a single leaf node.
/// BTLoadingSkeleton.leaf(
///   enabled: isLoading,
///   child: MyAvatarWidget(),
/// );
///
/// // Ignore container backgrounds (shows only text/icon shimmer).
/// BTLoadingSkeleton(
///   enabled: isLoading,
///   ignoreContainers: true,
///   child: MyListTile(),
/// );
/// ```
///
/// [skeletonizer] is pinned at `1.4.3` in pubspec.yaml — bump manually
/// after regression-testing (no silent breaking changes).
library;

import 'package:btech_tokens/btech_tokens.dart';
import 'package:flutter/material.dart';
import 'package:skeletonizer/skeletonizer.dart';

/// Skeleton type — selects which Skeletonizer variant to render.
enum _BTSkeletonType { base, leaf }

/// BTLoadingSkeleton — see file header for usage.
class BTLoadingSkeleton extends StatelessWidget {
  /// Wraps [child] in a [Skeletonizer] that shimmers the entire subtree.
  const BTLoadingSkeleton({
    required this.child,
    this.enabled = true,
    this.ignoreContainers = false,
    super.key,
  }) : _type = _BTSkeletonType.base;

  /// Marks [child] as a single [Skeleton.leaf] node inside a parent
  /// [Skeletonizer]. [ignoreContainers] has no effect for this variant.
  const BTLoadingSkeleton.leaf({
    required this.child,
    this.enabled = true,
    super.key,
  })  : _type = _BTSkeletonType.leaf,
        ignoreContainers = false;

  /// When `true`, the shimmer effect is active and [child] is hidden.
  /// When `false`, [child] is rendered normally.
  final bool enabled;

  /// When `true`, container decorations (backgrounds, borders) are
  /// excluded from the shimmer. Only text, icons and images shimmer.
  /// Only applies to the default [BTLoadingSkeleton] constructor.
  final bool ignoreContainers;

  /// The content to display once [enabled] is `false`.
  final Widget child;

  final _BTSkeletonType _type;

  @override
  Widget build(BuildContext context) {
    if (_type == _BTSkeletonType.leaf) {
      return Skeleton.leaf(
        enabled: enabled,
        child: child,
      );
    }

    // Use btech context tokens for shimmer colors so they stay
    // consistent with the tenant theme and light/dark mode.
    final baseColor = context.btechColor.bg.subtler;
    final highlightColor = context.btechColor.bg.primary;

    return Skeletonizer(
      enabled: enabled,
      ignoreContainers: ignoreContainers,
      effect: ShimmerEffect(
        baseColor: baseColor,
        highlightColor: highlightColor,
      ),
      child: child,
    );
  }
}
