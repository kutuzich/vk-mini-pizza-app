import { Controller, Get, Logger, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { randomBytes, createHash } from 'crypto';

interface PkceEntry {
  codeVerifier: string;
  createdAt: number;
}

@Controller('api/auth/vk')
export class VkOauthController {
  private readonly logger = new Logger(VkOauthController.name);
  private readonly pkceStore = new Map<string, PkceEntry>();

  @Get()
  redirectToVk(@Res() res: Response) {
    this.cleanupExpiredEntries();

    const clientId = process.env.VK_APP_ID;
    const redirectUri =
      process.env.VK_REDIRECT_URI ||
      'http://localhost:3000/api/auth/vk/callback';

    const codeVerifier = randomBytes(64).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    const state = randomBytes(32).toString('hex');

    this.pkceStore.set(state, { codeVerifier, createdAt: Date.now() });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId || '',
      redirect_uri: redirectUri,
      state,
      scope: 'vkid.personal_info',
      code_challenge: codeChallenge,
      code_challenge_method: 's256',
    });

    res.redirect(`https://id.vk.com/authorize?${params}`);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('device_id') deviceId: string,
    @Res() res: Response,
  ) {
    const clientId = process.env.VK_APP_ID || '';
    const redirectUri =
      process.env.VK_REDIRECT_URI ||
      'http://localhost:3000/api/auth/vk/callback';
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';

    const pkceEntry = this.pkceStore.get(state);
    this.pkceStore.delete(state);

    if (!pkceEntry || Date.now() - pkceEntry.createdAt > 600_000) {
      this.logger.warn('Invalid or expired PKCE state');
      res.redirect(`${frontendUrl}/?vk_error=auth_failed`);
      return;
    }

    const tokenParams: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: pkceEntry.codeVerifier,
      state,
    };
    if (deviceId) {
      tokenParams.device_id = deviceId;
    }

    const tokenRes = await fetch('https://id.vk.com/oauth2/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(tokenParams).toString(),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      this.logger.warn('VK ID token exchange failed', tokenData);
      res.redirect(`${frontendUrl}/?vk_error=auth_failed`);
      return;
    }

    const vkUserId = tokenData.user_id;

    const userRes = await fetch('https://id.vk.com/oauth2/user_info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        access_token: tokenData.access_token,
        client_id: clientId,
      }).toString(),
    });
    const userData = await userRes.json();
    const user = userData.user;

    const vkName = user
      ? `${user.first_name} ${user.last_name}`
      : 'VK User';
    const vkPhoto = user?.avatar || '';

    const params = new URLSearchParams({
      vk_user_id: String(vkUserId),
      vk_name: vkName,
      vk_photo: vkPhoto,
    });
    res.redirect(`${frontendUrl}/?${params}`);
  }

  private cleanupExpiredEntries() {
    const now = Date.now();
    for (const [key, entry] of this.pkceStore) {
      if (now - entry.createdAt > 600_000) {
        this.pkceStore.delete(key);
      }
    }
  }
}
