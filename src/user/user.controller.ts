import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';

import { Auth } from 'src/auth/decorator/auth.decorator';
import { FirebaseService } from 'src/utils/firebase/firebase.service';
import { UserListDto } from './dto/user-list.dto';
import { UpdateUserInput } from './dto/update-user.input';
import { Role } from './models/role.enum';
import { UsersService } from './user.service';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Auth(Role.ADMIN)
  @Get()
  async getUsers(@Query() query: UserListDto) {
    const { email, mobilePhone, orderBy, page = 1, limit = 10 } = query;
    const filter = {};
    const order = {};

    if (email) {
      Object.assign(filter, { email });
    }
    if (mobilePhone) {
      Object.assign(filter, { mobilePhone });
    }
    if (orderBy) {
      const o = orderBy.split(':');
      Object.assign(order, { [o[0]]: o[1] });
    }

    const result = await this.userService.getUsers(filter, order, Number(page), Number(limit));

    return result;
  }

  @Auth(Role.ADMIN)
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.userService.getUser(id);
    return user;
  }

  @Auth(Role.ADMIN)
  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserInput) {
    const user = await this.userService.updateUser(id, body);
    return user;
  }

  @Auth(Role.ADMIN)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    await this.userService.deleteUser(id);
    return { code: 200, message: 'user deleted' };
  }
}
