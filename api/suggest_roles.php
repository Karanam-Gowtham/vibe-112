<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Get the request body
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['query']) || empty($input['query'])) {
    echo json_encode([
        "success" => false,
        "error" => "Query is required"
    ]);
    exit;
}

$query = trim($input['query']);

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
        "error" => "Server configuration error"
    ]);
    exit;
}

// Create the prompt for OpenAI
$prompt = "User search query: '{$query}'
Based on this query, suggest 5 relevant professional job roles or learning paths.
Return ONLY a JSON array of strings. Do not include markdown formatting or explanations.
Example: [\"Frontend Developer\", \"React Specialist\", \"Web Designer\"]";

// Call OpenRouter API
$url = "https://openrouter.ai/api/v1/chat/completions";

$data = [
    "model" => "openai/gpt-4o-mini",
    "messages" => [
        [
            "role" => "system",
            "content" => "You are a helpful career advisor insterface. specific JSON arrays of role titles only."
        ],
        [
            "role" => "user",
            "content" => $prompt
        ]
    ],
    "temperature" => 0.7,
    "max_tokens" => 150
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

if ($curl_error || $http_code !== 200) {
    echo json_encode([
        "success" => false,
        "error" => "Failed to fetch suggestions"
    ]);
    exit;
}

$result = json_decode($response, true);
$content = $result['choices'][0]['message']['content'] ?? '[]';

// Clean content (remove markdown if present)
$content = preg_replace('/^```json\s*|\s*```$/', '', trim($content));

// Validate JSON
$suggestions = json_decode($content, true);
if (!is_array($suggestions)) {
    $suggestions = [];
}

echo json_encode([
    "success" => true,
    "data" => $suggestions
]);
?>
