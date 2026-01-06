# 🎓 LearnAI - Personalized AI Learning Platform

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PHP](https://img.shields.io/badge/PHP-8.x-777BB4.svg?style=flat&logo=php)](https://www.php.net/)
[![Python](https://img.shields.io/badge/Python-3.x-3776AB.svg?style=flat&logo=python)](https://www.python.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1.svg?style=flat&logo=mysql)](https://www.mysql.com/)

**LearnAI** is a state-of-the-art, AI-powered educational platform designed to provide a tailored learning experience. By analyzing user performance and preferences, LearnAI identifies "weak topics," generates personalized quizzes, and recommends high-quality learning resources to help users master their chosen career paths.

---

## 🚀 Key Features

- **🤖 AI-Powered Recommendations**: Personalized role suggestions and course paths based on your interests and learning style.
- **📊 Interactive Dashboard**: Real-time progress visualization using dynamic charts and analytics.
- **🧠 Weak Topic Prediction**: Uses AI to analyze quiz performance and identify areas that need improvement.
- **📝 Dynamic AI Quizzes**: Generates custom quizzes for any topic to test and reinforce knowledge.
- **💡 AI Personalized Learning Guide**: Provides detailed educational content, key concepts, and practice tips tailored to your weak areas.
- **🏆 Gamification**: Stay motivated with daily streaks, achievements, and progress tracking.
- **🔐 Secure Authentication**: Full user registration and login system with hashed passwords and session management.

---

## 🛠️ Tech Stack

### Frontend
- **HTML5 & CSS3**: Modern, responsive design with a focus on UX/UI.
- **JavaScript (ES6+)**: Handles all client-side logic and API interactions.
- **Chart.js**: For beautiful data visualization on the dashboard.
- **FontAwesome**: For premium iconography.

### Backend
- **PHP**: Core API development and database management.
- **Python (Flask)**: Dedicated AI service for complex logic and LLM orchestration.
- **MySQL**: Relational database for storing user data, courses, and quiz results.

### AI Integration
- **OpenRouter / Google Gemini API**: Powering the intelligent recommendations and quiz generation.

---

## 📂 Project Structure

```text
├── api/                   # PHP Backend API endpoints
├── js/                    # Frontend JavaScript logic
│   ├── auth.js            # Authentication handlers
│   ├── dashboard.js       # Dashboard visualization
│   ├── quiz.js            # Quiz engine
│   └── roles.js           # Role discovery logic
├── css/                   # Stylesheets
├── includes/              # Shared PHP utilities (DB connection)
├── ai_service.py          # Python AI orchestration
├── api.py                 # Python API gateway
├── database.sql           # Database schema
└── index.html             # Landing page
```

---

## ⚙️ Installation & Setup

### Prerequisites
- [XAMPP](https://www.apachefriends.org/index.html) (Apache & MySQL)
- [Python 3.8+](https://www.python.org/downloads/)
- [OpenRouter API Key](https://openrouter.ai/)

### 1. Database Setup
1. Open **phpMyAdmin**.
2. Create a new database named `hackathon` (or your preferred name).
3. Import the `database.sql` and `database_updates.sql` files.

### 2. Backend Configuration
1. Update `includes/db_connect.php` with your database credentials.
2. Create a `.env` file in the root directory and add your API keys:
   ```env
   OPENROUTER_API_KEY=your_actual_key_here
   ```

### 3. AI Service Setup (Python)
```bash
# Install dependencies
pip install -r requirements.txt

# Start the AI service
python api.py
```

### 4. Running the App
1. Move the project folder to your XAMPP `htdocs` directory.
2. Start **Apache** and **MySQL** from the XAMPP Control Panel.
3. Access the application via `http://localhost/Hackathon`.

---

## 🎯 Future Roadmap

- [ ] Mobile Application (React Native).
- [ ] Collaborative Study Groups.
- [ ] Integration with LinkedIn for "Skill Badges."
- [ ] Advanced AI Tutoring Chatbot.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Developed By

**Team LearnAI** - Built with ❤️ for the Hackathon.
