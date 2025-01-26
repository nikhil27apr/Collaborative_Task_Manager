import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { MESSAGES } from './constants/messages';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // Register route
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const { email, username, password } = registerDto;
    try {
      const user = await this.authService.register(email, username, password);
      return { message: MESSAGES.SUCCESS.USER_REGISTERED, user };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw new Error(MESSAGES.ERRORS.INTERNAL_SERVER_ERROR);
    }
  }

  // Login route
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    try {
      const loginResponse = await this.authService.login(email, password);
      return { message: MESSAGES.SUCCESS.LOGIN_SUCCESS, accessToken: loginResponse.accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message);
      }
      throw new Error(MESSAGES.ERRORS.INTERNAL_SERVER_ERROR);
    }
  }
}
