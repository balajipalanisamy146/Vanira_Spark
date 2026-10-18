import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function PageHero({
    title,
    subtitle,
    icon: Icon = Sparkles,
    action,
}) {
    return (
        <section className="relative isolate min-h-[132px] overflow-hidden rounded-2xl border border-blue-900/60 shadow-xl">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/hero-illustration.jpg')" }}
                aria-hidden="true"
            />
            <div className="absolute inset-0 bg-[#020617]/60" aria-hidden="true" />

            <div className="relative flex min-h-[132px] flex-col justify-center gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-7">
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex min-w-0 items-center gap-3"
                >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-slate-950/40 backdrop-blur-sm">
                        <Icon size={22} className="text-cyan-200" />
                    </div>
                    <div className="min-w-0">
                        <p className="mb-1 text-[10px] font-semibold uppercase text-cyan-100/80">
                            Vanira Spark
                        </p>
                        <h1 className="text-2xl font-extrabold leading-tight text-white md:text-3xl">
                            {title}
                        </h1>
                        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/75 sm:text-sm">
                            {subtitle}
                        </p>
                    </div>
                </motion.div>

                {action && <div className="shrink-0 sm:ml-4">{action}</div>}
            </div>
        </section>
    );
}