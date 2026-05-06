// BTCheckbox types — Figma 504:4181

/// Visual / semantic state of the checkbox box.
enum BTCheckboxState {
  /// No selection — white box, primary border.
  uncheck,

  /// Fully selected — brand-primary box, white checkmark.
  check,

  /// Partially selected — brand-primary box, white dash.
  indeterminate,

  /// Disabled, no selection — secondary bg, primary border, no icon.
  disableUncheck,

  /// Disabled, fully selected — secondary bg, disabled-colour checkmark.
  disableCheck,

  /// Disabled, partially selected — secondary bg, disabled-colour dash.
  disableIndeterminate,

  /// Validation error — white box, error-colour border.
  error,
}
