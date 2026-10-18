import { useEffect, useMemo, useState } from "react";
import {
    Search,
    RefreshCw,
    FileSpreadsheet,
    CheckCircle2,
    AlertTriangle,
    Clock3,
} from "lucide-react";

import api from "../services/api";

const PREVIEW_LIMIT = 10;

export default function UploadHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showAll, setShowAll] = useState(false);

    const loadHistory = async () => {
        try {
            setError("");

            if (history.length === 0) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            const response = await api.get("/upload-history");

            setHistory(Array.isArray(response.data) ? response.data : []);

        } catch (err) {
            console.error("Upload history error:", err);

            setError(
                err.response?.data?.detail ||
                    "Unable to load upload history."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const filteredHistory = useMemo(() => {
        const query = search.trim().toLowerCase();

        const base = !query
            ? history
            : history.filter((item) =>
                  String(item.file_name || "")
                      .toLowerCase()
                      .includes(query)
              );

        return base;
    }, [history, search]);

    const displayedHistory = useMemo(() => {
        if (showAll) return filteredHistory;
        return filteredHistory.slice(0, PREVIEW_LIMIT);
    }, [filteredHistory, showAll]);

    const hasMore = filteredHistory.length > PREVIEW_LIMIT;

    const totalUploads = history.length;

    const successfulUploads = history.filter(
        (item) => item.status === "success"
    ).length;

    const totalInvalidRows = history.reduce(
        (total, item) =>
            total + Number(item.invalid_rows || 0),
        0
    );

    const averageQuality =
        history.length > 0
            ? (
                  history.reduce(
                      (total, item) =>
                          total +
                          Number(item.quality_percentage || 0),
                      0
                  ) / history.length
              ).toFixed(1)
            : "0.0";

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "—";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatus = (status) => {
        if (status === "success") {
            return {
                label: "Success",
                className:
                    "bg-emerald-900/30 text-emerald-400 border-emerald-800/50",
                icon: CheckCircle2,
            };
        }

        return {
            label: status || "Unknown",
            className:
                "bg-yellow-900/30 text-yellow-400 border-yellow-800/50",
            icon: AlertTriangle,
        };
    };

    return (
        <div className="mt-8 bg-[#0B1730] rounded-2xl border border-[#1E3A8A] shadow-sm overflow-hidden">

            {/* HEADER */}

            <div className="p-6 border-b border-[#1E3A8A]">

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                    <div>
                        <div className="flex items-center gap-3">

                            <div className="w-11 h-11 rounded-xl bg-purple-900/30 flex items-center justify-center">
                                <FileSpreadsheet
                                    size={22}
                                    className="text-purple-400"
                                />
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Upload History
                                </h2>

                                <p className="text-sm text-slate-300 mt-1">
                                    Recent sales files processed by Vanira Spark
                                </p>
                            </div>

                        </div>
                    </div>

                    <button
                        onClick={loadHistory}
                        disabled={loading || refreshing}
                        className="
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            px-4
                            py-2.5
                            rounded-xl
                            bg-purple-600
                            text-white
                            text-sm
                            font-medium
                            hover:bg-purple-700
                            disabled:bg-slate-700
                            disabled:cursor-not-allowed
                            transition
                        "
                    >
                        <RefreshCw
                            size={16}
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>

                </div>


                {/* SUMMARY CARDS */}

                {!loading && !error && history.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">

                        <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-900/50">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                                Total Uploads
                            </p>

                            <p className="text-2xl font-bold text-white mt-2">
                                {totalUploads}
                            </p>
                        </div>


                        <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-800/50">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                                Successful
                            </p>

                            <p className="text-2xl font-bold text-emerald-400 mt-2">
                                {successfulUploads}
                            </p>
                        </div>


                        <div className="p-4 rounded-xl bg-red-900/20 border border-red-900/50">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                                Invalid Rows
                            </p>

                            <p className="text-2xl font-bold text-red-300 mt-2">
                                {totalInvalidRows}
                            </p>
                        </div>


                        <div className="p-4 rounded-xl bg-indigo-900/20 border border-indigo-900/50">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                                Avg. Quality
                            </p>

                            <p className="text-2xl font-bold text-indigo-400 mt-2">
                                {averageQuality}%
                            </p>
                        </div>

                    </div>
                )}

            </div>


            {/* SEARCH */}

            {!loading && !error && history.length > 0 && (
                <div className="px-6 py-4 border-b border-[#1E3A8A]">

                    <div className="relative max-w-md">

                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Search uploaded files..."
                            className="
                                w-full
                                pl-10
                                pr-4
                                py-2.5
                                rounded-xl
                                border
                                border-[#1E3A8A]
                                bg-[#050816]
                                text-sm
                                text-slate-200
                                placeholder:text-slate-500
                                outline-none
                                focus:border-purple-500
                                focus:ring-2
                                focus:ring-purple-900/50
                                transition
                            "
                        />

                    </div>

                </div>
            )}


            {/* LOADING */}

            {loading && (
                <div className="p-12 text-center">

                    <RefreshCw
                        size={28}
                        className="mx-auto text-purple-400 animate-spin"
                    />

                    <p className="text-slate-300 font-medium mt-4">
                        Loading upload history...
                    </p>

                    <p className="text-sm text-slate-400 mt-1">
                        Please wait while we fetch your latest uploads.
                    </p>

                </div>
            )}


            {/* ERROR */}

            {!loading && error && (
                <div className="p-6">

                    <div className="p-5 rounded-xl bg-red-900/20 border border-red-900/50">

                        <div className="flex items-start gap-3">

                            <AlertTriangle
                                size={21}
                                className="text-red-400 mt-0.5"
                            />

                            <div>
                                <p className="font-semibold text-red-400">
                                    Unable to load upload history
                                </p>

                                <p className="text-sm text-red-300 mt-1">
                                    {error}
                                </p>

                                <button
                                    onClick={loadHistory}
                                    className="mt-3 text-sm font-medium text-red-300 hover:text-red-200 underline"
                                >
                                    Try again
                                </button>
                            </div>

                        </div>

                    </div>

                </div>
            )}


            {/* EMPTY */}

            {!loading &&
                !error &&
                history.length === 0 && (
                    <div className="p-12 text-center">

                        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#132347] flex items-center justify-center">
                            <FileSpreadsheet
                                size={30}
                                className="text-slate-500"
                            />
                        </div>

                        <h3 className="font-semibold text-white mt-5">
                            No uploads yet
                        </h3>

                        <p className="text-sm text-slate-300 mt-1">
                            Uploaded sales files will appear here.
                        </p>

                    </div>
                )}


            {/* NO SEARCH RESULTS */}

            {!loading &&
                !error &&
                history.length > 0 &&
                filteredHistory.length === 0 && (
                    <div className="p-10 text-center">

                        <Search
                            size={28}
                            className="mx-auto text-slate-600"
                        />

                        <h3 className="font-semibold text-slate-300 mt-4">
                            No matching uploads
                        </h3>

                        <p className="text-sm text-slate-400 mt-1">
                            Try searching with a different file name.
                        </p>

                    </div>
                )}


            {/* TABLE */}

            {!loading &&
                !error &&
                filteredHistory.length > 0 && (
                    <>
                    <div className="overflow-x-auto">

                        <table className="w-full text-sm">

                            <thead className="bg-[#050816] border-b border-[#1E3A8A]">

                                <tr>

                                    <th className="text-left px-4 py-4 font-semibold text-slate-300 whitespace-nowrap">
                                        File
                                    </th>

                                    <th className="text-left px-3 py-4 font-semibold text-slate-300 whitespace-nowrap">
                                        Uploaded
                                    </th>

                                    <th className="text-center px-2 py-4 font-semibold text-slate-300 whitespace-nowrap">
                                        Original
                                    </th>

                                    <th className="text-center px-2 py-4 font-semibold text-slate-300 whitespace-nowrap">
                                        Cleaned
                                    </th>

                                    <th className="text-center px-2 py-4 font-semibold text-slate-300 whitespace-nowrap">
                                        Invalid
                                    </th>

                                    <th className="text-center px-2 py-4 font-semibold text-slate-300 whitespace-nowrap">
                                        Duplicates
                                    </th>

                                    <th className="text-center px-2 py-4 font-semibold text-slate-300 whitespace-nowrap">
                                        Valid
                                    </th>

                                    <th className="text-center px-2 py-4 font-semibold text-slate-300 whitespace-nowrap">
                                        Quality
                                    </th>

                                    <th className="text-center px-4 py-4 font-semibold text-slate-300 whitespace-nowrap">
                                        Status
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {displayedHistory.map((item) => {

                                    const status = getStatus(
                                        item.status
                                    );

                                    const StatusIcon =
                                        status.icon;

                                    return (
                                        <tr
                                            key={item.id}
                                            className="border-b border-[#1E3A8A] hover:bg-[#050816] transition"
                                        >

                                            {/* FILE */}

                                            <td className="px-4 py-4">

                                                <div className="flex items-center gap-2">

                                                    <div className="w-8 h-8 rounded-lg bg-purple-900/30 flex items-center justify-center shrink-0">

                                                        <FileSpreadsheet
                                                            size={16}
                                                            className="text-purple-400"
                                                        />

                                                    </div>

                                                    <div className="min-w-0">

                                                        <p
                                                            className="font-medium text-white truncate max-w-[180px]"
                                                            title={item.file_name}
                                                        >
                                                            {item.file_name}
                                                        </p>

                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            Upload #{item.id}
                                                        </p>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* DATE */}

                                            <td className="px-3 py-4">

                                                <div className="flex items-center gap-1.5 text-slate-300 text-xs whitespace-nowrap">

                                                    <Clock3
                                                        size={13}
                                                        className="text-slate-400"
                                                    />

                                                    {formatDate(
                                                        item.uploaded_at
                                                    )}

                                                </div>

                                            </td>


                                            {/* ORIGINAL */}

                                            <td className="px-2 py-4 text-center font-medium text-slate-200">
                                                {item.original_rows ?? 0}
                                            </td>


                                            {/* CLEANED */}

                                            <td className="px-2 py-4 text-center font-medium text-emerald-400">
                                                {item.cleaned_rows ?? 0}
                                            </td>


                                            {/* INVALID */}

                                            <td className="px-2 py-4 text-center">

                                                <span
                                                    className={
                                                        Number(
                                                            item.invalid_rows || 0
                                                        ) > 0
                                                            ? "font-semibold text-red-400"
                                                            : "text-slate-500"
                                                    }
                                                >
                                                    {item.invalid_rows ?? 0}
                                                </span>

                                            </td>


                                            {/* DUPLICATES */}

                                            <td className="px-2 py-4 text-center">

                                                <span
                                                    className={
                                                        Number(
                                                            item.duplicate_rows || 0
                                                        ) > 0
                                                            ? "font-semibold text-yellow-400"
                                                            : "text-slate-500"
                                                    }
                                                >
                                                    {item.duplicate_rows ?? 0}
                                                </span>

                                            </td>


                                            {/* VALID */}

                                            <td className="px-2 py-4 text-center font-semibold text-purple-400">
                                                {item.final_valid_rows ?? 0}
                                            </td>


                                            {/* QUALITY */}

                                            <td className="px-2 py-4 text-center">

                                                <span className="inline-flex px-2 py-1 rounded-full bg-indigo-900/20 text-indigo-400 font-semibold text-xs">
                                                    {item.quality_percentage ??
                                                        0}
                                                    %
                                                </span>

                                            </td>


                                            {/* STATUS */}

                                            <td className="px-4 py-4 text-center">

                                                <span
                                                    className={`
                                                        inline-flex
                                                        items-center
                                                        gap-1.5
                                                        px-3
                                                        py-1.5
                                                        rounded-full
                                                        border
                                                        text-xs
                                                        font-semibold
                                                        ${status.className}
                                                    `}
                                                >

                                                    <StatusIcon
                                                        size={14}
                                                    />

                                                    {status.label}

                                                </span>

                                            </td>

                                        </tr>
                                    );
                                })}

                            </tbody>

                        </table>

                    </div>

                    {/* VIEW ALL / SHOW LESS BUTTON */}

                    {(hasMore || showAll) && (
                        <div className="px-6 py-4 border-t border-[#1E3A8A] flex items-center justify-between bg-[#050816]/40">

                            <p className="text-sm text-slate-400">
                                {showAll
                                    ? `Showing all ${filteredHistory.length} uploads`
                                    : `Showing ${Math.min(PREVIEW_LIMIT, filteredHistory.length)} of ${filteredHistory.length} uploads`
                                }
                            </p>

                            <button
                                type="button"
                                onClick={() => setShowAll((prev) => !prev)}
                                className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    px-5
                                    py-2
                                    rounded-xl
                                    bg-purple-600
                                    hover:bg-purple-700
                                    text-white
                                    text-sm
                                    font-semibold
                                    transition
                                "
                            >
                                {showAll ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                        Show Less
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                        View All {filteredHistory.length} Uploads
                                    </>
                                )}
                            </button>

                        </div>
                    )}

                    </>
                )}

        </div>
    );
}
