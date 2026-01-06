<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Get the request body
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['role_name']) || empty($input['role_name'])) {
    echo json_encode([
        "success" => false,
        "error" => "Role name is required"
    ]);
    exit;
}

$role_name = trim($input['role_name']);
$user_level = isset($input['user_level']) ? $input['user_level'] : 'beginner';

// Get API key from environment variable or config
$api_key = getenv('OPENROUTER_API_KEY');
if (empty($api_key)) {
    // Try to load from .env file
    $env_file = __DIR__ . '/../.env';
    if (file_exists($env_file)) {
        // Try parse_ini_file first
        $env_vars = @parse_ini_file($env_file);
        if ($env_vars && isset($env_vars['OPENROUTER_API_KEY'])) {
            $api_key = $env_vars['OPENROUTER_API_KEY'];
        } else {
            // Fallback: read file line by line
            $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue; // Skip comments
                if (preg_match('/^OPENROUTER_API_KEY\s*=\s*(.+)$/i', $line, $matches)) {
                    $api_key = trim($matches[1], '"\'');
                    break;
                }
            }
        }
    }
}

if (empty($api_key)) {
    echo json_encode([
        "success" => false,
        "error" => "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in your .env file."
    ]);
    exit;
}

// Create the prompt for OpenAI
$prompt = "Create a comprehensive learning roadmap for someone wanting to become a {$role_name}.
Current skill level: {$user_level}

IMPORTANT: Provide the response ONLY as valid JSON. Do not include markdown code blocks or any other text.

Include:
1. Prerequisites (if any)
2. Step-by-step learning path (3-6 months)
3. Key skills to master
4. Recommended resources
5. Projects to build
6. Career preparation tips

Structure the JSON exactly like this:
{
    \"roadmap\": {
        \"role\": \"{$role_name}\",
        \"duration\": \"X months\",
        \"prerequisites\": [\"Item 1\", \"Item 2\"],
        \"phases\": [
            {
                \"phase\": \"Phase 1 Name\",
                \"duration\": \"X weeks\",
                \"skills\": [\"Skill 1\", \"Skill 2\"],
                \"resources\": [\"Resource 1\", \"Resource 2\"],
                \"projects\": [\"Project 1\", \"Project 2\"]
            }
        ],
        \"career_tips\": [\"Tip 1\", \"Tip 2\"]
    }
}";

// Call OpenRouter API
$url = "https://openrouter.ai/api/v1/chat/completions";

$data = [
    "model" => "nex-agi/deepseek-v3.1-nex-n1:free",
    "messages" => [
        [
            "role" => "user",
            "content" => $prompt
        ]
    ],
    "temperature" => 0.7,
    "max_tokens" => 2000
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer " . $api_key,
    "HTTP-Referer: " . (isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'http://localhost'),
    "X-Title: LearnAI"
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

if ($curl_error) {
    echo json_encode([
        "success" => false,
        "error" => "Connection error: " . $curl_error
    ]);
    exit;
}

if ($http_code !== 200) {
    $error_data = json_decode($response, true);
    echo json_encode([
        "success" => false,
        "error" => "API error: " . ($error_data['error']['message'] ?? "HTTP {$http_code}")
    ]);
    exit;
}

$result = json_decode($response, true);

if (!isset($result['choices'][0]['message']['content'])) {
    echo json_encode([
        "success" => false,
        "error" => "Invalid response from AI service"
    ]);
    exit;
}

$content = $result['choices'][0]['message']['content'];

// Clean content (remove markdown if present)
$content = preg_replace('/^```json\s*|\s*```$/', '', trim($content));
$content = preg_replace('/^```\s*|\s*```$/', '', $content);

echo json_encode([
    "success" => true,
    "data" => $content
]);
?>
