<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include '../includes/db_connect.php';

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['email'])) {
    echo json_encode(["success" => false, "message" => "Email required"]);
    exit;
}

$email = trim($input['email']);

// Get the specific course that was accessed most recently
// AND check if it is NOT completed (score > 80)
// We want "if i didn't submit it" (or didn't complete it)
// Checking submission is hard if we don't track "submitted" vs "passed".
// User said "didn't submit it". If they submitted and got low score, they technically submitted.
// But "Resume" implies unfinished business. I will filter for courses where score is NOT > 80 (i.e. not completed).

$sql = "SELECT c.course_name, c.last_accessed 
        FROM courses c
        LEFT JOIN quiz_results q ON c.course_name = q.course AND c.email = q.email AND q.score > 80
        WHERE c.email = ? AND c.last_accessed IS NOT NULL AND q.id IS NULL
        ORDER BY c.last_accessed DESC
        LIMIT 1";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$course = $result->fetch_assoc();

if ($course) {
    echo json_encode(["success" => true, "course" => $course]);
} else {
    echo json_encode(["success" => false, "message" => "No active courses found"]);
}

$stmt->close();
$conn->close();
?>
