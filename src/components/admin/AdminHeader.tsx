'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import User from 'lucide-react/dist/esm/icons/user';
import Bell from 'lucide-react/dist/esm/icons/bell';
import Link from 'next/link';
import { UserMenu } from './UserMenu';
import { NotificationCenter } from './NotificationCenter';

interface AdminHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ title, subtitle, icon, actions }) => {
    return (
        <header className="h-20 border-b border-white/5 px-10 flex items-center justify-between bg-black/40 backdrop-blur-2xl sticky top-0 z-[40]">
            <div className="flex items-center gap-6">
                {icon && (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 rounded-xl flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/10">
                        {icon}
                    </div>
                )}
                <div>
                    <h1 className="text-xl font-black tracking-tighter uppercase flex items-center gap-3">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-6">
                {actions && <div className="flex items-center gap-3">{actions}</div>}

                <div className="h-8 w-[1px] bg-white/10 mx-2" />

                <div className="flex items-center gap-4">
                    <NotificationCenter />
                    <UserMenu />
                </div>
            </div>
        </header>
    );
};
