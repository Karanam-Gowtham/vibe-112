import { skillsData } from "./data.js";
import { getNextRecommendation } from "./recommendations.js";

// Temporary frontend profile (until assessment is added)
const userProfile = {
    skill: "python",
    level: "beginner"
};

const rec = getNextRecommendation(
    skillsData[userProfile.skill],
    userProfile.level
);

document.getElementById("recommendation").innerHTML = `
    <h3>What to learn next</h3>
    <p><strong>${rec.topic}</strong></p>
    <small>${rec.reason}</small>
`;
