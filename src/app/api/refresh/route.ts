import { NextResponse } from "next/server";

export async function POST() {
    // GitHub Personal Access Token이 필요합니다
    const githubToken = process.env.GITHUB_TOKEN;
    const repo = "Lee-jpeg/woorifood-search";
    const workflow = "daily-pipeline.yml";

    if (!githubToken) {
        return NextResponse.json(
            { error: "GITHUB_TOKEN이 설정되지 않았습니다. Vercel 환경변수에 추가해주세요." },
            { status: 500 }
        );
    }

    try {
        const res = await fetch(
            `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: "application/vnd.github.v3+json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ref: "main" }),
            }
        );

        if (res.status === 204) {
            return NextResponse.json({
                success: true,
                message: "파이프라인이 시작되었습니다. 약 10~15분 후 새 데이터가 반영됩니다.",
            });
        }

        const errorText = await res.text();
        return NextResponse.json(
            { error: `GitHub API 오류: ${res.status} — ${errorText}` },
            { status: res.status }
        );
    } catch (e) {
        console.error("Refresh trigger error:", e);
        return NextResponse.json(
            { error: "파이프라인 트리거 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
