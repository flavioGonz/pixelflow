'use client';

import React, { useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { WidgetConfig, WidgetType } from '@/store/usePlayerStore';

// Mapping component types to their dynamic imports
const widgetMap: Record<WidgetType, any> = {
    VIDEO: dynamic(() => import('../widgets/VideoWidget'), { ssr: false }),
    PRICE_LIST: dynamic(() => import('../widgets/PriceListWidget'), { ssr: false }),
    SLIDER: dynamic(() => import('../widgets/SliderWidget'), { ssr: false }),
    TEXT: dynamic(() => import('../widgets/TextWidget'), { ssr: false }),
    WEATHER: dynamic(() => import('../widgets/WeatherWidget'), { ssr: false }),
    ACTIVITIES: dynamic(() => import('../widgets/ActivitiesWidget'), { ssr: false }),
    PRODUCT_LIST: dynamic(() => import('../widgets/ProductListWidget'), { ssr: false }),
    QR_CODE: dynamic(() => import('../widgets/QRWidget'), { ssr: false }),
    CATEGORY_NAV: dynamic(() => import('../widgets/CategoryNavWidget'), { ssr: false }),
    NAV_BUTTON: dynamic(() => import('../widgets/NavButtonWidget'), { ssr: false }),
    DATE_TIME: dynamic(() => import('../widgets/DateTimeWidget'), { ssr: false }),
    TICKER: dynamic(() => import('../widgets/TickerWidget'), { ssr: false }),
    SOCIAL_FEED: dynamic(() => import('../widgets/SocialFeedWidget'), { ssr: false }),
    COUNTDOWN: dynamic(() => import('../widgets/CountdownWidget'), { ssr: false }),
    ATMOSPHERE: dynamic(() => import('../widgets/AtmosphereWidget'), { ssr: false }),
    FLIGHT_BOARD: dynamic(() => import('../widgets/FlightBoardWidget'), { ssr: false }),
    MUSIC_PLAYER: dynamic(() => import('../widgets/MusicPlayerWidget'), { ssr: false }),
};

interface WidgetRendererProps {
    widget: WidgetConfig;
}

const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget }) => {
    const Component = useMemo(() => {
        return widgetMap[widget.type] || null;
    }, [widget.type]);

    if (!Component) {
        return (
            <div className="flex items-center justify-center w-full h-full bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-xs text-red-400">
                Unknown Widget Type: {widget.type}
            </div>
        );
    }

    // Calculate position and size based on widget config
    // In a real grid system, these would be controlled by the grid-layout or absolute positioning
    return (
        <div
            className="w-full h-full overflow-hidden"
        >
            <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center animate-pulse bg-white/5 rounded-lg">
                    <div className="w-4 h-4 rounded-full bg-blue-500/50" />
                </div>
            }>
                <Component data={widget.data} />
            </Suspense>
        </div>
    );
};

export default WidgetRenderer;
