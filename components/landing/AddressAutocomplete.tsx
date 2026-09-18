"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = { placeId: string; text: string };

/**
 * Street-address input with Google Places suggestions, fetched through
 * /api/address-autocomplete so no key ships to the browser. If the endpoint
 * has no key configured it silently behaves as a plain text input.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onResolved,
  className,
  placeholder,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Called with parsed components after the user picks a suggestion. */
  onResolved: (parts: { address: string; city: string; zip: string }) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef<string>("");
  // Set after a suggestion is picked so the resulting onChange doesn't refetch.
  const skipFetchRef = useRef(false);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function fetchSuggestions(input: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      if (!sessionRef.current && typeof crypto !== "undefined") {
        sessionRef.current = crypto.randomUUID();
      }
      try {
        const res = await fetch(
          `/api/address-autocomplete?input=${encodeURIComponent(input)}&sessionToken=${sessionRef.current}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setOpen((data.suggestions ?? []).length > 0);
        setActive(-1);
      } catch {
        /* aborted or network error: keep the field usable as plain input */
      }
    }, 250);
  }

  function handleChange(next: string) {
    onChange(next);
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }
    if (next.trim().length >= 3) {
      fetchSuggestions(next.trim());
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  }

  async function pick(s: Suggestion) {
    skipFetchRef.current = true;
    onChange(s.text);
    setOpen(false);
    setSuggestions([]);
    const token = sessionRef.current;
    sessionRef.current = ""; // details call closes the billing session
    try {
      const res = await fetch(
        `/api/address-autocomplete?placeId=${encodeURIComponent(s.placeId)}&sessionToken=${token}`,
      );
      const parts = await res.json();
      if (parts.address || parts.city || parts.zip) {
        onResolved({
          address: parts.address || s.text,
          city: parts.city || "",
          zip: parts.zip || "",
        });
      }
    } catch {
      /* keep the full suggestion text the user already sees */
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="lp-auto">
      <input
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {open && (
        <ul role="listbox" className="lp-auto__menu">
          {suggestions.map((s, i) => (
            <li key={s.placeId} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                onMouseEnter={() => setActive(i)}
                className="lp-auto__item"
                aria-selected={i === active}
              >
                {s.text}
              </button>
            </li>
          ))}
          <li className="lp-auto__credit">Powered by Google</li>
        </ul>
      )}
    </div>
  );
}
