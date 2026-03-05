import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Not authenticated or not in an organization" },
        { status: 401 }
      );
    }

    if (!has({ role: "org:admin" })) {
      return NextResponse.json(
        { error: "Admin role required" },
        { status: 403 }
      );
    }

    const { email, role } = await request.json();
    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    const client = await clerkClient();
    await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: email,
      role: role === "admin" ? "org:admin" : "org:member",
      inviterUserId: userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send invite:", error);
    const message = error instanceof Error ? error.message : "Failed to send invite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
