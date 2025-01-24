import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcryptjs from 'bcryptjs';
import { User } from '../users/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) { }

  async register(email: string, username: string, password: string) {
    // Check if password is empty
    if (!password || password.trim().length === 0) {
      throw new BadRequestException('Password cannot be empty');
    }

    // Check if the email already exists
    const existingEmail = await this.userModel.findOne({ email });
    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    // Check if the username already exists
    const existingUsername = await this.userModel.findOne({ username });
    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    // Hash the password before saving the user
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create and save the new user
    const user = new this.userModel({ email, username, password: hashedPassword });
    return user.save();
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user || !(await bcryptjs.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create JWT token
    const payload = { username: user.username, sub: user._id, role: user.role };
    return { accessToken: this.jwtService.sign(payload) };
  }
}
