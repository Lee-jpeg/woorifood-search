"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export default function RefreshButton() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const triggerRefresh = async () => {
        if (loading) return;
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch("/api/refresh", { method: "POST" });
            const data = await res.json();

            if (data.success) {
                setMessage("✅ 수집 시작! 10~15분 후 새로고침하세요.");
            } else {
                setMessage(`⚠️ ${data.error}`);
            }
        } catch {
            setMessage("❌ 요청 실패. 잠시 후 다시 시도해주세요.");
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(null), 8000);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={triggerRefresh}
                disabled={loading}
                title="기사 새로 수집하기"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors disabled:opacity-50"
            >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{loading ? "수집 중..." : "기사 수집"}</span>
            </button>

            {message && (
                <div className="absolute top-full right-0 mt-2 w-64 text-xs bg-white border border-slate-200 shadow-lg rounded-lg px-3 py-2 z-50">
                    {message}
                </div>
            )}
        </div>
    );
}
