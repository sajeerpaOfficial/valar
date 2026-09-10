"use client";

import { useEffect, useRef, useState } from "react";

const LINKS = ["Residences", "Philosophy", "Journal", "Enquire"];

/**
 * The logo and the rule flip from ink to paper the moment a dark panel
 * passes under the header — in the reference that swap takes ~0.3s.
 */
export default function Header() {
  const [onDark, setOnDark] = useState(false);
  const [glass, setGlass] = useState(false);
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const marks = Array.from(
      document.querySelectorAll<HTMLElement>(".tone-mark")
    );
    const hero = document.querySelector<HTMLElement>(".hero");

    const read = () => {
      // header text sits roughly 38px down at the reference viewport height
      const threshold = window.innerHeight * 0.043 + 6;
      // the last marker the header has passed wins
      let tone = "ink";
      for (const mark of marks) {
        if (mark.getBoundingClientRect().top <= threshold) {
          tone = mark.dataset.tone ?? "ink";
        }
      }
      setOnDark(tone === "paper");

      // The glass is only worth having once there is something behind it to
      // frost, so it waits for the hero to clear the bar rather than for the
      // page to start moving — measured against the bar's own height so the
      // veil arrives as the section below meets its lower edge, not a screen
      // later. Over the hero photograph the header stays clear.
      const bar = barRef.current;
      if (hero && bar) {
        setGlass(hero.getBoundingClientRect().bottom <= bar.offsetHeight);
      }
    };

    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* the menu is a solid panel of its own — a frosted strip across the top
          of it would read as a seam rather than as glass, so the veil drops
          while it is open */}
      <header
        className="header"
        ref={barRef}
        data-theme={onDark || open ? "light" : "dark"}
        data-glass={glass && !open ? "true" : "false"}
      >
        <a className="logo" href="#top">
          Velar<b>.</b>
        </a>
        <button
          className="burger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </header>

      <nav className="menu" data-open={open} aria-hidden={!open}>
        <ul className="menu__list">
          {LINKS.map((link) => (
            <li key={link}>
              <a href="#top" onClick={() => setOpen(false)}>
                {link}
              </a>
            </li>
          ))}
        </ul>
        <div className="menu__foot">
          <span>Est. 1974</span>
          <span>12 Global Locations</span>
          <span>hello@velar.estate</span>
        </div>
      </nav>
    </>
  );
}
