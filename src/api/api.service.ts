import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/utils/firebase/firebase.service';
import { PaginationService } from 'src/utils/pagination/pagination.service';
import { UuidService } from 'src/utils/uuid/uuid.service';
import _ from 'lodash';
import { Contact } from 'src/models/contact.inerface';

@Injectable()
export class ApiService {
  constructor(
    private storageService: FirebaseService,
    private uuid: UuidService,
    private readonly paginationService: PaginationService
  ) {}

  // User
  async getUserById(id: string) {
    const user = await this.storageService.get('users', id);
    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          errors: {
            message: 'user not found',
          },
        },
        HttpStatus.NOT_FOUND
      );
    }
    return user;
  }

  async updateUser(id: string, payload: any) {
    const data = {
      ...payload,
      updatedAt: new Date(),
    };
    let user = await this.storageService.get('users', id);
    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          errors: {
            message: 'User not found',
          },
        },
        HttpStatus.NOT_FOUND
      );
    }
    user = await this.storageService.update('users', id, data);
    return user;
  }

  async createContact(payload: any) {
    const { ownerUserId, address } = payload;
    let contact: any;
    if (ownerUserId == address) {
      throw new HttpException(
        {
          status: HttpStatus.CONFLICT,
          errors: {
            message: 'Not allow to contact with yourself',
          },
        },
        HttpStatus.CONFLICT
      );
    }
    const contacts = await this.storageService.gets('contacts', { ownerUserId, address }, {}, { limit: 1 });
    if (contacts.length == 0) {
      contact = await this.storageService.create('contacts', payload);
    } else {
      contact = contacts[0];
    }
    return contact;
  }
}
