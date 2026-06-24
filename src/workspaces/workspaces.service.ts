import { ForbiddenException, Injectable } from "@nestjs/common";
import { Prisma, WorkspaceMember, WorkspaceRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export const workspaceSummarySelect = {
  id: true,
  name: true,
  businessType: true,
  phone: true,
  email: true,
  location: true,
  mainServiceCategory: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WorkspaceSelect;

export type WorkspaceSummary = Prisma.WorkspaceGetPayload<{
  select: typeof workspaceSummarySelect;
}>;

export interface MembershipSummary {
  workspaceId: string;
  role: WorkspaceRole;
  workspace: WorkspaceSummary;
}

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns every workspace the user belongs to, with their role.
   */
  async listMembershipsForUser(userId: string): Promise<MembershipSummary[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      select: {
        workspaceId: true,
        role: true,
        workspace: { select: workspaceSummarySelect },
      },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((m) => ({
      workspaceId: m.workspaceId,
      role: m.role,
      workspace: m.workspace,
    }));
  }

  /**
   * Returns the membership row if the user belongs to the workspace, else null.
   */
  findMembership(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMember | null> {
    return this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
  }

  /**
   * Multi-tenant gatekeeper. Throws 403 unless the user is a member of the
   * workspace. Returns the membership so callers can inspect the role.
   */
  async assertMembership(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMember> {
    const membership = await this.findMembership(userId, workspaceId);
    if (!membership) {
      throw new ForbiddenException("Unauthorized access to workspace");
    }
    return membership;
  }
}
