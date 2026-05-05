// BTAvatarShowcase v2 — visual smoke test for BTAvatar (molecule) +
// BTAvatarGroup (organism). Sliced from Figma 497:979 + 504:705.
//
// Demonstrates the data-class API: pass a BTAvatarItem (with name,
// optional imageUrl, optional color) and the widget auto-derives
// initials, falls back image-error → initials, supports skeleton loading.
import 'package:btech_tokens_bspace/btech_tokens_bspace.dart';
import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

class BTAvatarShowcase extends StatelessWidget {
  const BTAvatarShowcase({super.key});

  static const List<BTAvatarItem> _sampleItems = [
    BTAvatarItem(
      name: 'Person 1',
      imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=1',
    ),
    BTAvatarItem(
      name: 'Person 2',
      imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=2',
    ),
    BTAvatarItem(
      name: 'Person 3',
      imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=3',
    ),
    BTAvatarItem(
      name: 'Person 4',
      imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=4',
    ),
    BTAvatarItem(
      name: 'Person 5',
      imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=5',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitle(context, 'BTAvatar v2 — Figma 497:979'),
        _subtitle(
          context,
          'Data-class API: BTAvatarItem (name + optional imageUrl + color). '
          'Initials auto-derived from name. Skeleton loading + image fallback.',
        ),
        const SizedBox(height: 16),

        // Initials × size × color (auto-derived from "Faisal Lestari" → "FL")
        ...BTAvatarColor.values.map(
          (color) => _row(
            context,
            label: 'color=${color.name}',
            children: BTAvatarSize.values
                .map(
                  (size) => BTAvatar(
                    size: size,
                    item: BTAvatarItem(name: 'Faisal Lestari', color: color),
                  ),
                )
                .toList(),
          ),
        ),

        const SizedBox(height: 24),

        // Image variant
        _row(
          context,
          label: 'image',
          children: [
            ...BTAvatarSize.values.map(
              (size) => BTAvatar(
                size: size,
                item: const BTAvatarItem(
                  name: 'Sample',
                  imageUrl:
                      'https://api.dicebear.com/9.x/avataaars/png?seed=BTech',
                ),
              ),
            ),
          ],
        ),

        // Loading state — BTLoadingSkeleton shimmer (no item needed)
        _row(
          context,
          label: 'isLoading',
          children: [
            ...BTAvatarSize.values.map(
              (size) => BTAvatar(size: size, isLoading: true),
            ),
          ],
        ),

        // Empty state — person icon, bg/subtler (Figma 497:979)
        _row(
          context,
          label: 'empty (no item)',
          children: [
            ...BTAvatarSize.values.map(
              (size) => BTAvatar(size: size),
            ),
          ],
        ),

        // Error state — hide_image icon, bg/subtler (Figma 497:979)
        _row(
          context,
          label: 'status=error',
          children: [
            ...BTAvatarSize.values.map(
              (size) => BTAvatar(
                size: size,
                status: BTAvatarStatus.error,
              ),
            ),
          ],
        ),

        const SizedBox(height: 24),
        _sectionTitle(context, 'BTAvatarGroup — Figma 504:705'),
        _subtitle(
          context,
          'Organism — stacks avatars with negative-margin overlap + "+N" overflow counter.',
        ),
        const SizedBox(height: 16),

        // Group across all sizes
        ...BTAvatarSize.values.map(
          (size) => _row(
            context,
            label: 'size=${size.name}',
            children: [
              BTAvatarGroup(items: _sampleItems, size: size),
            ],
          ),
        ),

        _row(
          context,
          label: 'max=4 (no overflow)',
          children: [
            BTAvatarGroup(items: _sampleItems.sublist(0, 3), max: 4),
          ],
        ),
        _row(
          context,
          label: 'customOverflow=99',
          children: const [
            BTAvatarGroup(items: _sampleItems, customOverflowNumber: 99),
          ],
        ),
      ],
    );
  }

  Widget _sectionTitle(BuildContext context, String text) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Text(
          text,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: context.btechColor.text.primary,
            fontFamily: BTechTypography.fontFamily,
          ),
        ),
      );

  Widget _subtitle(BuildContext context, String text) => Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Text(
          text,
          style: TextStyle(
            fontSize: 13,
            color: context.btechColor.text.secondary,
            fontFamily: BTechTypography.fontFamily,
          ),
        ),
      );

  Widget _row(
    BuildContext context, {
    required String label,
    required List<Widget> children,
  }) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Row(
          children: [
            SizedBox(
              width: 120,
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: context.btechColor.text.secondary,
                  fontFamily: BTechTypography.fontFamily,
                ),
              ),
            ),
            ...children.map(
              (w) => Padding(
                padding: const EdgeInsets.only(right: 16),
                child: w,
              ),
            ),
          ],
        ),
      );
}
