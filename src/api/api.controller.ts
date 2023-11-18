import { Body, Controller, Get, Patch, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiService } from './api.service';
import { FirebaseService } from 'src/utils/firebase/firebase.service';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateMeInput } from './dto/update-me.input';

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
        body.picture = res.metadata.fullPath;
      }
    }
    const user = await this.apiService.updateUser(req.user.id, body);
    return user;
  }

  @Post('files/download')
  async downloadFile(@Body('path') path: string) {
    const response = await this.firebaseService.downloadFile(path);
    return response;
  }
}
