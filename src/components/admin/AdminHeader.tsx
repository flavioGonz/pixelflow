'use client';

import React from 'react';
import { UserMenu } from './UserMenu';
import { NotificationCenter } from './NotificationCenter';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Separator } from '@/components/ui/separator';

interface AdminHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
    hideUtilityCluster?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
    title,
    subtitle,
    icon,
    actions,
    hideUtilityCluster = false,
}) => {
    return (
        <header className="h-[64px] px-6 lg:px-8 flex items-center justify-between sticky top-0 z-[40] border-b bg-card/80 backdrop-blur-xl">
            <div className="flex items-center gap-4 min-w-0">
                {icon && (
                    <div className="size-10 rounded-md grid place-items-center shrink-0 bg-primary/10 text-primary border border-primary/20">
                        {icon}
                    </div>
                )}
                <div className="min-w-0">
                    <h1 className="font-heading text-[17px] font-bold tracking-tight truncate text-foreground">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mt-0.5 truncate text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {actions && (
                    <div className="flex items-center gap-2">{actions}</div>
                )}

                {!hideUtilityCluster && (
                    <>
                        {actions && <Separator orientation="vertical" className="h-6 mx-1" />}
                        <div className="flex items-center gap-0.5">
                            <ThemeToggle />
                            <NotificationCenter />
                            <UserMenu />
                        </div>
                    </>
                )}
            </div>
        </header>
    );
};
