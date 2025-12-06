import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://inventory:inventory_dev@localhost:5432/inventory?schema=public',
  },
});
