import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import Users from './src/payload/collections/Users.ts';
import Media from './src/payload/collections/Media.ts';
import Products from './src/payload/collections/Products.ts';
import ActivityLogs from './src/payload/collections/ActivityLogs.ts';
import DesignSystem from './src/payload/globals/DesignSystem.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: 'users',
  },
  collections: [Users, Media, Products, ActivityLogs],
  globals: [DesignSystem],
  editor: lexicalEditor(),
  db: postgresAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
});
