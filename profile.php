<?php
session_start();
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'includes/db_connect.php';

// Check if user is logged in via session
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        "success" => false,
        "message" => "Not authenticated"
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

// Fetch user data
$stmt = $conn->prepare("SELECT id, name, email, created_at FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "User not found"
    ]);
    exit;
}

$user = $result->fetch_assoc();

echo json_encode([
    "success" => true,
    "user" => [
        "id" => $user['id'],
        "name" => $user['name'],
        "email" => $user['email'],
        "created_at" => $user['created_at']
    ]
]);

$stmt->close();
$conn->close();
?>
