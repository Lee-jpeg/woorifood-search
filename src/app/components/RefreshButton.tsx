"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Check, AlertCircle } from "lucide-react";

type PipelineStatus = "idle" | "queued" | "in_progress" | "completed" | "failed" | "unknown";

interface StatusData {
    status: PipelineStatus;
    message: string;
    progress?: number;
    elapsedMin?: number;
}

export default function RefreshButton() {
    const [loading, setLoading] = useState(false);
    const [statusData, setStatusData] = useState<StatusData | null>(null);
    const [polling, setPolling] = useState(false);
    const [showBar, setShowBar] = useState(false);

    const checkStatus = useCallback(async () => {
        try {
            const res = await fetch("/api/refresh/status", { cache: "no-store" });
            const data: StatusData = await res.json();
            setStatusData(data);

            if (data.status === "queued" || data.status === "in_progress") {
                setShowBar(true);
                return true; // keep polling
            }

            if (data.status === "completed" || data.status === "failed") {
                setShowBar(true);
                // Auto-hide after 10s and reload if completed
                setTimeout(() => {
                    setShowBar(false);
                    setStatusData(null);
                    if (data.status === "completed") {
                        window.location.reload();
                    }
                }, 5000);
                return false; // stop polling
            }

            return false;
        } catch {
            return false;
        }
    }, []);

    // Polling effect
    useEffect(() => {
        if (!polling) return;

        const interval = setInterval(async () => {
            const shouldContinue = await checkStatus();
            if (!shouldContinue) {
                setPolling(false);
            }
        }, 5000); // Poll every 5s

        return () => clearInterval(interval);
    }, [polling, checkStatus]);

    const triggerRefresh = async () => {
        if (loading || polling) return;
        setLoading(true);

        try {
            const res = await fetch("/api/refresh", { method: "POST" });
            const data = await res.json();

            if (data.success) {
                setStatusData({
                    status: "queued",
                    message: "파이프라인 시작 요청됨...",
                    progress: 2,
                });
                setShowBar(true);
                setPolling(true);
            } else {
                setStatusData({
                    status: "failed",
                    message: data.error || "트리거 실패",
                    progress: 0,
                });
                setShowBar(true);
                setTimeout(() => {
                    setShowBar(false);
                    setStatusData(null);
                }, 8000);
            }
        } catch {
            setStatusData({
                status: "failed",
                message: "요청 실패",
                progress: 0,
            });
            setShowBar(true);
            setTimeout(() => {
                setShowBar(false);
                setStatusData(null);
            }, 8000);
        } finally {
            setLoading(false);
        }
    };

    const isActive = polling || loading;
    const progress = statusData?.progress ?? 0;

    const barColor =
        statusData?.status === "failed"
            ? "bg-red-500"
            : statusData?.status === "completed"
                ? "bg-green-500"
                : "bg-teal-500";

    const StatusIcon =
        statusData?.status === "completed"
            ? Check
            : statusData?.status === "failed"
                ? AlertCircle
                : null;

    return (
        <>
            {/* Progress bar at the very top of the page */}
            {showBar && (
                <div className="fixed top-0 left-0 right-0 z-[100]">
                    {/* Background track */}
                    <div className="h-1 bg-slate-200 w-full">
                        <div
                            className={`h-full ${barColor} transition-all duration-1000 ease-out ${statusData?.status === "in_progress" ? "animate-pulse" : ""
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Status message pill */}
                    <div className="flex justify-center">
                        <div
                            className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shadow-md transition-all ${statusData?.status === "failed"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : statusData?.status === "completed"
                                        ? "bg-green-50 text-green-700 border border-green-200"
                                        : "bg-teal-50 text-teal-700 border border-teal-200"
                                }`}
                        >
                            {StatusIcon ? (
                                <StatusIcon className="w-3 h-3" />
                            ) : (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                            )}
                            <span>{statusData?.message}</span>
                            {statusData?.elapsedMin !== undefined && (
                                <span className="text-[10px] opacity-60">({statusData.elapsedMin}분 경과)</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Button in navbar */}
            <button
                onClick={triggerRefresh}
                disabled={isActive}
                title="기사 새로 수집하기"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors disabled:opacity-50"
            >
                <RefreshCw className={`w-3.5 h-3.5 ${isActive ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{isActive ? "수집 중..." : "기사 수집"}</span>
            </button>
        </>
    );
}
