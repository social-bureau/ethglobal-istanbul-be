import { Injectable } from '@nestjs/common';
import { create } from '@web3-storage/w3up-client';

@Injectable()
export class Web3StorageService {
  async uploadToWeb3Storage(text: string, filePath: string) {
    const client = await create();
    await client.setCurrentSpace(`did:key:${process.env.WEB3STORAGE_KEY}`);
    const files = [new File([Buffer.from(text)], filePath)];
    const uploaded = await client.uploadDirectory(files);
    return uploaded;
  }
}
