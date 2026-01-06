<?php
/**
 * Test script to verify OpenRouter API configuration
 * Run this file in your browser to check if your API key is configured correctly
 */

// Get API key
$api_key = getenv('OPENROUTER_API_KEY');
if (empty($api_key)) {
    $env_file = __DIR__ . '/.env';
    if (file_exists($env_file)) {
        $env_vars = @parse_ini_file($env_file);
        if ($env_vars && isset($env_vars['OPENROUTER_API_KEY'])) {
            $api_key = $env_vars['OPENROUTER_API_KEY'];
        } else {
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
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Configuration Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .test-container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .status {
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
        }
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        h1 {
            color: #333;
        }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="test-container">
        <h1>OpenRouter API Configuration Test</h1>
        
        <?php if (empty($api_key)): ?>
            <div class="error status">
                <strong>❌ API Key Not Found</strong>
                <p>The OpenRouter API key is not configured.</p>
                <p><strong>To fix this:</strong></p>
                <ol>
                    <li>Create a <code>.env</code> file in the project root directory</li>
                    <li>Add the following line: <code>OPENROUTER_API_KEY=your_api_key_here</code></li>
                    <li>Replace <code>your_api_key_here</code> with your actual API key from <a href="https://openrouter.ai/" target="_blank">OpenRouter</a></li>
                    <li>Refresh this page to test again</li>
                </ol>
            </div>
        <?php else: ?>
            <div class="success status">
                <strong>✅ API Key Found</strong>
                <p>API Key: <code><?php echo substr($api_key, 0, 20) . '...'; ?></code></p>
            </div>
            
            <?php
            // Test the API connection
            $test_url = "https://openrouter.ai/api/v1/chat/completions";
            $test_data = [
                "model" => "openai/gpt-4o-mini",
                "messages" => [
                    [
                        "role" => "user",
                        "content" => "Say 'API connection successful' if you can read this."
                    ]
                ],
                "max_tokens" => 50
            ];
            
            $ch = curl_init($test_url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($test_data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Content-Type: application/json",
                "Authorization: Bearer " . $api_key,
                "HTTP-Referer: http://localhost",
                "X-Title: LearnAI Test"
            ]);
            
            $response = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curl_error = curl_error($ch);
            curl_close($ch);
            
            if ($curl_error): ?>
                <div class="error status">
                    <strong>❌ Connection Error</strong>
                    <p>Error: <?php echo htmlspecialchars($curl_error); ?></p>
                    <p>Make sure cURL is enabled in your PHP configuration.</p>
                </div>
            <?php elseif ($http_code !== 200): ?>
                <div class="error status">
                    <strong>❌ API Error</strong>
                    <p>HTTP Status: <?php echo $http_code; ?></p>
                    <p>Response: <?php echo htmlspecialchars(substr($response, 0, 200)); ?></p>
                    <?php if ($http_code === 401): ?>
                        <p><strong>This usually means your API key is invalid or expired.</strong></p>
                    <?php endif; ?>
                </div>
            <?php else: ?>
                <div class="success status">
                    <strong>✅ API Connection Successful!</strong>
                    <p>The OpenRouter API is working correctly.</p>
                    <p>Response: <?php echo htmlspecialchars(substr($response, 0, 100)); ?>...</p>
                </div>
            <?php endif; ?>
        <?php endif; ?>
        
        <div class="info status">
            <strong>ℹ️ Information</strong>
            <ul>
                <li>PHP Version: <?php echo phpversion(); ?></li>
                <li>cURL Extension: <?php echo function_exists('curl_init') ? '✅ Enabled' : '❌ Not Enabled'; ?></li>
                <li>.env File: <?php echo file_exists(__DIR__ . '/.env') ? '✅ Found' : '❌ Not Found'; ?></li>
            </ul>
        </div>
        
        <p><a href="roles.html">← Back to Roles Page</a></p>
    </div>
</body>
</html>
