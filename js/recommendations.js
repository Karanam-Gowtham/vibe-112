export function getNextRecommendation(skillTopics, level) {
    return {
        topic: skillTopics[level][0],
        reason: "Recommended based on your current learning level"
    };
}
