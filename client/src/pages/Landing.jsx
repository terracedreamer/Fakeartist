import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Paintbrush,
  Users,
  Sparkles,
  Palette,
  Eye,
  Trophy,
  ArrowRight,
  Pencil,
} from 'lucide-react';
import AnimatedButton from '../components/AnimatedButton';
import GlassCard from '../components/GlassCard';

const steps = [
  {
    icon: Users,
    title: 'Join a Room',
    desc: 'Create or join with a 6-character code or scan a QR code.',
  },
  {
    icon: Pencil,
    title: 'Everyone Draws',
    desc: 'Take turns drawing one stroke at a time on the shared canvas.',
  },
  {
    icon: Eye,
    title: 'Spot the Fake',
    desc: "One player doesn't know the word — figure out who's faking it.",
  },
  {
    icon: Trophy,
    title: 'Vote & Win',
    desc: 'Vote together. If caught, the Fake Artist gets one last chance to guess the word.',
  },
];

const features = [
  {
    icon: Paintbrush,
    title: 'Real-time Drawing',
    desc: 'Draw on your phone, see it on the big screen instantly via Socket.io.',
  },
  {
    icon: Sparkles,
    title: 'AI Word Generation',
    desc: 'Fresh words and categories every round — no two games are the same.',
  },
  {
    icon: Palette,
    title: '4 Visual Themes',
    desc: 'Dark & Artsy, Bright & Playful, Clean & Minimal, or Retro Sketchbook.',
  },
  {
    icon: Users,
    title: '3–16 Players',
    desc: 'Perfect for parties, classrooms, or game nights with friends.',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Fake Artist — The Drawing Bluffing Game</title>
        <meta
          name="description"
          content="A real-time multiplayer drawing game where one player doesn't know the secret word. Can you spot the Fake Artist?"
        />
      </Helmet>

      <div className="min-h-screen">
        {/* ===== Hero ===== */}
        <section className="landing-hero aurora-bg min-h-screen flex flex-col items-center justify-center px-4 text-center relative">
          <div className="relative z-10 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center gap-3 mb-4"
            >
              <Paintbrush className="w-12 h-12 md:w-16 md:h-16 text-canvas-accent" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="gradient-text text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6"
            >
              Fake Artist
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl md:text-2xl text-canvas-text/60 mb-10 max-w-xl mx-auto leading-relaxed"
            >
              One player doesn't know the word.
              <br />
              Can you spot the Fake Artist?
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
            >
              <AnimatedButton
                onClick={() => navigate('/play')}
                className="text-lg px-10 py-4"
              >
                Play Now
                <ArrowRight className="w-5 h-5 inline-block ml-2" />
              </AnimatedButton>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 text-canvas-text/30 text-sm"
            >
              3–16 players &middot; No download required &middot; Free
            </motion.p>
          </div>
        </section>

        {/* ===== How to Play ===== */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-center mb-14"
            >
              How to Play
            </motion.h2>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {steps.map((step, i) => (
                <motion.div key={step.title} variants={itemVariants}>
                  <GlassCard className="text-center h-full" hover>
                    <div className="w-14 h-14 rounded-2xl bg-canvas-accent/10 flex items-center justify-center mx-auto mb-4">
                      <step.icon className="w-7 h-7 text-canvas-accent" />
                    </div>
                    <div className="text-xs font-bold text-canvas-accent/60 mb-1">
                      Step {i + 1}
                    </div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-canvas-text/50 text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ===== Features ===== */}
        <section className="py-20 px-4 bg-canvas-card/50">
          <div className="max-w-5xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-center mb-14"
            >
              Features
            </motion.h2>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {features.map((f) => (
                <motion.div key={f.title} variants={itemVariants}>
                  <GlassCard className="flex items-start gap-4" hover>
                    <div className="w-12 h-12 rounded-xl bg-canvas-accent/10 flex items-center justify-center shrink-0">
                      <f.icon className="w-6 h-6 text-canvas-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">{f.title}</h3>
                      <p className="text-canvas-text/50 text-sm leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ===== Footer CTA ===== */}
        <section className="py-24 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Play?
            </h2>
            <p className="text-canvas-text/50 mb-8 text-lg">
              Grab your friends and start a game in seconds.
            </p>
            <AnimatedButton
              onClick={() => navigate('/play')}
              className="text-lg px-10 py-4"
            >
              Start a Game
              <ArrowRight className="w-5 h-5 inline-block ml-2" />
            </AnimatedButton>
          </motion.div>
        </section>
      </div>
    </>
  );
}
