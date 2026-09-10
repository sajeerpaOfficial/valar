"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { viewportUnit } from "../lib/viewport";

/**
 * Three things move at three different rates in the hero.
 *
 *  · the sky scrolls away with the page, like any other section
 *  · the headline scrolls away with it
 *  · the building is welded to the viewport, so against the rising sky it is
 *    already drifting downward — and then, halfway through the hero, it starts
 *    sliding down the screen as well
 *
 * It is painted above the statement panel and below the gallery, so it crosses
 * over the second section on its way down and is swallowed by the third.
 *
 * Timing read off the reel — the sky's lower edge gives the scroll position,
 * the lamp head gives the travel:
 *
 *      hero progress   0.53   0.61   0.70   0.82
 *      travel (vh)      9.2   24.2   41.2   50.9
 *
 * which is a hold to just under halfway, then a quick ramp to 48vh — the point
 * where the roofline is crossing the figures on the panel below.
 *
 * From there it stops easing out and runs: a linear term picks up the speed the
 * ramp was carrying, and a squared term keeps building on it, so by the time it
 * leaves it is travelling at nearly twice the scroll rate. It clears a full
 * viewport height well before the gallery arrives, so the building sees itself
 * out rather than parking at the bottom edge waiting to be covered.
 *
 * Both numbers are read against the hero's own height rather than against
 * `innerHeight`, and the travel is written out in px rather than vh. On a
 * desktop those are three names for the same measurement. On a phone they are
 * not: `innerHeight` shrinks and grows as the address bar slides away, while
 * the CSS vh it was being multiplied back out by does not — so the progress
 * would step by ~9% with the scroll position unchanged and throw the building
 * up to 165px down the screen in a single frame. The hero is one viewport of
 * `svh`, which is the height the timeline is actually cut against and which
 * holds still while the bar moves, so the one measurement is used for both
 * halves of the sum and the step has nothing to act on. See `lib/viewport`.
 */
const SLIDE_FROM = 0.47;
const SLIDE_OVER = 0.38;
const SLIDE_VH = 48;
const EASE = 1.6; // 1 − (1 − t)^EASE: quick off the mark, settling at the end

const EXIT_FROM = 0.82; // where the run for the door starts
const EXIT_SPEED = 44; // vh per unit of progress, carried over from the ramp
const EXIT_ACCEL = 190; // …and how hard it keeps building
const EXIT_VH = 112; // a full viewport clear of the top, so nothing is left

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default function HeroMedia() {
  const buildingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = buildingRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last = -1;

    const draw = () => {
      // one viewport of `svh` — the height the hero is cut to, and the one a
      // sliding address bar leaves alone
      const unit = viewportUnit();
      const p = window.scrollY / unit;
      const t = clamp01((p - SLIDE_FROM) / SLIDE_OVER);
      const d = Math.max(0, p - EXIT_FROM);
      const travel =
        (Math.min(
          (1 - Math.pow(1 - t, EASE)) * SLIDE_VH +
            EXIT_SPEED * d +
            EXIT_ACCEL * d * d,
          EXIT_VH
        ) *
          unit) /
        100;

      // the building is `fixed`, so the compositor holds it to the viewport on
      // its own and only this offset is ours to keep up with — writing it only
      // when it actually moves keeps the still frames free of style work
      if (travel !== last) {
        last = travel;
        el.style.transform = `translate3d(0, ${travel.toFixed(2)}px, 0)`;
      }

      // read at frame time rather than on scroll events: a phone coalesces
      // those and delivers them behind the compositor, so a listener lands the
      // transform a frame or more late against a page that has already moved —
      // which is the judder. Same loop the gallery runs, for the same reason.
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* scrolls away with the page */}
      <div className="hero__sky">
        <Image src="/img/hero-sky.jpg" alt="" fill priority sizes="100vw" />
      </div>

      {/* held to the viewport, then slid down over the section below */}
      <div className="hero__building" ref={buildingRef} aria-hidden>
        <Image
          src="/img/hero-building.webp"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
    </>
  );
}
