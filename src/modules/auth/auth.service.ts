import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../schemas/user.schema';
import { RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  // REGISTER
  async register(
    registerDto: RegisterDto,
  ) {
    const existingUser = await this.userModel.findOne({ email: registerDto.email }).exec();
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }
    

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = new this.userModel({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      phone: registerDto.phone,
      shopName: registerDto.shopName,
      shopDetails: registerDto.shopDetails,
    });

    await newUser.save();
    const payload = { sub: newUser._id, email: newUser.email };
    const token = await this.jwtService.signAsync(payload,{
      secret: process.env.JWT_SECRET || 'mySecretKey',
      expiresIn: '1h',

    });
    return {
      message: 'User registered successfully',
      userId: newUser._id,
      token
      
    };
  }

  // LOGIN
  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user._id, email: user.email };
    const token = await this.jwtService.signAsync(payload,{
      secret: process.env.JWT_SECRET || 'mySecretKey',
      expiresIn: '1h',

    });
    return {
      access_token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        shopName: user.shopName,
        shopDetails: user.shopDetails,
      },
    };
  }

  // GET PROFILE
  async getProfile(userId: string) {
    console.log('Getting profile for userId:', userId);
    
    if (!userId) {
      console.error('No userId provided to getProfile');
      throw new UnauthorizedException('No user ID provided');
    }

    try {
      const user = await this.userModel.findById(userId).select('-password').exec();
      
      if (!user) {
        console.error('User not found for ID:', userId);
        throw new NotFoundException('User not found');
      }
      
      console.log('Found user:', { id: user._id, email: user.email });
      return user;
    } catch (error) {
      console.error('Error in getProfile:', error);
      if (error.name === 'CastError') {
        throw new NotFoundException('Invalid user ID format');
      }
      throw error;
    }
  }

  // UPDATE PROFILE
  async updateProfile(
    userId: string,
    data: Partial<User>,
  ) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { ...data, updatedAt: new Date() },
        { new: true },
      )
      .select('-password')
      .exec();

    if (!updatedUser) throw new NotFoundException('User not found');

    return updatedUser;
  }
}
