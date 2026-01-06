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

// Get the request body
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['course_name'])) {
    echo json_encode([
        "success" => false,
        "message" => "Course name is required"
    ]);
    exit;
}

$course_name = $input['course_name'];

$prompt = "Generate a quiz for the topic: '{$course_name}'.
Create 5 to 10 questions.
Mix multiple-choice (single correct answer) and check-all-that-apply (multiple correct answers) questions.
Ensure the questions vary in difficulty.

Return ONLY valid JSON in the following format:
{
    \"quiz_title\": \"{$course_name} Proficiency Quiz\",
    \"questions\": [
        {
            \"id\": 1,
            \"type\": \"single\" (or \"multiple\"),
            \"question\": \"Question text here?\",
            \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],
            \"correct_indices\": [0] (index of correct answer(s) in the options array)
        }
    ]
}
Do NOT include any markdown formatting (like ```json), just the raw JSON.";

$url = "https://openrouter.ai/api/v1/chat/completions";

$data = [
    "model" => "openai/gpt-4o-mini",
    "messages" => [
        [
            "role" => "user",
            "content" => $prompt
        ]
    ],
    "temperature" => 0.7
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer " . $api_key,
    "HTTP-Referer: http://localhost",
    "X-Title: LearnAI Quiz"
]);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo json_encode([
        "success" => false,
        "message" => "Curl error: " . curl_error($ch)
    ]);
    curl_close($ch);
    exit;
}

curl_close($ch);

$result = json_decode($response, true);

if (isset($result['choices'][0]['message']['content'])) {
    $content = $result['choices'][0]['message']['content'];
    
    // Clean up potential markdown code blocks if the AI ignores instructions
    $content = preg_replace('/^```json\s*|\s*```$/', '', $content);
    
    echo json_encode([
        "success" => true,
        "data" => json_decode($content)
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to generate quiz",
        "debug" => $result
    ]);
}
?>
