export const memoryEmojis = [
    "🍎", "🍌", "🍇", "🍓", "🍒", "🍑", "🍍", "🥭", 
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", 
    "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", 
    "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱",
];

export const getRandomEmojis = (count: number): string[] => {
    const shuffled = memoryEmojis.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};