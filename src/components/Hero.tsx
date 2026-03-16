import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Shield, Clock, Globe } from 'lucide-react';

interface HeroProps {
  user: any;
  onStartClick: () => void;
}

export default function Hero({ user, onStartClick }: HeroProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  };

  return (
    <section className="relative min-h-[90vh] flex items-center px-4 sm:px-6 pt-20 pb-24">
      {/* Animated background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(0deg, transparent 24%, rgba(14, 165, 233, 0.05) 25%, rgba(14, 165, 233, 0.05) 26%, transparent 27%, transparent 74%, rgba(14, 165, 233, 0.05) 75%, rgba(14, 165, 233, 0.05) 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, rgba(99, 102, 241, 0.05) 25%, rgba(99, 102, 241, 0.05) 26%, transparent 27%, transparent 74%, rgba(99, 102, 241, 0.05) 75%, rgba(99, 102, 241, 0.05) 76%, transparent 77%, transparent)
            `,
            backgroundSize: '50px 50px',
          }}
          animate={{
            backgroundPosition: ['0 0', '50px 50px'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Floating glowing orbs */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          y: [0, 30, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-32 right-20 w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{
          y: [0, -40, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="max-w-6xl mx-auto w-full relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-[1.2fr,0.8fr] gap-12 items-center"
        >
          {/* Left Content */}
          <div>
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 border border-cyan-500/20 w-fit"
            >
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 animate-pulse" />
              <span className="text-sm font-semibold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                AI Operating System
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
            >
              LifePilot AI
              <br />
              <span className="gradient-text">Your Autonomous OS</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg text-slate-300 max-w-2xl leading-relaxed mb-8"
            >
              An intelligent assistant that manages your emails, schedules meetings, analyzes
              information, and helps you make smarter decisions. Three specialist agents working
              together as one seamless system.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStartClick}
                className="px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-600 via-cyan-600 to-emerald-500 hover:shadow-[0_0_30px_rgba(14,165,233,0.4)] transition-all flex items-center justify-center gap-2 group"
              >
                <Sparkles className="w-5 h-5" />
                {user ? 'Open Console' : 'Sign In Now'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.a
                href="#how-it-works"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl font-semibold text-white border border-slate-700 hover:border-cyan-500/50 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                See Intelligence Map
                <ArrowRight className="w-4 h-4" />
              </motion.a>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-3"
            >
              {['Email Management', 'Smart Scheduling', 'Decision Support', 'Health Insights'].map(
                (tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold glass border border-slate-700/50 text-slate-300"
                  >
                    {tag}
                  </span>
                )
              )}
            </motion.div>
          </div>

          {/* Right - Visual Summary */}
          <motion.div
            variants={itemVariants}
            className="relative"
          >
            {/* Card with glassmorphism */}
            <div className="rounded-2xl glass border border-cyan-500/10 p-8 overflow-hidden group hover:border-cyan-500/30 transition-all">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-sky-600/5 via-transparent to-cyan-600/5"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">Live Status</p>
                    <p className="text-2xl font-bold text-white mt-1">System Active</p>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-cyan-400"
                  />
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    { agent: 'Email Agent', status: 'Processing inbox', color: 'from-cyan-500' },
                    { agent: 'Calendar Agent', status: 'Optimizing schedule', color: 'from-sky-500' },
                    { agent: 'Decision Agent', status: 'Analyzing options', color: 'from-indigo-500' },
                  ].map((item) => (
                    <div key={item.agent} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.color}`} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{item.agent}</p>
                        <p className="text-xs text-slate-400">{item.status}</p>
                      </div>
                      <motion.div
                        animate={{ opacity: [0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-xs text-slate-500"
                      >
                        ●
                      </motion.div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-700/50 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Response Time</span>
                    <span className="text-cyan-400 font-semibold">~1.2s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Agents Online</span>
                    <span className="text-green-400 font-semibold">3/3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Uptime</span>
                    <span className="text-accent-cyan font-semibold">99.9%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Stats Footer */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16"
        >
          {[
            { icon: Zap, label: 'Instant Responses', value: 'Sub-2s latency' },
            { icon: Shield, label: 'Privacy First', value: 'End-to-end encrypted' },
            { icon: Clock, label: '24/7 Active', value: 'Always learning' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                whileHover={{ y: -4 }}
                className="rounded-xl glass border border-slate-700/50 p-4 text-center group hover:border-cyan-500/30 transition-all"
              >
                <Icon className="w-6 h-6 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-semibold text-white">{stat.label}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.value}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
