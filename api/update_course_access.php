<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include '../includes/db_connect.php';

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['email']) || !isset($input['course_name'])) {
    echo json_encode(["success" => false, "message" => "Missing parameters"]);
    exit;
}

$email = trim($input['email']);
$course_name = trim($input['course_name']);
$now = date('Y-m-d H:i:s');

// Update last_accessed for the specific course user enrollment
$sql = "UPDATE courses SET last_accessed = ? WHERE email = ? AND course_name = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sss", $now, $email, $course_name);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "error" => $conn->error]);
}

$stmt->close();
$conn->close();
?>
