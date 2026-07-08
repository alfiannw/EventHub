import { Controller, Post, Get, Body, Req, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body('email') email: string,
    @Body('password') passwordPlain: string,
    @Body('name') name: string,
    @Body('role') role?: 'ADMIN' | 'MANAGER' | 'STAFF' | 'PARTICIPANT',
  ) {
    this.logger.log(`Register request received for: ${email}`);
    return this.authService.register(email, passwordPlain, name, role);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body('email') email: string,
    @Body('password') passwordPlain: string,
  ) {
    this.logger.log(`Login attempt for user: ${email}`);
    return this.authService.login(email, passwordPlain);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    this.logger.log(`Session refresh requested.`);
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: any, @Body('refreshToken') refreshToken: string) {
    const userId = req.user.id;
    const authHeader = req.headers.authorization;
    const accessToken = authHeader ? authHeader.split(' ')[1] : '';
    
    this.logger.log(`Logout requested for user: ${userId}`);
    await this.authService.logout(userId, refreshToken, accessToken);
  }

  // Example of a role-protected profile endpoint
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return this.authService.validateUserById(req.user.id);
  }

  // Example of an Admin-only protected test route
  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAdminStats() {
    return {
      status: 'success',
      message: 'Welcome, administrator. Authorized audit endpoint live.',
      timestamp: new Date().toISOString(),
    };
  }
}
