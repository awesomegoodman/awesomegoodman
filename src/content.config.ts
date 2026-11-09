import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const common = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(240),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).min(1),
  draft: z.boolean().default(false),
  example: z.boolean().default(false),
  featured: z.boolean().default(false),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: common
    .extend({
      kind: z.enum(['Essay', 'Tutorial', 'Experiment', 'Note']).default('Note'),
    })
    .refine((entry) => !entry.updated || entry.updated >= entry.date, {
      message: 'updated must be on or after date',
      path: ['updated'],
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: common
    .extend({
      status: z
        .enum(['Idea', 'In progress', 'Complete', 'Archived'])
        .default('Idea'),
      repository: z.url({ protocol: /^https?$/ }).optional(),
      demo: z.url({ protocol: /^https?$/ }).optional(),
      visual: z.enum(['chess', 'grid', 'system']).default('system'),
    })
    .refine((entry) => !entry.updated || entry.updated >= entry.date, {
      message: 'updated must be on or after date',
      path: ['updated'],
    }),
});

export const collections = { writing, projects };
