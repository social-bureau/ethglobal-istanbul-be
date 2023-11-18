import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FirebaseOptions, initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signInWithCustomToken,
} from 'firebase/auth';
import { FirebaseAdminConfig, FirebaseClientConfig } from 'src/common/configs/config.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseService {
  public firestore: admin.firestore.Firestore;
  public auth: any;
  public firebaseAuth: any;
  public storage: any;

  constructor(private configService: ConfigService) {
    this.firestore = admin.firestore();
    this.auth = admin.auth();
    /* const firebaseConfigPath = process.env.GOOGLE_FIREBASE_CONFIG;
    const firebaseConfig = require(firebaseConfigPath); */

    const firebaseConfig = {
      apiKey: process.env.FIREBASECLIENT_APIKEY,
      authDomain: process.env.FIREBASECLIENT_AUTHDOMAIN,
      projectId: process.env.FIREBASECLIENT_PROJECTID,
      storageBucket: process.env.FIREBASECLIENT_STORAGEBUCKET,
      messagingSenderId: process.env.FIREBASECLIENT_MESSAGINGSENDERID,
      appId: process.env.FIREBASECLIENT_APPID,
      measurementId: process.env.FIREBASECLIENT_MEASUREMENTID,
    } as FirebaseOptions;
    const app = initializeApp(firebaseConfig);
    this.firebaseAuth = getAuth(app);

    this.storage = getStorage(app);
  }

  getAuth() {
    return admin.auth();
  }

  getFirestore() {
    return admin.firestore();
  }

  getFirebaseAuth() {
    return this.firebaseAuth;
  }

  createUserWithEmailAndPassword(email: string, password: string) {
    return createUserWithEmailAndPassword(this.firebaseAuth, email, password);
  }

  updateProfile(user: any, payload: any) {
    return updateProfile(user, payload);
  }

  signInWithEmailAndPassword(email: string, password: string) {
    return signInWithEmailAndPassword(this.firebaseAuth, email, password);
  }

  signInWithCustomToken(token: string) {
    return signInWithCustomToken(this.firebaseAuth, token);
  }

  async uploadFile(prefix: string, file: Express.Multer.File) {
    const { originalname } = file;
    const storageRef = ref(this.storage, `${prefix}/${originalname}`);

    const metadata = {
      contentType: `${file.mimetype}`,
    };
    try {
      const uploadTask = await uploadBytes(storageRef, file.buffer, metadata);
      return uploadTask;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          errors: {
            message: error._baseMessage,
          },
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async downloadFile(path: string) {
    try {
      const downloadTask = await getDownloadURL(ref(this.storage, `${path}`));
      return downloadTask;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          errors: {
            message: error._baseMessage,
          },
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async deleteFile(path: string) {
    try {
      await deleteObject(ref(this.storage, `${path}`));
    } catch (error) {}
  }
}
