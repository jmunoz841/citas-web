import {
  AuthApi,
  AuthError,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  SessionResponse,
} from './types';

interface StoredUser {
  id: number;
  firstNames: string;
  lastNames: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  password: string;
  roles: string[];
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockAuthApi implements AuthApi {
  private users: StoredUser[] = [
    {
      id: 1,
      firstNames: 'Demo',
      lastNames: 'Usuario',
      documentType: 'CC',
      documentNumber: '1098765432',
      email: 'demo@citaclara.test',
      phone: '+57 312 458 9021',
      password: 'Demo1234',
      roles: ['USER'],
    },
  ];

  // Active access tokens mapped to user ID
  private activeTokens: Map<string, number> = new Map();
  // Active refresh tokens mapped to user ID
  private refreshTokens: Map<string, number> = new Map();

  private generateToken(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    await delay(600);

    const normalizedDoc = data.documentNumber.replace(/[\s.-]/g, '');

    // Specific mock rejections specified in requirements
    if (data.email.trim().toLowerCase() === 'registrado@citaclara.test') {
      throw new AuthError({
        status: 409,
        code: 'EMAIL_ALREADY_REGISTERED',
        detail: 'El correo electrónico ya se encuentra registrado en el sistema.',
      });
    }

    if (normalizedDoc === '1234567') {
      throw new AuthError({
        status: 409,
        code: 'DOCUMENT_ALREADY_REGISTERED',
        detail: 'El documento de identidad ya se encuentra registrado en el sistema.',
      });
    }

    // Also check against current users in memory
    const existingEmail = this.users.find(
      (u) => u.email.toLowerCase() === data.email.trim().toLowerCase()
    );
    if (existingEmail) {
      throw new AuthError({
        status: 409,
        code: 'EMAIL_ALREADY_REGISTERED',
        detail: 'El correo electrónico ya se encuentra registrado en el sistema.',
      });
    }

    const existingDoc = this.users.find(
      (u) => u.documentNumber.replace(/[\s.-]/g, '') === normalizedDoc
    );
    if (existingDoc) {
      throw new AuthError({
        status: 409,
        code: 'DOCUMENT_ALREADY_REGISTERED',
        detail: 'El documento de identidad ya se encuentra registrado en el sistema.',
      });
    }

    const newUser: StoredUser = {
      id: this.users.length + 1,
      firstNames: data.firstNames.trim(),
      lastNames: data.lastNames.trim(),
      documentType: data.documentType,
      documentNumber: data.documentNumber.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      password: data.password,
      roles: ['USER'],
    };

    this.users.push(newUser);

    return {
      id: newUser.id,
      firstNames: newUser.firstNames,
      lastNames: newUser.lastNames,
      documentType: newUser.documentType,
      documentNumber: newUser.documentNumber,
      email: newUser.email,
      phone: newUser.phone,
      roles: newUser.roles,
    };
  }

  async login(data: LoginRequest): Promise<AuthTokens> {
    await delay(600);

    const user = this.users.find(
      (u) => u.email.toLowerCase() === data.email.trim().toLowerCase()
    );

    if (!user || user.password !== data.password) {
      throw new AuthError({
        status: 401,
        code: 'INVALID_CREDENTIALS',
        detail: 'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.',
      });
    }

    const accessToken = this.generateToken('acc');
    const refreshToken = this.generateToken('ref');

    this.activeTokens.set(accessToken, user.id);
    this.refreshTokens.set(refreshToken, user.id);

    return {
      tokenType: 'Bearer',
      accessToken,
      expiresIn: 900,
      refreshToken,
      refreshExpiresIn: 604800,
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    await delay(300);

    const userId = this.refreshTokens.get(refreshToken);
    if (!userId) {
      throw new AuthError({
        status: 401,
        code: 'INVALID_REFRESH_TOKEN',
        detail: 'El token de actualización es inválido o ha expirado.',
      });
    }

    // Token rotation: delete old refresh token
    this.refreshTokens.delete(refreshToken);

    const newAccessToken = this.generateToken('acc');
    const newRefreshToken = this.generateToken('ref');

    this.activeTokens.set(newAccessToken, userId);
    this.refreshTokens.set(newRefreshToken, userId);

    return {
      tokenType: 'Bearer',
      accessToken: newAccessToken,
      expiresIn: 900,
      refreshToken: newRefreshToken,
      refreshExpiresIn: 604800,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await delay(200);
    this.refreshTokens.delete(refreshToken);
  }

  async getSession(accessToken: string): Promise<SessionResponse> {
    await delay(250);

    const userId = this.activeTokens.get(accessToken);
    if (!userId) {
      throw new AuthError({
        status: 401,
        code: 'UNAUTHORIZED',
        detail: 'Sesión no válida o expirada.',
      });
    }

    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      throw new AuthError({
        status: 401,
        code: 'UNAUTHORIZED',
        detail: 'Usuario no encontrado.',
      });
    }

    return {
      userId: user.id,
      email: user.email,
      roles: user.roles,
    };
  }
}
