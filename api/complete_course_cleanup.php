<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../includes/db_connect.php';

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['email']) || !isset($input['course'])) {
    echo json_encode([
        "success" => false,
        "message" => "Email and course are required"
    ]);
    exit;
}

$email = trim($input['email']);
$course = trim($input['course']);

try {
    // Delete all weak topics for this user and course
    $stmt = $conn->prepare("DELETE FROM weak_topics WHERE email = ? AND course = ?");
    $stmt->bind_param("ss", $email, $course);
    $stmt->execute();
    $deletedTopics = $stmt->affected_rows;
    $stmt->close();
    
    // Also mark all topic progress as completed for this course
    $stmt2 = $conn->prepare("
        UPDATE topic_progress 
        SET is_completed = TRUE, completed_at = CURRENT_TIMESTAMP 
        WHERE email = ? AND course = ? AND is_completed = FALSE
    ");
    $stmt2->bind_param("ss", $email, $course);
    $stmt2->execute();
    $updatedProgress = $stmt2->affected_rows;
    $stmt2->close();
    
    $conn->close();
    
    echo json_encode([
        "success" => true,
        "message" => "Course completed! Weak topics cleared.",
        "deleted_topics" => $deletedTopics,
        "updated_progress" => $updatedProgress
    ]);
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}
?>
