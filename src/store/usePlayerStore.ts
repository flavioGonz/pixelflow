import { create } from 'zustand';

export type WidgetType = 'VIDEO' | 'PRICE_LIST' | 'SLIDER' | 'TEXT' | 'WEATHER' | 'ACTIVITIES' | 'PRODUCT_LIST' | 'QR_CODE' | 'CATEGORY_NAV' | 'NAV_BUTTON' | 'DATE_TIME' | 'TICKER' | 'SOCIAL_FEED' | 'COUNTDOWN' | 'ATMOSPHERE' | 'DATA_TABLE' | 'SENSOR_VALUE' | 'FLIGHT_BOARD' | 'MUSIC_PLAYER' | 'IMAGE' | 'WIFI_INFO' | 'FEEDBACK';

export interface WidgetConfig {
    id: string;
    type: WidgetType;
    x: number;
    y: number;
    w: number;
    h: number;
    zIndex?: number;
    blur?: number;
    data: any;
}

export interface LayoutJSON {
    id: string;
    _id?: string;
    name: string;
    orientation: 'landscape' | 'portrait' | 'both';
    widgets: WidgetConfig[];
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundVideo?: string;
    backgroundBlur?: number;
    backgroundOverlayColor?: string;
    backgroundOverlayOpacity?: number;
    backgroundPattern?: 'none' | 'dots' | 'grid' | 'waves' | 'noise';
    backgroundPatternOpacity?: number;
    transition?: string;
    transitionDuration?: number;
    // Target design resolution — optional metadata used by Studio to help the designer.
    // Runtime uses % positions so this does NOT affect rendering.
    designWidth?: number;
    designHeight?: number;
    targetDPI?: number;
}

interface PlayerState {
    screenId: string | null;
    layout: LayoutJSON | null;
    isConnected: boolean;
    isAuthorized: boolean;
    selectedCategory: string;
    history: string[];
    navDirection: 'push' | 'pop' | 'none';
    setNavDirection: (d: 'push' | 'pop' | 'none') => void;
    setScreenId: (id: string) => void;
    setLayout: (layout: LayoutJSON) => void;
    setConnected: (connected: boolean) => void;
    setAuthorized: (authorized: boolean) => void;
    setSelectedCategory: (category: string) => void;
    pushToHistory: (layoutId: string) => void;
    popFromHistory: () => string | null;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    screenId: null,
    layout: null,
    isConnected: false,
    isAuthorized: false,
    selectedCategory: 'TODOS',
    history: [],
    navDirection: 'none',
    setNavDirection: (d) => set({ navDirection: d }),
    setScreenId: (id) => set({ screenId: id }),
    setLayout: (layout) => set({ layout }),
    setConnected: (connected) => set({ isConnected: connected }),
    setAuthorized: (authorized) => set({ isAuthorized: authorized }),
    setSelectedCategory: (category) => set({ selectedCategory: category }),
    pushToHistory: (layoutId) => {
        const h = get().history;
        if (h[h.length - 1] === layoutId) return;
        set({ history: [...h, layoutId] });
    },
    popFromHistory: () => {
        const h = get().history;
        if (h.length <= 1) return null;
        const newH = [...h];
        newH.pop();
        const prev = newH[newH.length - 1];
        set({ history: newH });
        return prev;
    },
}));
