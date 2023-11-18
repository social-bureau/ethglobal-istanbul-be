import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/utils/firebase/firebase.service';
import { PaginationService } from 'src/utils/pagination/pagination.service';
import { UuidService } from 'src/utils/uuid/uuid.service';
import _ from 'lodash';

@Injectable()
export class ApiService {
  constructor(
    private firebaseService: FirebaseService,
    private uuid: UuidService,
    private readonly paginationService: PaginationService
  ) {}

  // User
  async getUserById(id: string) {
    const userCollectionRef = this.firebaseService.firestore.collection('users');
    const user = await userCollectionRef.doc(`${id}`).get();
    return user.data();
  }

  async updateUser(id: string, payload: any) {
    const data = {
      ...payload,
      isInitProfile: true,
    };
    const userCollectionRef = this.firebaseService.firestore.collection('users');
    let user = await userCollectionRef.doc(`${id}`).get();
    if (!user.exists) {
      throw new HttpException(
        {
          status: HttpStatus.CONFLICT,
          errors: {
            message: 'user not found',
          },
        },
        HttpStatus.CONFLICT
      );
    }
    if (data.picture && user.data().picture) {
      await this.firebaseService.deleteFile(user.data().picture);
    }
    await userCollectionRef.doc(`${id}`).update(data);
    user = await userCollectionRef.doc(`${id}`).get();
    return user.data();
  }
}
