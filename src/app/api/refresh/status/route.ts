import { NextResponse } from "next/server";

export async function GET() {
    const githubToken = process.env.GITHUB_TOKEN;
    const repo = "Lee-jpeg/woorifood-search";

    if (!githubToken) {
        return NextResponse.json({ status: "unknown", message: "GITHUB_TOKEN 미설정" });
    }

    try {
        // Get most recent workflow runs
        const res = await fetch(
            `https://api.github.com/repos/${repo}/actions/workflows/daily-pipeline.yml/runs?per_page=1`,
            {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: "application/vnd.github.v3+json",
                },
                cache: "no-store",
            }
        );

        if (!res.ok) {
            return NextResponse.json({ status: "unknown", message: "API 오류" });
        }

        const data = await res.json();
        const run = data.workflow_runs?.[0];

        if (!run) {
            return NextResponse.json({ status: "idle", message: "실행 기록 없음" });
        }

        const createdAt = new Date(run.created_at);
        const now = new Date();
        const elapsedMs = now.getTime() - createdAt.getTime();
        const elapsedMin = elapsedMs / 60000;

        // Estimate progress based on elapsed time (pipeline takes ~15 min)
        const TOTAL_ESTIMATED_MIN = 15;

        if (run.status === "queued") {
            return NextResponse.json({
                status: "queued",
                message: "대기 중...",
                progress: 5,
                runId: run.id,
            });
        }

        if (run.status === "in_progress") {
            const progress = Math.min(95, Math.round((elapsedMin / TOTAL_ESTIMATED_MIN) * 100));

            let stage = "수집 중...";
            if (elapsedMin < 2) stage = "환경 설정 중...";
            else if (elapsedMin < 5) stage = "네이버 기사 수집 중...";
            else if (elapsedMin < 12) stage = "AI 분석 중...";
            else stage = "저장 및 배포 중...";

            return NextResponse.json({
                status: "in_progress",
                message: stage,
                progress,
                elapsedMin: Math.round(elapsedMin),
                runId: run.id,
            });
        }

        // completed
        return NextResponse.json({
            status: run.conclusion === "success" ? "completed" : "failed",
            message: run.conclusion === "success"
                ? `수집 완료 (${Math.round(elapsedMin)}분 전)`
                : "수집 실패",
            progress: 100,
            completedAt: run.updated_at,
            runId: run.id,
        });
    } catch (e) {
        console.error("Status check error:", e);
        return NextResponse.json({ status: "unknown", message: "상태 확인 실패" });
    }
}
