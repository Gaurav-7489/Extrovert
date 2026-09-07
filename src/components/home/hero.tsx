"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Users, Lock, Heart } from "lucide-react";
import { SwipeDeck } from "./swipe-deck";
import { routes } from "@/config/routes";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] w-full overflow-hidden bg-[#fffdfb] px-5 pb-16 pt-28 font-sans sm:px-8 sm:pt-32">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <motion.div animate={{scale:[1,1.06,1],opacity:[.18,.28,.18]}} transition={{duration:9,repeat:Infinity,ease:"easeInOut"}} className="absolute -top-40 left-1/2 h-[620px] w-[760px] -translate-x-1/2 rounded-full bg-[#e9c7ce] blur-[150px]" />
        <div className="absolute left-[-220px] top-1/2 h-[420px] w-[420px] rounded-full bg-[#f7e8e4] blur-[120px]" />
        <div className="absolute bottom-[-240px] right-[-180px] h-[480px] w-[480px] rounded-full bg-[#f1d9de] blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.65,ease:[.16,1,.3,1]}} className="flex flex-col items-start gap-6 lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e5cbd0] bg-[#faf0f2] px-4 py-2 text-xs font-extrabold text-[#761f30] shadow-sm">
            <Heart className="h-3.5 w-3.5 fill-current" />
            Dating, made more human.
          </div>

          <h1 className="text-5xl font-black leading-[.98] tracking-[-.055em] text-zinc-950 sm:text-7xl lg:text-[5.5rem]">
            Meet people.
            <br />
            <span className="text-[#761f30]">Feel something.</span>
          </h1>

          <p className="max-w-xl text-base font-medium leading-7 text-zinc-600 sm:text-lg">
            Discover people you actually want to know, make the first move, and turn a good profile into a real conversation.
          </p>

          <div className="flex w-full flex-wrap items-center gap-3 pt-1 sm:w-auto">
            <Link href={routes.register} className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#761f30] px-7 py-4 text-sm font-black text-white shadow-[0_10px_30px_rgba(118,31,48,.24)] transition hover:-translate-y-0.5 hover:bg-[#5b1423] active:scale-95">
              Start discovering <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href={`${routes.register}?mode=basic`} className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-4 text-sm font-bold text-zinc-800 shadow-sm transition hover:border-[#d7b9bf] hover:bg-[#fffdfb] active:scale-95">
              Create your profile
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 text-xs font-semibold text-zinc-500">
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-[#761f30]" /> Real people</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#761f30]" /> Identity verification</span>
            <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-[#761f30]" /> Private by design</span>
          </div>
        </motion.div>

        <motion.div initial={{opacity:0,scale:.95,y:10}} animate={{opacity:1,scale:1,y:0}} transition={{duration:.75,delay:.1,ease:[.16,1,.3,1]}} className="flex items-center justify-center py-2 lg:col-span-5">
          <SwipeDeck />
        </motion.div>
      </div>
    </section>
  );
}
