import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { FirebaseService } from 'src/utils/firebase/firebase.service';
import { UuidService } from 'src/utils/uuid/uuid.service';
import { PaginationService } from 'src/utils/pagination/pagination.service';

@Module({
  controllers: [ApiController],
  providers: [ApiService, FirebaseService, UuidService, PaginationService],
})
export class ApiModule {}
