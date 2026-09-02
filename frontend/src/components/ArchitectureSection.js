import React from 'react';
import { motion } from 'framer-motion';
import { Server, Cpu, Database, Zap, Eye, GitBranch } from 'lucide-react';

const ArchitectureSection = () => {
	const nodes = [
		{ id: 1, title: 'Frontend', subtitle: 'React UI', icon: Server, position: 'top-0 left-0' },
		{ id: 2, title: 'Backend', subtitle: 'FastAPI', icon: Cpu, position: 'top-0 right-0' },
		{ id: 3, title: 'Agent', subtitle: 'Strands', icon: GitBranch, position: 'top-1/3 left-1/2 -translate-x-1/2' },
		{ id: 4, title: 'Bedrock', subtitle: 'AWS LLM', icon: Zap, position: 'top-2/3 left-1/4' },
		{ id: 5, title: 'RAG', subtitle: 'Vector DB', icon: Database, position: 'top-2/3 right-1/4' },
		{ id: 6, title: 'MediaPipe', subtitle: 'Vision AI', icon: Eye, position: 'bottom-0 left-1/2 -translate-x-1/2' }
	];

	return (
		<section id="architecture" className="py-24 px-6 bg-white" data-testid="architecture-section">
			<div className="max-w-7xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 50 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-center mb-16"
				>
					<h2 className="text-5xl md:text-7xl font-bold uppercase mb-6" style={{ fontFamily: 'Bebas Neue' }}>
						System <span className="gradient-text">Architecture</span>
					</h2>
					<p className="text-xl text-gray-600 max-w-3xl mx-auto">
						Built on enterprise-grade infrastructure for reliability and scale
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					whileInView={{ opacity: 1, scale: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 0.8 }}
					className="max-w-5xl mx-auto"
				>
					{/* Architecture Diagram */}
					<div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-12 border border-gray-200 shadow-xl relative h-[600px]">
						{/* Connection Lines - Decorative */}
						<svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
							<defs>
								<linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
									<stop offset="0%" style={{ stopColor: '#7353F6', stopOpacity: 0.3 }} />
									<stop offset="100%" style={{ stopColor: '#00C0FF', stopOpacity: 0.3 }} />
								</linearGradient>
							</defs>
							<line x1="20%" y1="15%" x2="50%" y2="40%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5" />
							<line x1="80%" y1="15%" x2="50%" y2="40%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5" />
							<line x1="50%" y1="40%" x2="30%" y2="70%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5" />
							<line x1="50%" y1="40%" x2="70%" y2="70%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5" />
							<line x1="30%" y1="70%" x2="50%" y2="90%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5" />
							<line x1="70%" y1="70%" x2="50%" y2="90%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5" />
						</svg>

						{/* Nodes */}
						<div className="relative h-full">
							{nodes.map((node, index) => {
								const Icon = node.icon;
								return (
									<motion.div
										key={node.id}
										initial={{ opacity: 0, scale: 0 }}
										whileInView={{ opacity: 1, scale: 1 }}
										viewport={{ once: true }}
										transition={{ duration: 0.5, delay: index * 0.1 }}
										whileHover={{ scale: 1.1 }}
										className={`absolute ${node.position} z-10`}
										data-testid={`arch-node-${index}`}
									>
										<div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200 hover:border-purple-400 transition-all w-40 text-center">
											<div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
												<Icon className="w-6 h-6 text-white" />
											</div>
											<h4 className="font-bold text-gray-900 mb-1" style={{ fontFamily: 'Bebas Neue' }}>
												{node.title}
											</h4>
											<p className="text-xs text-gray-600">{node.subtitle}</p>
										</div>
									</motion.div>
								);
							})}
						</div>
					</div>

					{/* Tech Stack Pills */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.8 }}
						className="flex flex-wrap justify-center gap-4 mt-12"
					>
						{['React', 'FastAPI', 'AWS Bedrock', 'Strands', 'RAG', 'MediaPipe', 'WebRTC'].map((tech, idx) => (
							<div
								key={idx}
								className="px-6 py-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full text-gray-900 font-bold text-sm border border-purple-200"
							>
								{tech}
							</div>
						))}
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
};

export default ArchitectureSection;
