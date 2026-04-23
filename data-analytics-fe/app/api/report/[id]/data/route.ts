import { auth } from "@/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page") || "1";
  const pageSize = searchParams.get("pageSize") || "50";

  try {
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:4001";

    const backendEndpoint = `${backendUrl}/dataset/${id}?page=${page}&pageSize=${pageSize}`;
    const res = await fetch(backendEndpoint);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Backend returned ${res.status}: ${errorText}`);
      return NextResponse.json(
        { error: `Backend error: ${res.status}`, details: errorText },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Dataset Proxy Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
