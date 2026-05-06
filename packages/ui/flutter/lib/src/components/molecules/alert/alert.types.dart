// ignore_for_file: lines_longer_than_80_chars

/// Visual style of a [BTAlert].
enum BTAlertVariant {
  info,
  success,
  error,
  warning,
  neutral,

  /// Dark-background variant — uses [BTechColorTheme.bg.inverse] as background
  /// and [BTechColorTheme.text.inverse] for text/icons.
  neutralDark,
}
