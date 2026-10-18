export default function LoadingSkeleton({ className = "" }) {

    return (
        <div
            className={`
                animate-pulse
                bg-[#0B1730]
                border border-blue-900
                rounded-2xl
                ${className}
            `}
        >
            <div className="h-full w-full bg-blue-950/40 rounded-2xl"></div>
        </div>
    );

}