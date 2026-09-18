"use client";

import { useEffect, useId, useRef, useState } from "react";

/* ==========================================================================
   Styled select replacement. Native <select> renders an OS menu we cannot
   theme, so filters use this instead: a trigger plus a themed popover list.
   Keyboard: Enter/Space opens, arrows move, Enter selects, Escape closes.
   ========================================================================== */

export interface FieldOption {
  value: string;
  label: string;
}

export default function FieldMenu({
  value,
  options,
  placeholder,
  onChange,
  ariaLabel,
  variant = "light",
  align = "left",
}: {
  value: string;
  options: FieldOption[];
  placeholder: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  /** "dark" inverts the trigger for use over photography */
  variant?: "light" | "dark";
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const listId = useId();

  const selected = options.find((option) => option.value === value);
  const label = selected ? selected.label : placeholder;

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const index = Math.max(0, options.findIndex((option) => option.value === value));
    setActiveIndex(index);
    listRef.current?.focus();
  }, [open, options, value]);

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const onListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => {
        const delta = event.key === "ArrowDown" ? 1 : -1;
        return (current + delta + options.length) % options.length;
      });
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(options[activeIndex].value);
    }
  };

  return (
    <div className={`fieldmenu fieldmenu--${variant}`} ref={wrapRef}>
      <button
        type="button"
        className={`fieldmenu__trigger${open ? " is-open" : ""}${selected ? " has-value" : ""}`}
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
      >
        <span>{label}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul
          className={`fieldmenu__list fieldmenu__list--${align}`}
          id={listId}
          role="listbox"
          tabIndex={-1}
          ref={listRef}
          aria-label={ariaLabel}
          onKeyDown={onListKeyDown}
        >
          {options.map((option, index) => (
            <li key={option.value || "any"}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`${option.value === value ? "is-selected" : ""}${index === activeIndex ? " is-active" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option.value)}
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
