// Helper to calculate max stars based on difficulty
// D1-D2: max 2 stars, D3-D4: max 3 stars, D5-D6: max 4 stars, D7+: max 5 stars
export const getMaxStarsForDifficulty = (diff: number) => {
    if (diff <= 2) return 2
    if (diff <= 4) return 3
    if (diff <= 6) return 4
    return 5
}
