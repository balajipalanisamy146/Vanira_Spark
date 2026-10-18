import { useEffect, useMemo, useState } from "react";

import {
    ShieldCheck,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    Database,
    FileWarning,
    Search,
    Upload,
} from "lucide-react";

import api from "../services/api";
import PageHero from "../components/PageHero";

export default function DataQuality() {

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const loadDataQuality = async () => {

        try {

            setError("");

            if (data) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await api.get(
                "/analytics/data-quality"
            );

            setData(response.data);

        } catch (err) {

            console.error(
                "Data quality error:",
                err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to load data quality information."
            );

        } finally {

            setLoading(false);
            setRefreshing(false);
        }
    };


    useEffect(() => {
        loadDataQuality();
    }, []);


    const summary = data?.summary || {};

    const errorBreakdown =
        data?.error_breakdown || [];

    const invalidRecords =
        data?.invalid_records || [];


    const filteredRecords = useMemo(() => {

        const query = search
            .trim()
            .toLowerCase();

        if (!query) {
            return invalidRecords;
        }

        return invalidRecords.filter(
            (record) =>
                String(
                    record.invoice_id || ""
                )
                    .toLowerCase()
                    .includes(query) ||

                String(
                    record.error_message || ""
                )
                    .toLowerCase()
                    .includes(query)
        );

    }, [invalidRecords, search]);


    if (loading) {

        return (
            <div className="p-6 flex-1 bg-[#020617] min-h-screen space-y-5">

                <PageHero
                    title="Data Quality"
                    subtitle="Monitor validation, cleaning and data integrity."
                    icon={ShieldCheck}
                />

                <div className="flex items-center justify-center min-h-[500px]">

                    <div className="text-center">

                        <RefreshCw
                            size={32}
                            className="mx-auto text-purple-400 animate-spin"
                        />

                        <p className="mt-4 font-medium text-white">
                            Loading data quality...
                        </p>

                        <p className="text-sm text-slate-400 mt-1">
                            Analyzing your latest sales upload.
                        </p>

                    </div>

                </div>

            </div>
        );
    }


    if (error) {

        return (
            <div className="p-6 flex-1 bg-[#020617] min-h-screen space-y-5">

                <PageHero
                    title="Data Quality"
                    subtitle="Monitor validation, cleaning and data integrity."
                    icon={ShieldCheck}
                />

                <div className="max-w-4xl">

                    <div className="bg-[#0B1730] rounded-2xl border border-red-900/60 p-8">

                        <div className="flex items-start gap-4">

                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <AlertTriangle
                                    className="text-red-400"
                                />
                            </div>

                            <div>

                                <h2 className="text-xl font-bold text-white">
                                    Unable to load Data Quality
                                </h2>

                                <p className="text-sm text-slate-400 mt-2">
                                    {error}
                                </p>

                                <button
                                    onClick={loadDataQuality}
                                    className="mt-5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition"
                                >
                                    Try Again
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            </div>
        );
    }


    if (!data?.has_data) {

        return (
            <div className="p-6 flex-1 bg-[#020617] min-h-screen space-y-5">

                <PageHero
                    title="Data Quality"
                    subtitle="Monitor validation, cleaning and data integrity."
                    icon={ShieldCheck}
                />

                <div className="max-w-4xl">

                    <div className="bg-[#0B1730] rounded-2xl border border-[#1E3A8A] p-12 text-center">

                        <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/10 flex items-center justify-center">

                            <Database
                                size={32}
                                className="text-purple-400"
                            />

                        </div>

                        <h2 className="text-xl font-bold text-white mt-5">
                            No Data Available
                        </h2>

                        <p className="text-sm text-slate-400 mt-2">
                            Upload a sales file to start monitoring data quality.
                        </p>

                    </div>

                </div>

            </div>
        );
    }


    return (
        <div className="p-6 flex-1 bg-[#020617] min-h-screen space-y-5">
            <PageHero
                title="Data Quality"
                subtitle="Monitor validation, cleaning and data integrity."
                icon={ShieldCheck}
                action={(
                    <button
                        onClick={loadDataQuality}
                        disabled={refreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-60"
                    >
                        <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                )}
            />


            {/* LATEST UPLOAD */}

            <div className="bg-[#0B1730] rounded-2xl border border-[#1E3A8A] p-5 mb-6">

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                    <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">

                            <Upload
                                size={19}
                                className="text-blue-400"
                            />

                        </div>

                        <div>

                            <p className="text-xs uppercase tracking-wide font-semibold text-slate-400">
                                Latest Upload
                            </p>

                            <p className="font-semibold text-white mt-1">
                                {data.upload?.file_name}
                            </p>

                        </div>

                    </div>


                    <div className="text-sm text-slate-400">

                        Uploaded{" "}

                        {data.upload?.uploaded_at
                            ? new Date(
                                  data.upload.uploaded_at
                              ).toLocaleString("en-IN")
                            : "—"}

                    </div>

                </div>

            </div>


            {/* KPI CARDS */}

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

                <div className="bg-[#0B1730] rounded-2xl border border-[#1E3A8A] p-5">

                    <p className="text-sm text-slate-400">
                        Original Rows
                    </p>

                    <p className="text-3xl font-bold text-white mt-2">
                        {summary.original_rows ?? 0}
                    </p>

                </div>


                <div className="bg-[#0B1730] rounded-2xl border border-[#1E3A8A] p-5">

                    <p className="text-sm text-slate-400">
                        Cleaned Rows
                    </p>

                    <p className="text-3xl font-bold text-emerald-400 mt-2">
                        {summary.cleaned_rows ?? 0}
                    </p>

                </div>


                <div className="bg-[#0B1730] rounded-2xl border border-[#1E3A8A] p-5">

                    <p className="text-sm text-slate-400">
                        Valid Rows
                    </p>

                    <p className="text-3xl font-bold text-purple-400 mt-2">
                        {summary.valid_rows ?? 0}
                    </p>

                </div>


                <div className="bg-[#0B1730] rounded-2xl border border-red-900/60 p-5">

                    <p className="text-sm text-slate-400">
                        Invalid Rows
                    </p>

                    <p className="text-3xl font-bold text-red-400 mt-2">
                        {summary.invalid_rows ?? 0}
                    </p>

                </div>


                <div className="bg-[#0B1730] rounded-2xl border border-indigo-900/60 p-5">

                    <p className="text-sm text-slate-400">
                        Quality Score
                    </p>

                    <p className="text-3xl font-bold text-indigo-400 mt-2">
                        {summary.quality_percentage ?? 0}%
                    </p>

                </div>

            </div>


            {/* QUALITY OVERVIEW + ERROR BREAKDOWN */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* QUALITY OVERVIEW */}

                <div className="bg-[#0B1730] rounded-2xl border border-[#1E3A8A] p-6">

                    <div className="flex items-center justify-between">

                        <div>

                            <h2 className="text-lg font-bold text-white">
                                Quality Overview
                            </h2>

                            <p className="text-sm text-slate-400 mt-1">
                                Latest upload validation result
                            </p>

                        </div>

                        <CheckCircle2
                            size={24}
                            className="text-green-500"
                        />

                    </div>


                    <div className="mt-7">

                        <div className="flex items-end justify-between">

                            <span className="text-sm text-slate-400">
                                Data Quality
                            </span>

                            <span className="text-3xl font-bold text-indigo-400">
                                {summary.quality_percentage ?? 0}%
                            </span>

                        </div>


                        <div className="w-full h-3 bg-slate-800 rounded-full mt-3 overflow-hidden">

                            <div
                                className="h-full bg-indigo-400 rounded-full transition-all"
                                style={{
                                    width: `${Math.min(
                                        Number(
                                            summary.quality_percentage || 0
                                        ),
                                        100
                                    )}%`,
                                }}
                            />

                        </div>


                        <div className="grid grid-cols-3 gap-3 mt-6">

                            <div className="p-3 rounded-xl bg-emerald-500/10">

                                <p className="text-xs text-slate-400">
                                    Valid
                                </p>

                                <p className="font-bold text-emerald-400 mt-1">
                                    {summary.valid_rows ?? 0}
                                </p>

                            </div>


                            <div className="p-3 rounded-xl bg-red-500/10">

                                <p className="text-xs text-slate-400">
                                    Invalid
                                </p>

                                <p className="font-bold text-red-400 mt-1">
                                    {summary.invalid_rows ?? 0}
                                </p>

                            </div>


                            <div className="p-3 rounded-xl bg-yellow-500/10">

                                <p className="text-xs text-slate-400">
                                    Duplicates
                                </p>

                                <p className="font-bold text-yellow-400 mt-1">
                                    {summary.duplicate_rows ?? 0}
                                </p>

                            </div>

                        </div>

                    </div>

                </div>


                {/* ERROR BREAKDOWN */}

                <div className="bg-[#0B1730] rounded-2xl border border-[#1E3A8A] p-6">

                    <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">

                            <FileWarning
                                size={20}
                                className="text-red-400"
                            />

                        </div>

                        <div>

                            <h2 className="text-lg font-bold text-white">
                                Error Breakdown
                            </h2>

                            <p className="text-sm text-slate-400">
                                Validation issues detected
                            </p>

                        </div>

                    </div>


                    <div className="mt-5 space-y-3 max-h-64 overflow-y-auto">

                        {errorBreakdown.length === 0 ? (

                            <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">

                                <CheckCircle2
                                    size={25}
                                    className="mx-auto text-emerald-400"
                                />

                                <p className="font-medium text-emerald-300 mt-2">
                                    No validation errors
                                </p>

                            </div>

                        ) : (

                            errorBreakdown.map(
                                (item, index) => (

                                    <div
                                        key={`${item.reason}-${index}`}
                                        className="flex items-center justify-between p-3 rounded-xl bg-[#081124] border border-blue-900/60"
                                    >

                                        <div className="flex items-center gap-3">

                                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-xs font-bold text-red-400">
                                                {index + 1}
                                            </div>

                                            <p className="text-sm font-medium text-slate-200">
                                                {item.reason}
                                            </p>

                                        </div>

                                        <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-300 text-xs font-bold">
                                            {item.count}
                                        </span>

                                    </div>

                                )
                            )

                        )}

                    </div>

                </div>

            </div>


            {/* INVALID RECORDS */}

            <div className="bg-[#0B1730] rounded-2xl border border-[#1E3A8A] overflow-hidden">

                <div className="p-6 border-b border-blue-900/70">

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                        <div>

                            <h2 className="text-lg font-bold text-white">
                                Invalid Records
                            </h2>

                            <p className="text-sm text-slate-400 mt-1">
                                Records rejected during validation
                            </p>

                        </div>


                        <div className="relative w-full lg:w-80">

                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search invoice or error..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blue-900 bg-[#081124] text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                            />

                        </div>

                    </div>

                </div>


                {filteredRecords.length === 0 ? (

                    <div className="p-10 text-center">

                        <CheckCircle2
                            size={30}
                            className="mx-auto text-green-500"
                        />

                        <p className="font-medium text-slate-200 mt-3">
                            No invalid records found
                        </p>

                        <p className="text-sm text-slate-400 mt-1">
                            Your latest upload has no records matching this search.
                        </p>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full text-sm">

                            <thead className="bg-[#081124] border-b border-blue-900/70">

                                <tr>

                                    <th className="text-left px-6 py-4 font-semibold text-slate-300">
                                        Invoice ID
                                    </th>

                                    <th className="text-left px-6 py-4 font-semibold text-slate-300">
                                        Error Type
                                    </th>

                                    <th className="text-left px-6 py-4 font-semibold text-slate-300">
                                        Validation Error
                                    </th>

                                    <th className="text-left px-6 py-4 font-semibold text-slate-300">
                                        Submitted Values
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredRecords.map(
                                    (record, index) => (

                                        <tr
                                            key={`${record.invoice_id}-${index}`}
                                            className="border-b border-blue-900/50 hover:bg-[#101c34]"
                                        >

                                            <td className="px-6 py-4 font-medium text-white">
                                                {record.invoice_id || "Missing"}
                                            </td>

                                            <td className="px-6 py-4">

                                                <span className="inline-flex px-2.5 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/20 text-xs font-semibold">
                                                    {record.error_type ||
                                                        "VALIDATION_ERROR"}
                                                </span>

                                            </td>

                                            <td className="px-6 py-4 text-slate-300">
                                                {record.error_message || "—"}
                                            </td>

                                            <td className="px-6 py-4">
                                                <details className="max-w-md">
                                                    <summary className="cursor-pointer text-purple-300 font-medium">
                                                        View row data
                                                    </summary>
                                                    <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-[#081124] p-3 text-xs text-slate-300">
                                                        {JSON.stringify(record.raw_data, null, 2)}
                                                    </pre>
                                                </details>
                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
}
