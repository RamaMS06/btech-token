import 'package:flutter/material.dart';
import 'package:btech_tokens/btech_tokens.dart';
import 'tenant_card.dart';

void main() {
  runApp(const DemoApp());
}

class DemoApp extends StatelessWidget {
  const DemoApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Root theme uses default tenant — same as production pattern.
    // Each TenantCard overrides locally using Theme() for demo purposes.
    return MaterialApp(
      title: 'Design Tokens — Flutter Web',
      debugShowCheckedModeBanner: false,
      theme: BTechTheme.forTenant('tenant-bjb', Brightness.dark),
      home: const DemoPage(),
    );
  }
}

class DemoPage extends StatelessWidget {
  const DemoPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.btechColor.background.secondary.hover,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 960),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Testing',
                style: TextStyle(
                  color: context.btechColor.background.primary,
                ),),
                // ── Header ──────────────────────────────────────────────────
                const SizedBox(height: 8),
                const Text(
                  'btech_tokens · Flutter Web Demo',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'One ElevatedButton widget · Three brand identities',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 15, color: Color(0xFF6B7280)),
                ),
                const SizedBox(height: 32),

                // ── Tenant cards ────────────────────────────────────────────
                LayoutBuilder(
                  builder: (context, constraints) {
                    final isWide = constraints.maxWidth > 640;
                    final cards = [
                      const TenantCard(
                        tenantId: 'default',
                        label: 'Default Tenant',
                        subtitle: 'Green primary · radius 8px',
                      ),
                      const TenantCard(
                        tenantId: 'tenant-a',
                        label: 'Tenant A',
                        subtitle: 'Blue primary · radius 4px',
                      ),
                      const TenantCard(
                        tenantId: 'tenant-bjb',
                        label: 'Tenant BJB',
                        subtitle: 'Deep blue · radius 4px',
                      ),
                    ];

                    if (isWide) {
                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: cards
                            .map((c) => Expanded(child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 8),
                                  child: c,
                                )))
                            .toList(),
                      );
                    }

                    return Column(
                      children: cards
                          .map((c) => Padding(
                                padding: const EdgeInsets.only(bottom: 16),
                                child: c,
                              ))
                          .toList(),
                    );
                  },
                ),

                const SizedBox(height: 32),

                // ── Footer ───────────────────────────────────────────────────
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'BTechTheme.forTenant(tenantId, Brightness.light) → ThemeData → all widgets inherit',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 12,
                      color: Color(0xFF9CA3AF),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
