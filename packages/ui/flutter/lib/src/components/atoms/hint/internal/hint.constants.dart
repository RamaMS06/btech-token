import 'package:flutter/material.dart';

/// Dot diameter per size.
const Map<Object, double> kBTHintDotSize = {
  'lg': 16,
  'md': 10,
  'sm': 8,
};

/// Badge height per size.
const Map<Object, double> kBTHintBadgeHeight = {
  'lg': 24,
  'md': 16,
  'sm': 16,
};

/// Minimum badge width per size.
const Map<Object, double> kBTHintBadgeMinWidth = {
  'lg': 24,
  'md': 16,
  'sm': 16,
};

/// Font size for count text per size.
const Map<Object, double> kBTHintFontSize = {
  'lg': 14, // typography-font-size-sm
  'md': 14, // typography-font-size-sm
  'sm': 10, // typography-font-size-2xs
};

/// Single-digit (1 char) horizontal padding per size.
const Map<Object, EdgeInsets> kBTHintSinglePadding = {
  'lg': EdgeInsets.all(4),
  'md': EdgeInsets.zero,
  'sm': EdgeInsets.zero,
};

/// Multi-digit (2 chars) horizontal padding per size.
const Map<Object, EdgeInsets> kBTHintMultiPadding = {
  'lg': EdgeInsets.all(4),
  'md': EdgeInsets.symmetric(horizontal: 4),
  'sm': EdgeInsets.symmetric(horizontal: 4),
};

/// Overflow (99+) horizontal padding per size.
const Map<Object, EdgeInsets> kBTHintOverflowPadding = {
  'lg': EdgeInsets.symmetric(horizontal: 8, vertical: 4),
  'md': EdgeInsets.symmetric(horizontal: 4),
  'sm': EdgeInsets.symmetric(horizontal: 4),
};
