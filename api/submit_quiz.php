<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include '../includes/db_connect.php';

// Get the request body
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['email']) || !isset($input['course']) || !isset($input['score'])) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields"
    ]);
    exit;
}

$email = trim($input['email']);
$course = trim($input['course']);
$score = intval($input['score']);

// Insert result into database
$sql = "INSERT INTO quiz_results (email, course, score) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssi", $email, $course, $score);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Quiz result saved successfully"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Error saving result: " . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
