import {
  verifyCloudProof,
  IVerifyResponse,
  ISuccessResult,
} from "@worldcoin/minikit-js";
import { NextRequest, NextResponse } from "next/server";
import { upsertUser } from "@/lib/db";

interface VerifyRequest {
  payload: ISuccessResult;
  action: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: VerifyRequest = await req.json();
    const { payload, action } = body;

    // Validate required fields
    if (!payload || !action) {
      return NextResponse.json(
        { verified: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const app_id = process.env.APP_ID as `app_${string}`;

    if (!app_id) {
      console.error("APP_ID not configured");
      return NextResponse.json(
        { verified: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Verify the proof with World ID
    const verifyRes: IVerifyResponse = await verifyCloudProof(
      payload,
      app_id,
      action
    );

    if (!verifyRes.success) {
      console.error("World ID verification failed:", verifyRes);
      return NextResponse.json(
        {
          verified: false,
          error: verifyRes.code || "Verification failed",
          detail: verifyRes.detail,
        },
        { status: 400 }
      );
    }

    // Create or update user in database
    const user = await upsertUser(payload.nullifier_hash);

    if (!user) {
      console.error("Failed to create/update user");
      return NextResponse.json(
        { verified: false, error: "Failed to save user" },
        { status: 500 }
      );
    }

    // Create success response with auth cookie
    const response = NextResponse.json({
      verified: true,
      user: {
        nullifier_hash: user.nullifier_hash,
        trust_score: user.trust_score,
        review_count: user.review_count,
      },
    });

    // Set auth cookie
    response.cookies.set("auth", payload.nullifier_hash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // 'lax' for World App webview compatibility
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Verify endpoint error:", error);
    return NextResponse.json(
      { verified: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
