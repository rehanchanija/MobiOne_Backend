import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Request,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RegisterDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // REGISTER
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
  ) {
    return this.authService.register(registerDto);
  }

  // LOGIN
  @Post('login')
  async login(@Body('email') email: string, @Body('password') password: string) {
    console.log('login', email, password);
    return this.authService.login(email, password);
  }

  // GET PROFILE (JWT protected)
  @UseGuards(AuthGuard)
 @Get('profile')
getProfile(@Request() req) {
  console.log('req.user', req.user);
  return this.authService.getProfile(req.user.sub); //
  //  ✅ userId comes from validate()
}


  // UPDATE PROFILE (JWT protected)
  @UseGuards(AuthGuard)
  @Put('profile')
  async updateProfile(@Request() req, @Body() body: any) {
    return this.authService.updateProfile(req.user.userId, body);
  }
}
