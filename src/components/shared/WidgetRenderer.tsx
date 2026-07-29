'use client';

import React, { useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { WidgetConfig, WidgetType } from '@/store/usePlayerStore';

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
    DATA_TABLE: dynamic(() => import('../widgets/DataTableWidget'), { ssr: false }),
    SENSOR_VALUE: dynamic(() => import('../widgets/SensorValueWidget'), { ssr: false }),
    IMAGE: dynamic(() => import('../widgets/ImageWidget'), { ssr: false }),
    WIFI_INFO: dynamic(() => import('../widgets/WifiWidget'), { ssr: false }),
    FEEDBACK: dynamic(() => import('../widgets/FeedbackWidget'), { ssr: false }),
};

interface WidgetRendererProps { widget: WidgetConfig; }

class WidgetErrorBoundary extends React.Component<
    { children: React.ReactNode; type: string },
    { error: Error | null }
> {
    constructor(props: any) {
        super(props);
        this.state = { error: null };
    }
    static getDerivedStateFromError(error: Error) { return { error }; }
    componentDidCatch(error: Error, info: any) {
        // eslint-disable-next-line no-console
        console.error('[Widget crash]' , this.props.type, error, info);
    }
    render() {
        if (this.state.error) {
            return (
                <div className="w-full h-full grid place-items-center bg-destructive/10 border border-destructive/40 rounded-md text-destructive text-[11px] font-medium p-3 text-center">
                    <div>
                        <div className="font-bold uppercase tracking-wide mb-1">{this.props.type}</div>
                        <div className="opacity-80">Widget no se pudo renderizar</div>
                    </div>
                </div>
            );
        }
        return this.props.children as React.ReactElement;
    }
}

const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget }) => {
    const Component = useMemo(() => widgetMap[widget.type] || null, [widget.type]);

    if (!Component) {
        return (
            <div className="flex items-center justify-center w-full h-full bg-destructive/10 border border-destructive/40 rounded-md p-3 text-xs text-destructive">
                Tipo desconocido: {widget.type}
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-hidden">
            <WidgetErrorBoundary type={widget.type}>
                <Suspense fallback={
                    <div className="w-full h-full grid place-items-center bg-muted/40 rounded-md">
                        <div className="size-2 rounded-full bg-primary/70 animate-pulse" />
                    </div>
                }>
                    <Component data={widget.data} />
                </Suspense>
            </WidgetErrorBoundary>
        </div>
    );
};

export default WidgetRenderer;
