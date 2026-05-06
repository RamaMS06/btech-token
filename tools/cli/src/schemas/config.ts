import { z } from 'zod';

export const frameworkSchema = z.enum(['vue', 'react', 'flutter']);
export type Framework = z.infer<typeof frameworkSchema>;

export const aliasesSchema = z.object({
  components: z.string().default('@/components'),
  ui: z.string().default('@/components/ui'),
  lib: z.string().default('@/lib'),
  utils: z.string().default('@/lib/utils'),
});

export const configSchema = z.object({
  $schema: z.string().optional(),
  framework: frameworkSchema,
  registry: z.string().url().default('https://btech-registry.buma.dev'),
  tokens: z.string().default('@btech/tokens'),
  aliases: aliasesSchema.optional(),
  tsx: z.boolean().default(true),
  // Flutter only
  flutterBase: z.string().default('lib/widgets/btech'),
});

export type BtechConfig = z.infer<typeof configSchema>;

export const CONFIG_FILE = 'btech.config.json';
