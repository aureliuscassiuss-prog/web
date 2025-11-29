// Avatar options for user profiles

export interface Avatar {
    id: string;
    emoji: string;
    name: string;
    gender: 'male' | 'female';
    bgColor: string;
}

export const AVATARS: Avatar[] = [
    {
        id: 'boy1',
        emoji: '👨‍🎓',
        name: 'Student Boy 1',
        gender: 'male',
        bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
    },
    {
        id: 'boy2',
        emoji: '🧑‍💻',
        name: 'Student Boy 2',
        gender: 'male',
        bgColor: 'bg-gradient-to-br from-purple-400 to-purple-600',
    },
    {
        id: 'girl1',
        emoji: '👩‍🎓',
        name: 'Student Girl 1',
        gender: 'female',
        bgColor: 'bg-gradient-to-br from-pink-400 to-pink-600',
    },
    {
        id: 'girl2',
        emoji: '👩‍💻',
        name: 'Student Girl 2',
        gender: 'female',
        bgColor: 'bg-gradient-to-br from-rose-400 to-rose-600',
    },
];

export function getAvatarById(id: string): Avatar | undefined {
    return AVATARS.find(a => a.id === id);
}
