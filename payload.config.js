import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import Users from './src/payload/collections/Users.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: 'users',
  },
  collections: [
    Users,
    // Additional collections will be defined in Task 4-5
  ],
  globals: [
    // Globals will be defined in Task 5
    // Placeholder structure for design-system global
  ],
  editor: lexicalEditor(),
  db: postgresAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
});
