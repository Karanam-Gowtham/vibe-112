<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../includes/db_connect.php';

// Load environment variables
$env_file = __DIR__ . '/../.env';
if (file_exists($env_file)) {
    $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && substr($line, 0, 1) !== '#') {
            list($key, $value) = explode('=', $line, 2);
            putenv(trim($key) . '=' . trim($value));
        }
    }
}

$api_key = getenv('OPENROUTER_API_KEY');
if (empty($api_key)) {
    $env_file = __DIR__ . '/../.env';
    if (file_exists($env_file)) {
        $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            if (preg_match('/^OPENROUTER_API_KEY\s*=\s*(.+)$/i', $line, $matches)) {
                $api_key = trim($matches[1], '"\'');
                break;
            }
        }
    }
}

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['email'])) {
    echo json_encode([
        "success" => false,
        "error" => "Email is required"
    ]);
    exit;
}

$email = trim($input['email']);

// Get incomplete courses and weak topics from database
$stmt = $conn->prepare("
    SELECT DISTINCT
        t.topic_name,
        t.course,
        t.quiz_score
    FROM (
        -- Specific weak topics from identified failures
        SELECT 
            wt.topic_name,
            wt.course,
            wt.quiz_score,
            wt.created_at
        FROM weak_topics wt
        LEFT JOIN (
            SELECT DISTINCT email, course 
            FROM quiz_results 
            WHERE score > 80
        ) completed ON wt.email = completed.email AND wt.course = completed.course
        WHERE wt.email = ? AND completed.course IS NULL

        UNION ALL

        -- Course-level improvement needed (scores < 80%)
        SELECT 
            CONCAT('Course Improvement: ', qr.course) as topic_name,
            qr.course,
            MAX(qr.score) as quiz_score,
            MAX(qr.created_at) as created_at
        FROM quiz_results qr
        LEFT JOIN (
            SELECT DISTINCT email, course 
            FROM quiz_results 
            WHERE score > 80
        ) completed ON qr.email = completed.email AND qr.course = completed.course
        WHERE qr.email = ? AND completed.course IS NULL
        GROUP BY qr.course

        UNION ALL

        -- Courses not started yet
        SELECT 
            CONCAT('New Subject Area: ', c.course_name) as topic_name,
            c.course_name as course,
            0 as quiz_score,
            c.created_at
        FROM courses c
        LEFT JOIN quiz_results qr ON c.email = qr.email AND c.course_name = qr.course
        WHERE c.email = ? AND qr.course IS NULL
    ) t
    ORDER BY t.created_at DESC
    LIMIT 15
");
$stmt->bind_param("sss", $email, $email, $email);
$stmt->execute();
$result = $stmt->get_result();

$weakTopics = [];
while ($row = $result->fetch_assoc()) {
    $weakTopics[] = $row;
}
$stmt->close();

// Get strong areas (topics with score >= 80)
$stmt2 = $conn->prepare("
    SELECT DISTINCT course, AVG(score) as avg_score 
    FROM quiz_results 
    WHERE email = ? AND score >= 80 
    GROUP BY course 
    ORDER BY avg_score DESC 
    LIMIT 5
");
$stmt2->bind_param("s", $email);
$stmt2->execute();
$result2 = $stmt2->get_result();

$strongAreas = [];
while ($row = $result2->fetch_assoc()) {
    $strongAreas[] = $row;
}
$stmt2->close();
$conn->close();

if (empty($weakTopics) && empty($strongAreas)) {
    echo json_encode([
        "success" => true,
        "data" => "No quiz data available yet. Take some quizzes to get personalized recommendations!",
        "weak_topics" => [],
        "strong_areas" => []
    ]);
    exit;
}

// Generate recommendations using Python AI Service
$weakTopicsData = [
    "weak_topics" => $weakTopics,
    "strong_areas" => $strongAreas
];

$python_url = "http://localhost:5000/api/weak-topics-recommendations";
$ch = curl_init($python_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($weakTopicsData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

// If Python service fails, fallback to direct OpenRouter call (original logic)
if ($curl_error || $http_code !== 200) {
    // Original prompt logic as fallback
    $weakTopicsList = array_map(function($t) { return $t['topic_name'] . " (Course: " . $t['course'] . ", Current Best Score: " . $t['quiz_score'] . "%)"; }, $weakTopics);
    $strongAreasList = array_map(function($s) { return $s['course'] . " (Average Score: " . round($s['avg_score']) . "%)"; }, $strongAreas);

    $prompt = "You are an educational AI assistant. Analyze the student performance data and provide personalized recommendations for courses with quiz scores < 80%.
    
    WEAK AREAS:
    " . (empty($weakTopicsList) ? "None" : implode("\n- ", $weakTopicsList)) . "
    
    STRONG AREAS:
    " . (empty($strongAreasList) ? "None" : implode("\n- ", $strongAreasList)) . "
    
    Provide detailed JSON:
    {
        \"feedback\": \"...\",
        \"resources\": [
            {
                \"topic\": \"...\",
                \"content_description\": \"Detailed 4-5 paragraph guide on what to learn\",
                \"practice_tips\": \"...\"
            }
        ],
        \"study_plan\": \"...\"
    }
    
    REQUIREMENTS:
    - DO NOT include any YouTube video links or article URLs.
    - Focus on providing high-quality educational descriptions.\";

    $url = "https://openrouter.ai/api/v1/chat/completions";
    $data = [
        "model" => "openai/gpt-4o-mini",
        "messages" => [["role" => "user", "content" => $prompt]],
        "temperature" => 0.7,
        "max_tokens" => 2000
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Content-Type: application/json",
        "Authorization: Bearer " . $api_key
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    if ($curl_error) {
        echo json_encode(["success" => false, "error" => "OpenRouter Connection Error: " . $curl_error]);
        exit;
    }

    if ($http_code !== 200) {
        echo json_encode(["success" => false, "error" => "OpenRouter API Error (HTTP $http_code): " . $response]);
        exit;
    }

    $result = json_decode($response, true);
    $content = isset($result['choices'][0]['message']['content']) ? $result['choices'][0]['message']['content'] : '';
    
    // More robust JSON extraction
    if (preg_match('/\{.*\}/s', $content, $matches)) {
        $content = $matches[0];
    }
    
    $aiData = json_decode($content, true);
} else {
    $result = json_decode($response, true);
    $aiData = isset($result['data']) ? $result['data'] : null;
}

if (!$aiData) {
    echo json_encode([
        "success" => false,
        "error" => "Failed to parse AI recommendations. Raw response: " . (isset($content) ? substr($content, 0, 100) : "empty"),
        "weak_topics" => $weakTopics,
        "strong_areas" => $strongAreas
    ]);
    exit;
}

echo json_encode([
    "success" => true,
    "data" => $aiData,
    "weak_topics" => $weakTopics,
    "strong_areas" => $strongAreas,
    "resources" => isset($aiData['resources']) ? $aiData['resources'] : (isset($aiData['topics_to_learn']) ? $aiData['topics_to_learn'] : []),
    "study_plan" => isset($aiData['study_plan']) ? $aiData['study_plan'] : null,
    "feedback" => isset($aiData['feedback']) ? $aiData['feedback'] : null,
    "weak_areas_analysis" => isset($aiData['weak_areas_analysis']) ? $aiData['weak_areas_analysis'] : null,
    "strong_areas_analysis" => isset($aiData['strong_areas_analysis']) ? $aiData['strong_areas_analysis'] : null
]);
?>
