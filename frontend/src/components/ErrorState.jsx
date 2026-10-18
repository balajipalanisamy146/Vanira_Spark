export default function ErrorState({
    message = "Unable to load data.",
    onRetry,
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[180px] rounded-2xl border border-red-200 bg-red-50 p-6 text-center">

            <div className="text-3xl mb-3">
                ⚠️
            </div>

            <h3 className="text-lg font-semibold text-gray-800">
                Something went wrong
            </h3>

            <p className="text-sm text-gray-500 mt-1 mb-4">
                {message}
            </p>

            <button
                onClick={onRetry}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition"
            >
                Try Again
            </button>

        </div>
    );
}