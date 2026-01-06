import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class AIService:
    def __init__(self):
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        )

    def generate_learning_recommendations(self, user_profile, available_roles):
        """
        Generate personalized learning recommendations based on user profile
        """
        prompt = f"""
        Based on the following user profile, recommend the most suitable learning roles from the available options:

        User Profile:
        - Learning Style: {user_profile.get('learning_style', 'Not specified')}
        - Preferred Duration: {user_profile.get('preferred_duration', 'Not specified')}
        - Current Skill Level: {user_profile.get('skill_level', 'Beginner')}
        - Interests: {', '.join(user_profile.get('interests', []))}

        Available Roles:
        {', '.join(available_roles)}

        Please provide:
        1. Top 3 recommended roles with reasoning
        2. Why each role matches their profile
        3. Expected learning outcomes

        Format your response as JSON with the following structure:
        {{
            "recommendations": [
                {{
                    "role": "Role Name",
                    "reasoning": "Why this role matches",
                    "outcomes": ["Outcome 1", "Outcome 2"]
                }}
            ]
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="openai/gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating recommendations: {str(e)}"

    def generate_learning_roadmap(self, role_name, user_level):
        """
        Generate a detailed learning roadmap for a specific role
        """
        prompt = f"""
        Create a comprehensive learning roadmap for someone wanting to become a {role_name}.
        Current skill level: {user_level}

        Include:
        1. Prerequisites (if any)
        2. Step-by-step learning path (3-6 months)
        3. Key skills to master
        4. Recommended resources
        5. Projects to build
        6. Career preparation tips

        Format as JSON:
        {{
            "roadmap": {{
                "role": "{role_name}",
                "duration": "X months",
                "prerequisites": ["Item 1", "Item 2"],
                "phases": [
                    {{
                        "phase": "Phase 1",
                        "duration": "X weeks",
                        "skills": ["Skill 1", "Skill 2"],
                        "resources": ["Resource 1", "Resource 2"],
                        "projects": ["Project 1", "Project 2"]
                    }}
                ],
                "career_tips": ["Tip 1", "Tip 2"]
            }}
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="openai/gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2000
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating roadmap: {str(e)}"

    def analyze_user_progress(self, completed_roles, current_activities):
        """
        Analyze user learning progress and provide insights
        """
        prompt = f"""
        Analyze the following user learning data and provide insights:

        Completed Roles: {', '.join(completed_roles) if completed_roles else 'None'}
        Current Activities: {', '.join(current_activities) if current_activities else 'None'}

        Provide:
        1. Progress assessment
        2. Strengths identified
        3. Areas for improvement
        4. Next recommended steps
        5. Learning pattern insights

        Format as JSON:
        {{
            "analysis": {{
                "progress_level": "Beginner/Intermediate/Advanced",
                "strengths": ["Strength 1", "Strength 2"],
                "improvements": ["Area 1", "Area 2"],
                "recommendations": ["Next step 1", "Next step 2"],
                "insights": "Overall learning pattern analysis"
            }}
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="openai/gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error analyzing progress: {str(e)}"

    def generate_weak_topic_resources(self, weak_topics, strong_areas=None):
        """
        Generate detailed learning resources for weak topics/courses
        """
        weak_topics_list = "\n".join([f"- {t.get('topic_name')} (Course: {t.get('course')}, Score: {t.get('quiz_score')}%)" for t in weak_topics])
        strong_areas_list = "\n".join([f"- {s.get('course')} (Avg Score: {s.get('avg_score')}%)" for s in (strong_areas or [])])

        prompt = f"""
        You are an educational AI assistant. Analyze the student performance data and provide personalized learning resources.

        WEAK AREAS / INCOMPLETE COURSES (Needs Improvement):
        {weak_topics_list if weak_topics else 'None identified.'}

        STRONG AREAS (Exceeded Expectations):
        {strong_areas_list if strong_areas else 'None identified.'}

        Provide a comprehensive response in JSON format:
        {{
            "feedback": "Overall encouraging feedback message",
            "weak_areas_analysis": "Analysis of why they might be struggling with these specific areas",
            "resources": [
                {{
                    "topic": "Topic/Course Name",
                    "content_description": "Extremely detailed description of WHAT to learn (concepts, examples, takeaways). Be very educational.",
                    "practice_tips": "Specific exercises or projects to master this topic"
                }}
            ],
            "study_plan": "A week-by-week study plan to master these weak areas"
        }}

        Requirements:
        - Provide high-quality content descriptions.
        - The 'content_description' should be rich and educational.
        - DO NOT include any YouTube video links or article URLs.
        - Return ONLY the JSON object.
        """

        try:
            response = self.client.chat.completions.create(
                model="openai/gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2500
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating resources: {str(e)}"

# Initialize the AI service
ai_service = AIService()

# Example usage functions
def get_recommendations(user_profile, available_roles):
    """Get personalized role recommendations"""
    return ai_service.generate_learning_recommendations(user_profile, available_roles)

def get_roadmap(role_name, user_level="beginner"):
    """Get detailed learning roadmap for a role"""
    return ai_service.generate_learning_roadmap(role_name, user_level)

def analyze_progress(completed_roles=None, current_activities=None):
    """Analyze user learning progress"""
    if completed_roles is None:
        completed_roles = []
    if current_activities is None:
        current_activities = []
    return ai_service.analyze_user_progress(completed_roles, current_activities)

def get_weak_topic_recommendations(weak_topics, strong_areas=None):
    """Get detailed resources for weak topics"""
    return ai_service.generate_weak_topic_resources(weak_topics, strong_areas)

if __name__ == "__main__":
    # Test the AI service
    print("Testing AI Service...")

    # Test recommendations
    test_profile = {
        "learning_style": "visual",
        "preferred_duration": "medium",
        "skill_level": "beginner",
        "interests": ["programming", "design"]
    }

    recommendations = get_recommendations(test_profile, ["Frontend Developer", "UI/UX Designer", "Data Analyst"])
    print("Recommendations:", recommendations)

    # Test roadmap
    roadmap = get_roadmap("Frontend Developer", "beginner")
    print("Roadmap:", roadmap)
