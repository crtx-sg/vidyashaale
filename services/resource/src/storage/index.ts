import { StorageProvider } from './interface';
import { LocalStorageProvider } from './local';
import { S3StorageProvider } from './s3';

export type StorageType = 'LOCAL' | 'S3' | 'INSFORGE';

export function createStorageProvider(): StorageProvider {
  const storageType = (process.env.STORAGE_TYPE || 'LOCAL').toUpperCase() as StorageType;

  switch (storageType) {
    case 'LOCAL': {
      const localPath = process.env.STORAGE_LOCAL_PATH || '/data/uploads';
      console.log(`Using local storage at: ${localPath}`);
      return new LocalStorageProvider(localPath);
    }

    case 'S3':
      console.log('Using AWS S3 storage');
      return new S3StorageProvider({
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.STORAGE_ACCESS_KEY || '',
        secretAccessKey: process.env.STORAGE_SECRET_KEY || '',
        bucket: process.env.STORAGE_BUCKET || 'vidyashaale',
      });

    case 'INSFORGE': {
      // Lazy-load: the InsForge SDK is ESM-only and would break CommonJS
      // resolution if imported at module load time when not in use.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { InsforgeStorageProvider } = require('./insforge');
      console.log(`Using InsForge storage at: ${process.env.INSFORGE_URL}`);
      return new InsforgeStorageProvider({
        url: process.env.INSFORGE_URL || '',
        anonKey: process.env.INSFORGE_ANON_KEY || '',
        bucket: process.env.STORAGE_BUCKET || 'vidyashaale',
      });
    }

    default:
      throw new Error(`Unknown storage type: ${storageType}`);
  }
}

export { StorageProvider } from './interface';
