import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { FirebaseService } from 'src/utils/firebase/firebase.service';
import { PaginationService } from 'src/utils/pagination/pagination.service';
import { User } from './models/user.interface';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UsersService {
  constructor(private firebaseService: FirebaseService, private readonly paginationService: PaginationService) {}

  async getUser(id: string) {
    const user = await this.firebaseService.firestore.collection('users').doc(`${id}`).get();
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
    const result = user.data();
    return result;
  }

  async getUsers(filter: any, order: any, page: number, limit: number) {
    const userCollectionRef = this.firebaseService.firestore.collection('users');
    let query: any = userCollectionRef;
    for (const [key, value] of Object.entries(filter)) {
      query = query.where(key, '==', value);
    }
    for (const [key, value] of Object.entries(order)) {
      query = query.orderBy(key, value);
    }
    const users = await query.get();

    const datas = [];
    for (const doc of users.docs) {
      const u = doc.data();
      delete u.password;
      datas.push(u);
    }

    const result = {
      results: [],
      page,
      limit,
      totalPages: 0,
      totalResults: 0,
    };
    const totalResults = datas.length;
    const totalPages = Math.ceil(totalResults / limit);
    result.totalResults = totalResults;
    result.totalPages = totalPages;
    result.results = await this.paginationService.paginate(datas, limit, page);
    return result;
  }

  async updateUser(id: string, payload: UpdateUserInput) {
    const data = {
      ...payload,
      updatedAt: new Date(),
    };
    const userCollectionRef = this.firebaseService.firestore.collection('users');
    let user = await userCollectionRef.doc(`${id}`).get();
    if (!user.exists) {
      throw new HttpException(
        {
          status: HttpStatus.CONFLICT,
          errors: {
            message: 'User not found',
          },
        },
        HttpStatus.CONFLICT
      );
    }
    await userCollectionRef.doc(`${id}`).update(data);
    user = await userCollectionRef.doc(`${id}`).get();
    return user.data();
  }

  async randomUserNonce(user: User): Promise<number> {
    const nonce = Math.floor(Math.random() * 10000);
    Logger.debug(`random nonce ${nonce}`);
    await this.firebaseService.firestore.collection('users').doc(user.uid).update({ nonce });
    return nonce;
  }

  async deleteUser(id: string) {
    const userCollectionRef = this.firebaseService.firestore.collection('users');
    const user = await userCollectionRef.doc(`${id}`).get();
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
    await userCollectionRef.doc(`${id}`).delete();
    return true;
  }

  async getUserByPublicAddress(publicAddress: string): Promise<User> {
    Logger.debug(`get user ${publicAddress}`);
    const user = await this.firebaseService.firestore
      .collection('users')
      .where('publicAddress', '==', publicAddress)
      .limit(1)
      .get();
    if (!user.empty) {
      const data = user.docs[0];
      const result = data.data();
      Logger.debug(`found user ${JSON.stringify(result)}`);
      return result as User;
    } else {
      const uid = `users-${publicAddress}`;
      const user = {
        uid,
        name: publicAddress,
        firstname: '',
        lastname: '',
        profileImage: '',
        mobilePhone: '',
        publicAddress,
        email: `${publicAddress}@socialmonad.com`,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: 'USER',
        nonce: 0,
        isInitProfile: true,
      };
      Logger.debug(`create new user ${JSON.stringify(user)}`);
      await this.firebaseService.firestore.collection('users').doc(`${uid}`).set(user);
      return user as User;
    }
  }
}
