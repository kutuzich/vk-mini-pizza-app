import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin } from './admin.entity.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const admin = await this.adminRepo.findOneBy({ username });
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: admin.id, username: admin.username };
    return { access_token: this.jwtService.sign(payload) };
  }

  async seedAdmin() {
    const count = await this.adminRepo.count();
    if (count === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await this.adminRepo.save({ username: 'admin', passwordHash: hash });
    }
  }
}
