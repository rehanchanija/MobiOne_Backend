import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, shopName, shopDetails, phone } = registerDto;

    // Check if user exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with shop details
    const userData = {
      email,
      name,
      password: hashedPassword,
      phone,
      ...(shopName && { shopName }), // Only include if shopName is provided
      ...(shopDetails && { shopDetails }), // Only include if shopDetails is provided
    };

    const user = await this.userModel.create(userData);

    // Generate token
    const token = this.jwtService.sign({ userId: user._id });

    // Return user data including shop details
    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        shopName: user.shopName || null,
        shopDetails: user.shopDetails || null,
      },
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const token = this.jwtService.sign({ userId: user._id });

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }
   async getProfile(userId: string): Promise<User> {
      const user = await this.userModel
        .findById(userId)
        .select('-password')
        .exec();
      
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      return user;
    }
  
    async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
      const user = await this.userModel
        .findByIdAndUpdate(
          userId, 
          { 
            ...updateProfileDto,
            updatedAt: new Date()
          },
          { new: true }
        )
        .select('-password')
        .exec();
  
      if (!user) {
        throw new NotFoundException('User not found');
      }
  
      return user;
    }
}