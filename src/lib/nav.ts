import type { Mode } from "./api";

/** Lightweight cross-component bus to switch the active workspace mode
 *  without prop-drilling. Used by ProfileMenu, header buttons, etc. */
export function gotoMode(mode: Mode) {
  window.dispatchEvent(new CustomEvent<Mode>("mynderek:mode", { detail: mode }));
}

export function onModeChange(handler: (mode: Mode) => void) {
  const h = (e: Event) => handler((e as CustomEvent<Mode>).detail);
  window.addEventListener("mynderek:mode", h);
  return () => window.removeEventListener("mynderek:mode", h);
}
