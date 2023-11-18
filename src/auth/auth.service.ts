import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SecurityConfig } from 'src/common/configs/config.interface';
import { FirebaseService } from 'src/utils/firebase/firebase.service';
import { Token } from './models/token.interface';
import { User } from 'src/user/models/user.interface';
import * as ethUtil from 'ethereumjs-util';
import { AuthenticationPubliAddressInput } from './dto/auth-public-address.input';
import { SigninPublicAddressInput } from './dto/singin-public-address.input';
import { UsersService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private firebaseService: FirebaseService,
    private userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}
  async singinWithPublicAddress(payload: SigninPublicAddressInput) {
    const { publicAddress } = payload;
    try {
      const user: User = await this.userService.getUserByPublicAddress(publicAddress);
      const nonce: number = await this.userService.randomUserNonce(user);
      if (user) {
        const result = {
          status: 200,
          message: 'success update nonce',
          data: {
            nonce: nonce,
            msg: `Onetime singin with OTP: ${nonce}`,
          },
        };
        return result;
      } else {
        throw new Error('not found or error on create public address');
      }
    } catch (e) {
      throw new Error(e);
    }
  }

  async authenticationWithPublicAddress(payload: AuthenticationPubliAddressInput) {
    const { publicAddress, signature } = payload;
    // eslint-disable-next-line prefer-const
    let user: User = await this.userService.getUserByPublicAddress(publicAddress);
    if (user) {
      const msg = `Onetime singin with OTP: ${user.nonce}`;
      Logger.debug(`current sign ${msg}`);
      const msgBuffer = ethUtil.toBuffer(ethUtil.bufferToHex(Buffer.from(msg, 'utf8')));
      Logger.debug(`buffer: ${msgBuffer}`);
      const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
      const signatureBuffer: any = ethUtil.toBuffer(signature);
      const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
      const publicKey = ethUtil.ecrecover(msgHash, signatureParams.v, signatureParams.r, signatureParams.s);
      const addressBuffer = ethUtil.publicToAddress(publicKey);
      const address = ethUtil.bufferToHex(addressBuffer);
      if (address.toLowerCase() === publicAddress.toLowerCase()) {
        await this.userService.randomUserNonce(user);
        Logger.debug('--- auth success > %o', user);
        const tokens = this.generateTokens({ userId: user.uid });
        return {
          status: 200,
          message: 'success authentication with publicAddress',
          data: {
            user,
            tokens,
          },
        };
      } else {
        throw new HttpException(
          {
            status: HttpStatus.UNAUTHORIZED,
            errors: {
              message: 'Incorrect public address and nonce',
            },
          },
          HttpStatus.UNAUTHORIZED
        );
      }
    } else {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          errors: {
            message: 'Not found user, Plsease create it before authentication',
          },
        },
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  async validateUser(firebaseUser: any) {
    const userId = firebaseUser;
    const user = await this.firebaseService.firestore.collection('users').doc(`${userId}`).get();
    let result: FirebaseFirestore.DocumentData | null | undefined;
    if (user.exists) {
      result = user.data();
    } else {
      const user = await this.createInitUser(userId);
      result = user.data();
    }
    return result;
  }

  async createInitUser(id: string) {
    const data = {};
    Object.assign(data, {
      uid: id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const userCollectionRef = this.firebaseService.firestore.collection('users');
    const find = await userCollectionRef.doc(`${id}`).get();
    if (!find.exists) {
      await userCollectionRef.doc(`${id}`).set(data);
    } else {
      await userCollectionRef.doc(`${id}`).update(data);
    }
    const user = await userCollectionRef.doc(`${id}`).get();
    return user;
  }

  generateTokens(payload: { userId: string }): Token {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  private generateAccessToken(payload: { userId: string }): string {
    const securityConfig = this.configService.get<SecurityConfig>('security');
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: securityConfig.refreshIn,
    });
  }

  private generateRefreshToken(payload: { userId: string }): string {
    const securityConfig = this.configService.get<SecurityConfig>('security');
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: securityConfig.refreshIn,
    });
  }
}
