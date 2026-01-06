from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_service import get_recommendations, get_roadmap, analyze_progress, get_weak_topic_recommendations
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/recommendations', methods=['POST'])
def recommendations():
    """Get personalized role recommendations"""
    try:
        data = request.get_json()
        user_profile = data.get('user_profile', {})
        available_roles = data.get('available_roles', [])

        result = get_recommendations(user_profile, available_roles)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/roadmap', methods=['POST'])
def roadmap():
    """Get learning roadmap for a specific role"""
    try:
        data = request.get_json()
        role_name = data.get('role_name', '')
        user_level = data.get('user_level', 'beginner')

        result = get_roadmap(role_name, user_level)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/analyze-progress', methods=['POST'])
def analyze_progress_endpoint():
    """Analyze user learning progress"""
    try:
        data = request.get_json()
        completed_roles = data.get('completed_roles', [])
        current_activities = data.get('current_activities', [])

        result = analyze_progress(completed_roles, current_activities)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/weak-topics-recommendations', methods=['POST'])
def weak_topics_recommendations():
    """Get detailed resources for weak topics"""
    try:
        data = request.get_json()
        weak_topics = data.get('weak_topics', [])
        strong_areas = data.get('strong_areas', [])

        result = get_weak_topic_recommendations(weak_topics, strong_areas)
        
        # Parse result if it's a string (though it should be JSON already)
        try:
            if isinstance(result, str):
                # Remove markdown if present
                import re
                clean_result = re.sub(r'^```json\s*|\s*```$', '', result.strip(), flags=re.MULTILINE)
                result_json = json.loads(clean_result)
            else:
                result_json = result
            return jsonify({"success": True, "data": result_json})
        except:
            return jsonify({"success": True, "raw_data": result})
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "AI Service API"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)