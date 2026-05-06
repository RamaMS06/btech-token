import { z } from 'zod';

export const registryFileSchema = z.object({
  path: z.string(),
  target: z.string(),
  type: z.enum([
    'registry:ui',
    'registry:component',
    'registry:hook',
    'registry:lib',
    'registry:style',
    'registry:page',
  ]),
  content: z.string(),
});

export type RegistryFile = z.infer<typeof registryFileSchema>;

export const registryItemSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  type: z.enum([
    'registry:ui',
    'registry:component',
    'registry:hook',
    'registry:lib',
    'registry:block',
    'registry:style',
    'registry:theme',
  ]),
  title: z.string(),
  description: z.string(),
  framework: z.enum(['vue', 'react', 'flutter']),
  category: z.enum(['atoms', 'molecules', 'organisms', 'patterns']),
  figmaUrl: z.string().url().optional(),
  figmaNodeId: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
  devDependencies: z.array(z.string()).default([]),
  registryDependencies: z.array(z.string()).default([]),
  // Flutter mason brick reference
  masonBrick: z.string().optional(),
  files: z.array(registryFileSchema),
});

export type RegistryItem = z.infer<typeof registryItemSchema>;

export const registryIndexItemSchema = z.object({
  name: z.string(),
  type: z.string(),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  url: z.string(),
});

export const registryIndexSchema = z.object({
  $schema: z.string().optional(),
  framework: z.string(),
  version: z.string(),
  items: z.array(registryIndexItemSchema),
});

export type RegistryIndex = z.infer<typeof registryIndexSchema>;
