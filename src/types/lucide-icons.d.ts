// Allow deep imports for lucide-react icons (e.g. 'lucide-react/dist/esm/icons/calendar')
// Used across the codebase for smaller bundle size in dev. Build TypeScript needs this shim.
declare module 'lucide-react/dist/esm/icons/*' {
    import { LucideIcon } from 'lucide-react';
    const Icon: LucideIcon;
    export default Icon;
}
