import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { WorkspaceRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import {
  userSummarySelect,
  UserSummary,
  UsersService,
} from "../users/users.service";
import {
  MembershipSummary,
  WorkspacesService,
  workspaceSummarySelect,
  WorkspaceSummary,
} from "../workspaces/workspaces.service";
import { JwtPayload } from "./strategies/jwt.strategy";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

export interface AuthResult {
  user: UserSummary;
  workspaces: MembershipSummary[];
  accessToken: string;
}

export interface RegisterResult {
  user: UserSummary;
  workspace: WorkspaceSummary;
  accessToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  /**
   * Creates a user + their first workspace (as OWNER) in a single transaction.
   */
  async register(dto: RegisterDto): Promise<RegisterResult> {
    const email = dto.email.toLowerCase();

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const saltRounds = this.config.get<number>("bcryptSaltRounds") ?? 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const { user, workspace } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: dto.fullName,
          email,
          passwordHash,
        },
        select: userSummarySelect,
      });

      const workspace = await tx.workspace.create({
        data: {
          name: dto.workspaceName,
          businessType: dto.businessType,
          phone: dto.phone,
          email: dto.workspaceEmail,
          location: dto.location,
          mainServiceCategory: dto.mainServiceCategory,
        },
        select: workspaceSummarySelect,
      });

      await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: WorkspaceRole.OWNER,
        },
      });

      return { user, workspace };
    });

    this.logger.log(`User registered: ${user.id} (workspace ${workspace.id})`);

    return {
      user,
      workspace,
      accessToken: this.signToken(user.id, user.email),
    };
  }

  /**
   * Verifies credentials and returns a token plus the user's workspaces.
   */
  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email);

    // Constant-ish failure path: same message whether the email or password is
    // wrong. We log the attempt (email only — never the password) for auditing.
    if (!user || !user.isActive) {
      this.logger.warn(`Failed login attempt for email=${dto.email}`);
      throw new UnauthorizedException("Invalid email or password");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      this.logger.warn(`Failed login attempt for email=${dto.email}`);
      throw new UnauthorizedException("Invalid email or password");
    }

    this.logger.log(`User logged in: ${user.id}`);

    const [summary, workspaces] = await Promise.all([
      this.usersService.getSummaryById(user.id),
      this.workspacesService.listMembershipsForUser(user.id),
    ]);

    return {
      user: summary!,
      workspaces,
      accessToken: this.signToken(user.id, user.email),
    };
  }

  /**
   * Current user + their workspace memberships, for GET /auth/me.
   */
  async me(
    userId: string,
  ): Promise<{ user: UserSummary; workspaces: MembershipSummary[] }> {
    const [user, workspaces] = await Promise.all([
      this.usersService.getSummaryById(userId),
      this.workspacesService.listMembershipsForUser(userId),
    ]);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return { user, workspaces };
  }

  private signToken(userId: string, email: string): string {
    const payload: JwtPayload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
