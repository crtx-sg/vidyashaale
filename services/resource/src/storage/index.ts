import { StorageProvider } from './interface';
import { LocalStorageProvider } from './local';
import { S3StorageProvider } from './s3';

export type StorageType = 'LOCAL' | 'S3' | 'MINIO';

export function createStorageProvider(): StorageProvider {
  const storageType = (process.env.STORAGE_TYPE || 'LOCAL').toUpperCase() as StorageType;

  switch (storageType) {
    case 'LOCAL':
      const localPath = process.env.STORAGE_LOCAL_PATH || '/data/uploads';
      console.log(`Using local storage at: ${localPath}`);
      return new LocalStorageProvider(localPath);

    case 'S3':
      console.log('Using AWS S3 storage');
      return new S3StorageProvider({
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.STORAGE_ACCESS_KEY || '',
        secretAccessKey: process.env.STORAGE_SECRET_KEY || '',
        bucket: process.env.STORAGE_BUCKET || 'vidyashaale',
      });

    case 'MINIO':
      console.log(`Using MinIO storage at: ${process.env.STORAGE_ENDPOINT}`);
      return new S3StorageProvider({
        endpoint: process.env.STORAGE_ENDPOINT || 'http://localhost:9000',
        accessKeyId: process.env.STORAGE_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.STORAGE_SECRET_KEY || 'minioadmin',
        bucket: process.env.STORAGE_BUCKET || 'vidyashaale',
        forcePathStyle: true,
      });

    default:
      throw new Error(`Unknown storage type: ${storageType}`);
  }
}

export { StorageProvider } from './interface';
