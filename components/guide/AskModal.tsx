"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ContactForm from "@/components/leads/ContactForm";
import RevealNow from "./RevealNow";

/* ==========================================================================
   The "Ask Alexa" enquiry as an overlay: a centered sheet on desktop, a
   bottom sheet on phones. It opens over the guide instead of stretching the
   panel, so the map layout never changes height. Escape, the backdrop or
   the close button dismiss it; focus returns to the button that opened it.
   ========================================================================== */

export default function AskModal({
  open,
  onClose,
  title,
  agentPhoto,
  consent,
  message,
  formKey,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  agentPhoto?: string;
  consent: string;
  message: string;
  /** Remounts the form when the neighborhood changes, so the message updates */
  formKey: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => setMounted(true), []);

  // Two-step open/close so the enter and exit both animate.
  useEffect(() => {
    if (open) {
      opener.current = document.activeElement;
      const raf = requestAnimationFrame(() => setVisible(true));
      const prev = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      const t = window.setTimeout(() => sheetRef.current?.querySelector<HTMLElement>("input")?.focus({ preventScroll: true }), 380);
      return () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(t);
        document.documentElement.style.overflow = prev;
      };
    }
    setVisible(false);
    (opener.current as HTMLElement | null)?.focus?.({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className={`ag-modal${visible ? " is-open" : ""}`} aria-hidden={!open} inert={!open}>
      <div className="ag-modal__backdrop" onClick={onClose} />
      <div className="ag-modal__sheet" role="dialog" aria-modal="true" aria-label={title} ref={sheetRef}>
        <button type="button" className="ag-modal__close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <div className="ag-modal__head">
          {agentPhoto && (
            <span className="ag-modal__avatar">
              <Image src={agentPhoto} alt="" fill sizes="56px" />
            </span>
          )}
          <div>
            <span className="ag-modal__kicker">Usually replies the same day</span>
            <h3 className="ag-modal__title">{title}</h3>
          </div>
        </div>
        <RevealNow className="ag-modal__form">
          <ContactForm key={formKey} consent={consent} message={message} />
        </RevealNow>
      </div>
    </div>,
    document.body,
  );
}
