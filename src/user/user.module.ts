import { Module } from '@nestjs/common';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { FirebaseService } from 'src/utils/firebase/firebase.service';
import { PaginationService } from 'src/utils/pagination/pagination.service';

@Module({
  imports: [],
  providers: [UsersService, FirebaseService, PaginationService],
  controllers: [UsersController],
})
export class UsersModule {}
