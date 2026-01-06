<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

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
    echo json_encode([
        "success" => false,
        "message" => "API key not configured"
    ]);
    exit;
}

// Get the request body
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['course']) || !isset($input['questions']) || !isset($input['user_answers'])) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields: course, questions, user_answers"
    ]);
    exit;
}

$course = $input['course'];
$questions = $input['questions'];
$userAnswers = $input['user_answers'];
$score = isset($input['score']) ? $input['score'] : 0;

// Build analysis data for AI
$incorrectQuestions = [];
foreach ($questions as $index => $question) {
    $userAnswer = isset($userAnswers[$index]) ? $userAnswers[$index] : null;
    $correctAnswer = $question['correct_indices'];
    
    // Check if answer was incorrect
    $isCorrect = false;
    if ($question['type'] === 'single') {
        $isCorrect = ($userAnswer === $correctAnswer[0]);
    } else {
        // Multiple choice
        sort($userAnswer);
        sort($correctAnswer);
        $isCorrect = ($userAnswer === $correctAnswer);
    }
    
    if (!$isCorrect) {
        $incorrectQuestions[] = [
            'question' => $question['question'],
            'type' => $question['type'],
            'options' => $question['options'],
            'correct_answer' => array_map(function($idx) use ($question) {
                return $question['options'][$idx];
            }, $correctAnswer),
            'user_answer' => is_array($userAnswer) 
                ? array_map(function($idx) use ($question) {
                    return isset($question['options'][$idx]) ? $question['options'][$idx] : 'No answer';
                }, $userAnswer)
                : (isset($question['options'][$userAnswer]) ? $question['options'][$userAnswer] : 'No answer')
        ];
    }
}

if (empty($incorrectQuestions)) {
    echo json_encode([
        "success" => true,
        "topics" => []
    ]);
    exit;
}

// Create AI prompt
$questionsText = "";
foreach ($incorrectQuestions as $i => $q) {
    $questionsText .= "\n" . ($i + 1) . ". Question: " . $q['question'];
    $questionsText .= "\n   Correct Answer: " . implode(", ", $q['correct_answer']);
    $questionsText .= "\n   User's Answer: " . (is_array($q['user_answer']) ? implode(", ", $q['user_answer']) : $q['user_answer']);
}

$prompt = "You are an educational AI assistant analyzing a student's quiz performance for the course: '{$course}'.

The student scored {$score}% and got the following questions wrong:
{$questionsText}

Based on these incorrect answers, identify the specific underlying topics/concepts the student needs to improve. Be specific and educational - don't just repeat the question text.

Return ONLY a JSON array of topic names (3-7 topics maximum). Each topic should be a concise, specific concept or skill area.

Example format:
[\"Topic 1\", \"Topic 2\", \"Topic 3\"]

IMPORTANT: Return ONLY the JSON array, no markdown formatting or explanations.";

$url = "https://openrouter.ai/api/v1/chat/completions";

$data = [
    "model" => "openai/gpt-4o-mini",
    "messages" => [
        [
            "role" => "user",
            "content" => $prompt
        ]
    ],
    "temperature" => 0.5,
    "max_tokens" => 500
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer " . $api_key,
    "HTTP-Referer: http://localhost",
    "X-Title: LearnAI Topic Prediction"
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

if ($curl_error || $http_code !== 200) {
    echo json_encode([
        "success" => false,
        "message" => "AI service error: " . ($curl_error ?: "HTTP {$http_code}")
    ]);
    exit;
}

$result = json_decode($response, true);

if (!isset($result['choices'][0]['message']['content'])) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid response from AI service"
    ]);
    exit;
}

$content = $result['choices'][0]['message']['content'];
// Clean up potential markdown code blocks
$content = preg_replace('/^```json\s*|\s*```$/', '', trim($content));
$content = preg_replace('/^```\s*|\s*```$/', '', $content);

$topics = json_decode($content, true);

if (!is_array($topics)) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to parse AI response",
        "debug" => $content
    ]);
    exit;
}

echo json_encode([
    "success" => true,
    "topics" => $topics
]);
?>
