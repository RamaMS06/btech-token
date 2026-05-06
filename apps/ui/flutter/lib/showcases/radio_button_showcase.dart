// Auto-generated showcase — do not edit manually
import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

class BTRadioButtonShowcase extends StatefulWidget {
  const BTRadioButtonShowcase({super.key});

  @override
  State<BTRadioButtonShowcase> createState() => _BTRadioButtonShowcaseState();
}

class _BTRadioButtonShowcaseState extends State<BTRadioButtonShowcase> {
  String _selected = 'active';

  @override
  Widget build(final BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Atoms › RadioButton — Figma 555:3529',
          style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
        ),
        const SizedBox(height: 16),

        // 5 states
        Wrap(
          spacing: 4,
          runSpacing: 4,
          crossAxisAlignment: WrapCrossAlignment.start,
          children: [
            BTRadioButton<String>(
              groupValue: _selected,
              value: 'default',
              label: 'Default',
              onChanged: (v) => setState(() => _selected = v),
            ),
            BTRadioButton<String>(
              groupValue: _selected,
              value: 'active',
              label: 'Active',
              onChanged: (v) => setState(() => _selected = v),
            ),
            BTRadioButton<String>(
              groupValue: _selected,
              value: 'disabled',
              label: 'Disable',
              disabled: true,
              onChanged: (v) => setState(() => _selected = v),
            ),
            BTRadioButton<String>(
              groupValue: _selected,
              value: 'dis-active',
              label: 'Disable Active',
              disabled: true,
              onChanged: (v) => setState(() => _selected = v),
            ),
            BTRadioButton<String>(
              groupValue: _selected,
              value: 'error',
              label: 'Error',
              error: true,
              onChanged: (v) => setState(() => _selected = v),
            ),
          ],
        ),

        const SizedBox(height: 16),

        // With subtext
        Wrap(
          spacing: 4,
          runSpacing: 4,
          crossAxisAlignment: WrapCrossAlignment.start,
          children: [
            BTRadioButton<String>(
              groupValue: _selected,
              value: 's-a',
              label: 'Label',
              subtext: 'Subtext',
              onChanged: (v) => setState(() => _selected = v),
            ),
            BTRadioButton<String>(
              groupValue: _selected,
              value: 's-b',
              label: 'Label',
              subtext: 'Subtext',
              onChanged: (v) => setState(() => _selected = v),
            ),
            BTRadioButton<String>(
              groupValue: _selected,
              value: 's-err',
              label: 'Label',
              subtext: 'Error message',
              error: true,
              onChanged: (v) => setState(() => _selected = v),
            ),
          ],
        ),

        const SizedBox(height: 12),
        Text(
          'Selected: $_selected',
          style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
        ),
      ],
    );
  }
}
