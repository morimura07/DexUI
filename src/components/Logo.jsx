import logoUrl from '../assets/Logo.png';
import { cn } from '../lib/utils';

/**
 * The SwiftSwap logo mark. The source art is a white monochrome glyph, so it
 * reads on the dark theme as-is; on the light theme we flip it to solid dark
 * (brightness(0)) so it stays visible. The wordmark text lives next to it at
 * each call site, so the image itself is decorative (empty alt).
 */
export function Logo({ className = '' }) {
  return (
    <img
      src={logoUrl}
      alt=""
      draggable={false}
      className={cn('h-7 w-auto select-none [filter:brightness(0)] dark:[filter:none]', className)}
    />
  );
}
