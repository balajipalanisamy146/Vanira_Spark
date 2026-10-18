
import { useEffect, useState } from "react";
import {
    CheckCircle2,
    AlertTriangle,
    FileSpreadsheet,
    Upload,
    X,
    Database,
    RefreshCw,
    ShieldCheck,
} from "lucide-react";

import api from "../services/api";
import UploadHistory from "../components/UploadHistory";
import PageHero from "../components/PageHero";

export default function UploadSales({ onViewInvalidRecords }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const [quality, setQuality] = useState(null);
    const [qualityLoading, setQualityLoading] = useState(false);
    const [qualityError, setQualityError] = useState("");

    // --------------------------------------------------
    // FETCH DATA QUALITY
    // --------------------------------------------------

    const fetchDataQuality = async () => {
        try {
            setQualityLoading(true);
            setQualityError("");

            const response = await api.get("/analytics/data-quality");

            console.log("DATA QUALITY RESPONSE:", response.data);

            setQuality(response.data);
        } catch (err) {
            console.error("Data Quality Error:", err);

            setQualityError(
                err.response?.data?.detail ||
                "Unable to load data quality information."
            );
        } finally {
            setQualityLoading(false);
        }
    };

    // --------------------------------------------------
    // LOAD DATA QUALITY WHEN PAGE OPENS
    // --------------------------------------------------

    useEffect(() => {
        fetchDataQuality();
    }, []);

    // --------------------------------------------------
    // FILE SELECT
    // --------------------------------------------------

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];

        setResult(null);
        setError("");

        if (!selectedFile) {
            setFile(null);
            return;
        }

        const allowedExtensions = [".xlsx", ".xls"];
        const fileName = selectedFile.name.toLowerCase();

        const isValid = allowedExtensions.some((extension) =>
            fileName.endsWith(extension)
        );

        if (!isValid) {
            setFile(null);
            setError(
                "Please upload an Excel file (.xlsx or .xls)."
            );
            return;
        }

        setFile(selectedFile);
    };

    // --------------------------------------------------
    // UPLOAD
    // --------------------------------------------------

    const handleUpload = async () => {
        if (!file) {
            setError("Please select an Excel file first.");
            return;
        }

        setUploading(true);
        setError("");
        setResult(null);

        try {
            const formData = new FormData();

            formData.append("file", file);

            const response = await api.post(
                "/upload",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            console.log(
                "UPLOAD RESPONSE:",
                response.data
            );

            setResult(response.data);
            setFile(null);

            // Refresh data quality after successful upload
            await fetchDataQuality();

        } catch (err) {
            console.error("Upload Error:", err);

            setError(
                err.response?.data?.detail ||
                "Upload failed. Please try again."
            );
        } finally {
            setUploading(false);
        }
    };

    // --------------------------------------------------
    // REMOVE FILE
    // --------------------------------------------------

    const handleRemoveFile = () => {
        setFile(null);
        setError("");
        setResult(null);
    };

    // --------------------------------------------------
    // SAFE QUALITY VALUES
    // --------------------------------------------------

    const qualitySummary = quality?.summary || {};

    const qualityPercentage =
        Number(
            result?.quality_percentage ??
            qualitySummary?.quality_percentage ??
            0
        );

    const invalidRows =
        Number(
            result?.invalid_rows ??
            qualitySummary?.invalid_rows ??
            0
        );

    const duplicateRows =
        Number(
            result?.duplicate_rows ??
            qualitySummary?.duplicate_rows ??
            0
        );

    const errorBreakdown =
        quality?.error_breakdown || [];

    // --------------------------------------------------
    // PAGE
    // --------------------------------------------------

    return (
        <div className="p-6 flex-1 space-y-5">
            <PageHero
                title="Sales Upload"
                subtitle="Upload your daily sales Excel file for automated validation, cleaning and database processing."
                icon={Upload}
            />

            <div className="max-w-6xl">

                {/* ==========================================
                    UPLOAD BOX
                ========================================== */}

                <div className="bg-[#0B1730] rounded-2xl border border-[#1E3A8A] p-8 shadow-sm">

                    <label
                        htmlFor="sales-file"
                        className="
                            block
                            border-2
                            border-dashed
                            border-[#1E3A8A]
                            rounded-2xl
                            p-12
                            text-center
                            cursor-pointer
                            hover:border-purple-500
                            hover:bg-purple-900/40
                            transition
                        "
                    >

                        <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-900/30 flex items-center justify-center mb-5">

                            <FileSpreadsheet
                                size={32}
                                className="text-purple-400"
                            />

                        </div>

                        <h2 className="text-xl font-semibold text-white">
                            Upload Daily Sales File
                        </h2>

                        <p className="text-sm text-slate-300 mt-2">
                            Click here to select your Excel sales file
                        </p>

                        <p className="text-xs text-slate-400 mt-3">
                            Supported formats: .xlsx, .xls
                        </p>

                        <input
                            id="sales-file"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                    </label>

                    {/* SELECTED FILE */}

                    {file && (

                        <div className="mt-6 p-4 rounded-xl bg-[#050816] border border-[#1E3A8A] flex items-center justify-between">

                            <div className="flex items-center gap-3">

                                <div className="w-10 h-10 rounded-lg bg-emerald-900/30 flex items-center justify-center">

                                    <FileSpreadsheet
                                        size={20}
                                        className="text-emerald-400"
                                    />

                                </div>

                                <div>

                                    <p className="font-medium text-white">
                                        {file.name}
                                    </p>

                                    <p className="text-xs text-slate-300 mt-1">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="
                                    w-9
                                    h-9
                                    rounded-lg
                                    flex
                                    items-center
                                    justify-center
                                    text-slate-500
                                    hover:text-red-400
                                    hover:bg-red-900/20
                                    transition
                                "
                            >

                                <X size={18} />

                            </button>

                        </div>

                    )}

                    {/* ERROR */}

                    {error && (

                        <div className="mt-6 p-4 rounded-xl bg-red-900/20 border border-red-900/50 flex items-start gap-3">

                            <AlertTriangle
                                size={20}
                                className="text-red-400 mt-0.5"
                            />

                            <div>

                                <p className="font-semibold text-red-400">
                                    Upload Failed
                                </p>

                                <p className="text-sm text-red-300 mt-1">
                                    {error}
                                </p>

                            </div>

                        </div>

                    )}

                    {/* UPLOAD BUTTON */}

                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="
                            w-full
                            mt-6
                            py-3.5
                            rounded-xl
                            bg-purple-600
                            text-white
                            font-semibold
                            flex
                            items-center
                            justify-center
                            gap-2
                            hover:bg-purple-700
                            disabled:bg-slate-700
                            disabled:cursor-not-allowed
                            transition
                        "
                    >

                        {uploading ? (

                            <>
                                <RefreshCw
                                    size={18}
                                    className="animate-spin"
                                />

                                Processing Sales Data...
                            </>

                        ) : (

                            <>
                                <Upload size={18} />

                                Upload Sales Data
                            </>

                        )}

                    </button>

                </div>

                {/* ==========================================
                    UPLOAD RESULT
                ========================================== */}

                {result && (

                    <div className="mt-6 bg-[#0B1730] rounded-2xl border border-emerald-800/50 shadow-sm overflow-hidden">

                        {/* SUCCESS HEADER */}

                        <div className="p-6 border-b border-emerald-800/50 bg-emerald-900/20/50">

                            <div className="flex items-center gap-4">

                                <div className="w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center">

                                    <CheckCircle2
                                        size={26}
                                        className="text-emerald-400"
                                    />

                                </div>

                                <div>

                                    <h2 className="text-xl font-bold text-white">
                                        Upload Successful
                                    </h2>

                                    <p className="text-sm text-slate-300 mt-1">
                                        Sales file has been processed successfully.
                                    </p>

                                </div>

                            </div>

                        </div>

                        {/* METRICS */}

                        <div className="p-6">

                            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">

                                <div className="p-5 rounded-xl bg-blue-900/20">

                                    <p className="text-sm text-slate-300">
                                        Original
                                    </p>

                                    <h3 className="text-2xl font-bold text-white mt-1">
                                        {result.original_rows ?? 0}
                                    </h3>

                                </div>

                                <div className="p-5 rounded-xl bg-emerald-900/20">

                                    <p className="text-sm text-slate-300">
                                        Cleaned
                                    </p>

                                    <h3 className="text-2xl font-bold text-white mt-1">
                                        {result.cleaned_rows ?? 0}
                                    </h3>

                                </div>

                                <div className="p-5 rounded-xl bg-purple-900/20">

                                    <p className="text-sm text-slate-300">
                                        Valid
                                    </p>

                                    <h3 className="text-2xl font-bold text-white mt-1">
                                        {result.final_valid_rows ?? 0}
                                    </h3>

                                </div>

                                <div className="p-5 rounded-xl bg-red-900/20">

                                    <p className="text-sm text-slate-300">
                                        Invalid
                                    </p>

                                    <h3 className="text-2xl font-bold text-white mt-1">
                                        {result.invalid_rows ?? 0}
                                    </h3>

                                </div>

                                <div className="p-5 rounded-xl bg-indigo-900/20">

                                    <p className="text-sm text-slate-300">
                                        Quality
                                    </p>

                                    <h3 className="text-2xl font-bold text-white mt-1">
                                        {result.quality_percentage ?? 0}%
                                    </h3>

                                </div>

                            </div>

                            {/* RECORD SUMMARY */}

                            <div className="mt-6 p-5 rounded-xl bg-[#050816] border border-[#1E3A8A]">

                                <h3 className="font-bold text-white mb-4">
                                    Upload Result
                                </h3>

                                <div className="space-y-3">

                                    <div className="flex justify-between">
                                        <span className="text-slate-300">
                                            Uploaded Records
                                        </span>

                                        <b>
                                            {result.original_rows ?? 0}
                                        </b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-slate-300">
                                            Valid Records
                                        </span>

                                        <b className="text-emerald-400">
                                            {result.final_valid_rows ?? 0}
                                        </b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-slate-300">
                                            Invalid Records
                                        </span>

                                        <b className="text-red-400">
                                            {result.invalid_rows ?? 0}
                                        </b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-slate-300">
                                            File Duplicates
                                        </span>

                                        <b>
                                            {result.duplicate_rows ?? 0}
                                        </b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-slate-300">
                                            DB Duplicates
                                        </span>

                                        <b>
                                           {result.database_duplicates ?? 0}
                                        </b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-slate-300">
                                            Inserted Records
                                        </span>

                                        <b className="text-emerald-400">
                                            {result.inserted_rows ?? 0}
                                        </b>
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                )}

                {/* ==========================================
                    DATA QUALITY
                ========================================== */}

                <div className="mt-6 bg-[#0B1730] rounded-2xl border border-[#1E3A8A] shadow-sm overflow-hidden">

                    <div className="p-6 border-b border-[#1E3A8A]">

                        <div className="flex items-center justify-between">

                            <div className="flex items-center gap-3">

                                <div className="w-10 h-10 rounded-xl bg-emerald-900/30 flex items-center justify-center">

                                    <ShieldCheck
                                        size={22}
                                        className="text-emerald-400"
                                    />

                                </div>

                                <div>

                                    <h2 className="text-xl font-bold text-white">
                                        Data Quality
                                    </h2>

                                    <p className="text-sm text-slate-300">
                                        Current sales data validation status
                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={fetchDataQuality}
                                disabled={qualityLoading}
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    px-3
                                    py-2
                                    rounded-lg
                                    border
                                    border-[#1E3A8A]
                                    text-sm
                                    font-medium
                                    hover:bg-[#050816]
                                    disabled:opacity-50
                                "
                            >

                                <RefreshCw
                                    size={15}
                                    className={
                                        qualityLoading
                                            ? "animate-spin"
                                            : ""
                                    }
                                />

                                Refresh

                            </button>

                        </div>

                    </div>

                    <div className="p-6">

                        {qualityLoading && !quality ? (

                            <div className="py-10 text-center">

                                <RefreshCw
                                    size={28}
                                    className="mx-auto animate-spin text-purple-400"
                                />

                                <p className="text-sm text-slate-300 mt-3">
                                    Loading data quality...
                                </p>

                            </div>

                        ) : qualityError ? (

                            <div className="p-4 rounded-xl bg-red-900/20 border border-red-900/50">

                                <div className="flex items-start gap-3">

                                    <AlertTriangle
                                        size={20}
                                        className="text-red-400"
                                    />

                                    <div>

                                        <p className="font-semibold text-red-400">
                                            Unable to load data quality
                                        </p>

                                        <p className="text-sm text-red-300 mt-1">
                                            {qualityError}
                                        </p>

                                    </div>

                                </div>

                            </div>

                        ) : quality?.has_data ? (

                            <>

                                {/* QUALITY KPI */}

                                <div className="grid md:grid-cols-3 gap-4">

                                    <div className="p-5 rounded-xl bg-emerald-900/20 border border-emerald-800/50">

                                        <p className="text-sm text-slate-300">
                                            Quality Score
                                        </p>

                                        <h3 className="text-3xl font-bold text-white mt-2">
                                            {qualityPercentage}%
                                        </h3>

                                    </div>

                                    <div className="p-5 rounded-xl bg-red-900/20 border border-red-900/50">

                                        <p className="text-sm text-slate-300">
                                            Invalid Records
                                        </p>

                                        <h3 className="text-3xl font-bold text-white mt-2">
                                            {invalidRows}
                                        </h3>

                                    </div>

                                    <div className="p-5 rounded-xl bg-yellow-900/20 border border-yellow-900/50">

                                        <p className="text-sm text-slate-300">
                                            Duplicates
                                        </p>

                                        <h3 className="text-3xl font-bold text-white mt-2">
                                            {duplicateRows}
                                        </h3>

                                    </div>

                                </div>

                                {/* QUALITY BAR */}

                                <div className="mt-7">

                                    <div className="flex justify-between mb-2">

                                        <span className="text-sm font-semibold text-slate-300">
                                            Data Quality Score
                                        </span>

                                        <span className="text-sm font-bold text-emerald-400">
                                            {qualityPercentage}%
                                        </span>

                                    </div>

                                    <div className="w-full bg-[#1E3A8A] rounded-full h-4 overflow-hidden">

                                        <div
                                            className="bg-green-600 h-4 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(
                                                    Math.max(
                                                        qualityPercentage,
                                                        0
                                                    ),
                                                    100
                                                )}%`,
                                            }}
                                        />

                                    </div>

                                </div>

                                {/* VALIDATION ISSUES */}

                                <div className="mt-8">

                                    <div className="flex items-center justify-between mb-4">

                                        <h3 className="font-bold text-white">
                                            Validation Issues
                                        </h3>

                                        {errorBreakdown.length > 0 && (

                                            <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-300 font-semibold">
                                                {errorBreakdown.length} issue types
                                            </span>

                                        )}

                                    </div>

                                    {errorBreakdown.length > 0 ? (

                                        <div className="space-y-2">

                                            {errorBreakdown.map(
                                                (issue, index) => (

                                                    <div
                                                        key={index}
                                                        className="
                                                            flex
                                                            items-center
                                                            justify-between
                                                            p-3
                                                            rounded-lg
                                                            bg-[#050816]
                                                            border
                                                            border-slate-100
                                                        "
                                                    >

                                                        <div className="flex items-center gap-3">

                                                            <AlertTriangle
                                                                size={17}
                                                                className="text-orange-500"
                                                            />

                                                            <span className="text-sm text-slate-300">
                                                                {issue.reason}
                                                            </span>

                                                        </div>

                                                        <span className="font-semibold text-white">
                                                            {issue.count}
                                                        </span>

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    ) : (

                                        <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-800/50 flex items-center gap-3">

                                            <CheckCircle2
                                                size={20}
                                                className="text-emerald-400"
                                            />

                                            <p className="text-sm text-emerald-300">
                                                No validation issues detected.
                                            </p>

                                        </div>

                                    )}

                                </div>

                            </>

                        ) : (

                            <div className="py-10 text-center">

                                <ShieldCheck
                                    size={40}
                                    className="mx-auto text-slate-300"
                                />

                                <h3 className="mt-3 font-semibold text-slate-200">
                                    No Quality Data Available
                                </h3>

                                <p className="text-sm text-slate-300 mt-1">
                                    Upload a sales file to generate data
                                    quality metrics.
                                </p>

                            </div>

                        )}

                    </div>

                </div>

                {/* ==========================================
                    VIEW INVALID RECORDS
                ========================================== */}

                <div className="mt-5 flex justify-end">

                    <button
                        type="button"
                        onClick={onViewInvalidRecords}
                        className="
                            px-5
                            py-2.5
                            bg-red-600
                            hover:bg-red-700
                            text-white
                            rounded-lg
                            font-medium
                            transition
                        "
                    >
                        View Invalid Records
                    </button>

                </div>

                {/* ==========================================
                    DATABASE STATUS
                ========================================== */}

                {result && (

                    <div className="mt-5 p-4 rounded-xl bg-[#0B1730] border border-[#1E3A8A] shadow-sm flex items-center gap-3">

                        <div className="w-10 h-10 rounded-lg bg-emerald-900/30 flex items-center justify-center">

                            <Database
                                size={19}
                                className="text-emerald-400"
                            />

                        </div>

                        <div>

                            <p className="font-semibold text-white">
                                Database Processing Complete
                            </p>

                            <p className="text-sm text-slate-300">
                                {result.inserted_rows ?? 0} valid sales
                                records inserted into PostgreSQL.
                            </p>

                        </div>

                    </div>

                )}

                {/* ==========================================
                    INVALID WARNING
                ========================================== */}

                {result &&
                    (result.invalid_rows ?? 0) > 0 && (

                        <div className="mt-5 p-4 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-3">

                            <AlertTriangle
                                size={20}
                                className="text-orange-600 mt-0.5"
                            />

                            <div>

                                <p className="font-semibold text-orange-800">
                                    {result.invalid_rows} rows require attention
                                </p>

                                <p className="text-sm text-orange-700 mt-1">
                                    These records were rejected during
                                    validation and were not inserted into
                                    the sales table.
                                </p>

                            </div>

                        </div>

                    )}

                {/* ==========================================
                    UPLOAD HISTORY
                ========================================== */}

                <div className="mt-6">

                    <UploadHistory />

                </div>

            </div>

        </div>
    );
}
