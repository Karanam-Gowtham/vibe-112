<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../includes/db_connect.php';

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['email']) || !isset($input['topic_name']) || !isset($input['course']) || !isset($input['is_completed'])) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields"
    ]);
    exit;
}

$email = trim($input['email']);
$topic_name = trim($input['topic_name']);
$course = trim($input['course']);
$is_completed = (bool)$input['is_completed'];

$stmt = $conn->prepare("
    INSERT INTO topic_progress (email, course, topic_name, is_completed, completed_at) 
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
        is_completed = ?,
        completed_at = ?,
        updated_at = CURRENT_TIMESTAMP
");

$completed_at = $is_completed ? date('Y-m-d H:i:s') : null;
$stmt->bind_param("sssissi", $email, $course, $topic_name, $is_completed, $completed_at, $is_completed, $completed_at);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Topic progress updated successfully"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Error updating progress: " . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
