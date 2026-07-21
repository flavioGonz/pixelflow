/**
 * Copy text to clipboard with fallback for insecure (HTTP) contexts.
 * navigator.clipboard requires HTTPS/localhost, so we fall back to a
 * temporary textarea + document.execCommand('copy') trick when needed.
 *
 * Returns true if the copy succeeded.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    // Preferred path
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // fall through to legacy
        }
    }

    // Legacy fallback: works on HTTP via execCommand
    if (typeof document === 'undefined') return false;
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, text.length);
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
    } catch {
        return false;
    }
}
