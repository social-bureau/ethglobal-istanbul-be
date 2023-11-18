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
import { ConversationType } from 'src/models/conversation.interface';
import { CreateConversationInput } from './dto/create-conversation.input';
import { GetMyConversationDto } from './dto/get-my-conversation.dto';
import { GetConversationDto } from './dto/get-conversation.dto';

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

  @Auth()
  @Post('chats/conversations/request')
  async findOrCreateConversation(@Req() req: any, @Body() body: CreateConversationInput) {
    const { user } = req;
    const { userIds, type = ConversationType.DM } = body;
    let conversation: any;
    switch (type) {
      case ConversationType.GROUP:
        break;
      case ConversationType.NEGO:
        break;
      case ConversationType.PAGE:
        break;
      case ConversationType.DM:
      default:
        const participantIds = [user.id, userIds[0]];
        conversation = await this.apiService.findOrCreateConversation({ type, participantIds });
        break;
    }
    return conversation;
  }

  @Auth()
  @Get('chats/conversation/:conversationId')
  async getConversation(@Req() req: any, @Param('conversationId') conversationId: string) {
    const { user } = req;
    const conversations = await this.apiService.getConversation(user.id, conversationId);
    return conversations;
  }

  @Auth()
  @Get('chats/conversations/me')
  async getMyConversationList(@Req() req: any, @Query() query: GetMyConversationDto) {
    const { user } = req;
    const { page = 1, limit = 10 } = query;
    const conversations = await this.apiService.getConversationListByUserId(user.id, page, limit);
    return conversations;
  }

  @Auth()
  @Get('chats/conversations/:conversationId')
  async getConversationMessages(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
    @Query() query: GetConversationDto
  ) {
    const { user } = req;
    const { page = 1, limit = 10 } = query;
    const conversations = await this.apiService.getConversationMessages(user.id, conversationId, page, limit);
    return conversations;
  }
}
