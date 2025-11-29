import React from 'react';

export interface PremiumAvatar {
    id: string;
    name: string;
    component: React.FC<{ className?: string }>;
}

// Sleek Black & White SVG Avatars
const Avatar1: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="black" />
        <circle cx="50" cy="35" r="15" fill="white" />
        <path d="M25 75 Q25 55 50 55 Q75 55 75 75 Z" fill="white" />
    </svg>
);

const Avatar2: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="white" />
        <circle cx="50" cy="40" r="18" fill="black" />
        <rect x="30" y="60" width="40" height="35" rx="5" fill="black" />
    </svg>
);

const Avatar3: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#1a1a1a" />
        <polygon points="50,25 65,45 50,40 35,45" fill="white" />
        <circle cx="50" cy="65" r="20" fill="white" />
    </svg>
);

const Avatar4: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="black" />
        <circle cx="35" cy="35" r="8" fill="white" />
        <circle cx="65" cy="35" r="8" fill="white" />
        <path d="M30 65 Q50 75 70 65" stroke="white" strokeWidth="4" fill="none" />
    </svg>
);

const Avatar5: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="white" />
        <rect x="35" y="30" width="30" height="30" fill="black" />
        <circle cx="50" cy="70" r="10" fill="black" />
    </svg>
);

const Avatar6: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#2a2a2a" />
        <path d="M50 20 L70 50 L50 80 L30 50 Z" fill="white" />
    </svg>
);

const Avatar7: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="black" />
        <rect x="30" y="30" width="15" height="15" fill="white" />
        <rect x="55" y="30" width="15" height="15" fill="white" />
        <rect x="35" y="60" width="30" height="8" rx="4" fill="white" />
    </svg>
);

const Avatar8: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="white" />
        <circle cx="50" cy="50" r="25" fill="black" />
        <circle cx="50" cy="50" r="15" fill="white" />
        <circle cx="50" cy="50" r="5" fill="black" />
    </svg>
);

const Avatar9: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#1a1a1a" />
        <path d="M30 40 L50 25 L70 40 L70 70 L30 70 Z" fill="white" />
    </svg>
);

const Avatar10: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="black" />
        <circle cx="50" cy="35" r="12" stroke="white" strokeWidth="3" fill="none" />
        <path d="M30 60 L50 50 L70 60 L70 80 L30 80 Z" fill="white" />
    </svg>
);

export const PREMIUM_AVATARS: PremiumAvatar[] = [
    { id: 'avatar1', name: 'Classic', component: Avatar1 },
    { id: 'avatar2', name: 'Modern', component: Avatar2 },
    { id: 'avatar3', name: 'Geometric', component: Avatar3 },
    { id: 'avatar4', name: 'Minimal', component: Avatar4 },
    { id: 'avatar5', name: 'Abstract', component: Avatar5 },
    { id: 'avatar6', name: 'Diamond', component: Avatar6 },
    { id: 'avatar7', name: 'Professional', component: Avatar7 },
    { id: 'avatar8', name: 'Target', component: Avatar8 },
    { id: 'avatar9', name: 'House', component: Avatar9 },
    { id: 'avatar10', name: 'Corporate', component: Avatar10 },
];

export const getAvatarById = (id: string): PremiumAvatar | undefined => {
    return PREMIUM_AVATARS.find(avatar => avatar.id === id);
};

export const getAvatarComponent = (id: string): React.FC<{ className?: string }> | null => {
    const avatar = getAvatarById(id);
    return avatar ? avatar.component : null;
};
