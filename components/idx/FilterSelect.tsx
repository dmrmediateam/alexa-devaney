"use client";

import { useEffect, useId, useRef, useState } from "react";

/* ==========================================================================
   Branded dropdown for the search filters.

   A native <select> hands its menu to the OS, so it never matches the site
   and looks different on every platform. This is the ARIA listbox pattern
   instead: same keyboard behaviour (Up/Down, Home/End, type-ahead, Enter,
   Escape), same visual language as the location autocomplete.
   ========================================================================== */

export interface FilterOption {
  value: string;
  label: string;
}

export default function FilterSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
  width,
}: {
  /** Accessible name, e.g. "Minimum price" */
  label: string;
  value: string;
  options: FilterOption[];
  /** Shown when nothing is selected, e.g. "Min Price" */
  placeholder: string;
  onChange: (value: string) => void;
  width?: number;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const typed = useRef<{ text: string; at: number }>({ text: "", at: 0 });

  const all: FilterOption[] = [{ value: "", label: placeholder }, ...options];
  const selectedIndex = all.findIndex((o) => o.value === value);
  const current = selectedIndex >= 0 ? all[selectedIndex] : all[0];

  useEffect(() => {
    if (!open) return;
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
    // selectedIndex is stable for one open cycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the highlighted row in view when arrowing through a long list
  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelectorAll<HTMLElement>("[role='option']")[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function choose(index: number) {
    const option = all[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => {
        const next = e.key === "ArrowDown" ? i + 1 : i - 1;
        if (next < 0) return all.length - 1;
        if (next >= all.length) return 0;
        return next;
      });
      return;
    }
    if (e.key === "Home") { e.preventDefault(); setActive(0); return; }
    if (e.key === "End") { e.preventDefault(); setActive(all.length - 1); return; }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(active); return; }
    if (e.key === "Escape" || e.key === "Tab") { setOpen(false); return; }

    // type-ahead, same as a native select
    if (e.key.length === 1) {
      const now = Date.now();
      typed.current = { text: now - typed.current.at > 900 ? e.key : typed.current.text + e.key, at: now };
      const match = all.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.text.toLowerCase()));
      if (match >= 0) setActive(match);
    }
  }

  return (
    <div className="fsel" ref={wrapRef} style={width ? { width } : undefined}>
      <button
        type="button"
        className={`fsel__button${value ? " has-value" : ""}${open ? " is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label`}
        id={`${id}-button`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
      >
        <span className="visually-hidden" id={`${id}-label`}>{label}</span>
        <span className="fsel__value">{current?.label}</span>
        <span className="fsel__chevron" aria-hidden="true" />
      </button>

      {open && (
        <ul
          className="fsel__menu"
          role="listbox"
          aria-labelledby={`${id}-label`}
          tabIndex={-1}
          ref={listRef}
        >
          {all.map((option, i) => (
            <li key={option.value || "any"} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`fsel__option${i === active ? " is-active" : ""}${option.value === value ? " is-selected" : ""}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
