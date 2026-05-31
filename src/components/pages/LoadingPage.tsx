import { motion } from "framer-motion";
import {
	StatusIconRing,
	StatusPageLayout,
} from "@/components/pages/StatusPageLayout";

function LayerStackIcon() {
	return (
		<div className="relative h-12 w-14">
			{[0, 1, 2].map((i) => (
				<motion.div
					key={i}
					className="absolute left-1/2 h-8 w-10 -translate-x-1/2 rounded border border-zinc-600/80 bg-zinc-700/90"
					style={{
						top: i * 6,
						zIndex: 3 - i,
					}}
					animate={{
						opacity: [0.45, 1, 0.45],
						y: [0, -3, 0],
						scale: [0.98, 1, 0.98],
					}}
					transition={{
						duration: 1.4,
						repeat: Infinity,
						ease: "easeInOut",
						delay: i * 0.18,
					}}
				/>
			))}
			<motion.div
				className="absolute -right-1 bottom-0 h-2 w-8 rounded-full bg-blue-500/80"
				animate={{ scaleX: [0.3, 1, 0.3], opacity: [0.5, 1, 0.5] }}
				transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
				style={{ originX: 0 }}
			/>
		</div>
	);
}

export function LoadingPage({
	message = "Loading editor…",
}: {
	message?: string;
}) {
	return (
		<StatusPageLayout
			badge={
				<StatusIconRing>
					<LayerStackIcon />
				</StatusIconRing>
			}
			title="Just a moment"
			description={message}
		>
			<div className="mx-auto w-full max-w-xs space-y-3">
				<div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
					<motion.div
						className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500"
						initial={{ x: "-100%", width: "40%" }}
						animate={{ x: ["-100%", "250%"] }}
						transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
					/>
				</div>
				<motion.div
					className="flex justify-center gap-1"
					initial="initial"
					animate="animate"
				>
					{[0, 1, 2].map((i) => (
						<motion.span
							key={i}
							className="h-1.5 w-1.5 rounded-full bg-blue-400"
							animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1.15, 0.85] }}
							transition={{
								duration: 0.9,
								repeat: Infinity,
								delay: i * 0.15,
								ease: "easeInOut",
							}}
						/>
					))}
				</motion.div>
			</div>
		</StatusPageLayout>
	);
}
