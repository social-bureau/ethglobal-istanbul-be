import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiService } from './api.service';
import { FirebaseService } from 'src/utils/firebase/firebase.service';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateMeInput } from './dto/update-me.input';
import { CreateContactInput } from './dto/create-contact.input';
import { GetContactDto } from './dto/get-contact.dto';

@Controller('api')
export class ApiController {
  constructor(private apiService: ApiService, private firebaseService: FirebaseService) {}

  // Me
  @Auth()
  @Get('users/me')
  async me(@Req() req: any) {
    const user = await this.apiService.getUserById(req.user?.id);
    return user;
  }

  @Auth()
  @Patch('users/me')
  @UseInterceptors(FileInterceptor('picture'))
  async updateMe(@Req() req: any, @Body() body: UpdateMeInput, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      const rand = Math.floor(100000 + Math.random() * 900000);
      const time = new Date();
      const res = await this.firebaseService.uploadFile(`files/${rand}/${time.getTime()}`, file);
      if (res) {
        body.picture = res;
      }
    }
    const user = await this.apiService.updateUser(req.user.id, body);
    return user;
  }

  @Auth()
  @Get('users/:id')
  async userById(@Param('id') id: string) {
    const user = await this.apiService.getUserById(id);
    return user;
  }

  @Auth()
  @Post('contacts')
  async createContact(@Req() req: any, @Body() body: CreateContactInput) {
    const { user } = req;
    const contact = await this.apiService.createContact({ ...body, ownerUserId: user.id });
    return contact;
  }

  @Auth()
  @Get('contacts')
  async getMyContacts(@Req() req: any, @Query() query: GetContactDto) {
    const { user } = req;
    const { page = 1, limit = 10 } = query;
    const result = await this.apiService.getContactListByUserId(user.id, page, limit);
    return result;
  }

  @Auth()
  @Get('contacts/:contactId')
  async getMyContact(@Req() req: any, @Param('contactId') contactId: string) {
    const { user } = req;
    const contact = await this.apiService.getContactByUserIdAndContactId(user.id, contactId);
    return contact;
  }
}
