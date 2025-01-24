
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto'; 
import { LoginDto } from './dto/login.dto'; 
import { ConflictException, UnauthorizedException } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Register route
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const { email, username, password } = registerDto;
    try {
      const user = await this.authService.register(email, username, password);
      return { message: 'User successfully registered', user };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw new Error('Internal server error');
    }
  }

  // Login route
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    try {
      const loginResponse = await this.authService.login(email, password);
      return { message: 'Login successful', accessToken: loginResponse.accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message);
      }
      throw new Error('Internal server error');
    }
  }
}
