/**
 * Accessibility Utilities — Task 3.9
 * Keyboard navigation, focus management, screen reader helpers.
 */

import React from 'react';

/**
 * Skip navigation link — allows keyboard users to skip to main content.
 * Place as first child of any page layout.
 */
export const SkipNav: React.FC<{ targetId?: string }> = ({ targetId = 'main-content' }) => (
    <a
        href={`#${targetId}`}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:outline-none"
    >
        Skip to main content
    </a>
);

/**
 * Live region for announcing dynamic content changes to screen readers.
 */
export const LiveRegion: React.FC<{ message: string; assertive?: boolean }> = ({ message, assertive = false }) => (
    <div
        role="status"
        aria-live={assertive ? 'assertive' : 'polite'}
        aria-atomic="true"
        className="sr-only"
    >
        {message}
    </div>
);

/**
 * Focus trap hook for modals and dialogs.
 */
export function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active: boolean) {
    React.useEffect(() => {
        if (!active || !ref.current) return;

        const el = ref.current;
        const focusable = el.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
            }
        };

        el.addEventListener('keydown', handleTab);
        first?.focus();

        return () => el.removeEventListener('keydown', handleTab);
    }, [ref, active]);
}

/**
 * Check if an element is visible to screen readers.
 */
export function isScreenReaderVisible(element: HTMLElement): boolean {
    if (element.hasAttribute('aria-hidden') && element.getAttribute('aria-hidden') === 'true') return false;
    if (element.getAttribute('role') === 'presentation') return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
}
