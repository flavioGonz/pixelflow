'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Star, Heart, MessageCircle } from 'lucide-react';

interface SocialPost {
    id: string;
    user: string;
    avatar: string;
    image: string;
    caption: string;
    likes: string;
    platform: 'INSTAGRAM' | 'TRIPADVISOR';
    rating?: number;
}

interface SocialFeedWidgetProps {
    data: {
        posts?: SocialPost[];
        interval?: number;
        title?: string;
    };
}

const defaultPosts: SocialPost[] = [
    {
        id: '1',
        user: '@marina_traveler',
        avatar: 'https://i.pravatar.cc/150?u=1',
        image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=800',
        caption: 'Increíble tarde de relax en las termas. ¡Totalmente recomendado! 🧖‍♀️✨ #AltosDelArapey #Relax',
        likes: '1.2k',
        platform: 'INSTAGRAM'
    },
    {
        id: '2',
        user: 'Juan Carlos M.',
        avatar: 'https://i.pravatar.cc/150?u=2',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800',
        caption: 'La mejor atención y el buffet es de otro planeta. Volveremos pronto.',
        likes: '450',
        platform: 'TRIPADVISOR',
        rating: 5
    },
    {
        id: '3',
        user: '@fitness_pablo',
        avatar: 'https://i.pravatar.cc/150?u=3',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800',
        caption: 'Entrenando con la mejor vista. El gimnasio está súper completo. 💪🔥',
        likes: '2.8k',
        platform: 'INSTAGRAM'
    }
];

const SocialFeedWidget: React.FC<SocialFeedWidgetProps> = ({ data }) => {
    const [index, setIndex] = useState(0);
    const posts = (data.posts && data.posts.length > 0) ? data.posts : defaultPosts;
    const interval = data.interval || 8000;

    useEffect(() => {
        if (posts.length <= 1) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % posts.length);
        }, interval);
        return () => clearInterval(timer);
    }, [posts.length, interval]);

    const post = posts[index];

    if (!post) return null;

    return (
        <div className="w-full h-full p-4 flex flex-col items-center justify-center font-sans">
            <AnimatePresence mode="wait">
                <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 50, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    exit={{ opacity: 0, y: -50, rotate: 2 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] as any }}
                    className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between bg-white border-b border-neutral-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border-2 border-pink-500 p-0.5">
                                <img src={post.avatar} className="w-full h-full rounded-full object-cover" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-black leading-none">{post.user}</h4>
                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                                    {post.platform === 'INSTAGRAM' ? 'Instagram' : 'TripAdvisor'}
                                </p>
                            </div>
                        </div>
                        {post.platform === 'INSTAGRAM' ? (
                            <Instagram className="w-5 h-5 text-pink-500" />
                        ) : (
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < (post.rating || 0) ? 'fill-emerald-500 text-emerald-500' : 'text-neutral-200'}`} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Image */}
                    <div className="aspect-square w-full relative">
                        <img src={post.image} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Footer */}
                    <div className="p-5 bg-white text-black space-y-3">
                        <div className="flex items-center gap-4 text-neutral-800">
                            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-xs">
                            <span className="text-emerald-600">{post.likes} likes</span>
                        </p>
                        <p className="text-sm leading-relaxed font-medium">
                            <span className="font-black mr-2">{post.user.replace('@', '')}</span>
                            {post.caption}
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default SocialFeedWidget;
