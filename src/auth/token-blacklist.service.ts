import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlacklistedToken } from './entities/blacklisted-token.entity';

@Injectable()
export class TokenBlacklistService {
  constructor(
    @InjectRepository(BlacklistedToken)
    private blacklistedTokenRepository: Repository<BlacklistedToken>,
  ) {}

  /**
   * Add token to blacklist
   */
  async addToBlacklist(
    jti: string,
    userId: string,
    tokenType: 'access' | 'refresh',
    expiresAt: Date,
  ): Promise<void> {
    const blacklistedToken = this.blacklistedTokenRepository.create({
      jti,
      user_id: userId,
      token_type: tokenType,
      expires_at: expiresAt,
    });

    await this.blacklistedTokenRepository.save(blacklistedToken);
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const blacklistedToken = await this.blacklistedTokenRepository.findOne({
      where: { jti },
    });

    if (!blacklistedToken) {
      return false;
    }

    // Check if token has expired (auto-cleanup)
    if (blacklistedToken.expires_at < new Date()) {
      await this.blacklistedTokenRepository.delete({ jti });
      return false;
    }

    return true;
  }

  /**
   * Clean up expired tokens from blacklist
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.blacklistedTokenRepository
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute();
  }

  /**
   * Blacklist all tokens for a user (useful for logout all devices)
   * Currently not implemented - would require session tracking
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async blacklistAllUserTokens(_userId: string): Promise<void> {
    // This would require storing all active tokens for a user
    // For now, we'll implement single token blacklisting
    // In a production environment, you might want to store active sessions
  }
}
