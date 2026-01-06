<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include '../includes/db_connect.php';

// Get the request body
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['email']) || empty(trim($input['email']))) {
    echo json_encode([
        "success" => false,
        "message" => "User email is required"
    ]);
    exit;
}

$email = trim($input['email']);

// Fetch courses for the user
$sql = "SELECT id, course_name, created_at FROM courses WHERE email = ? ORDER BY created_at DESC";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

$courses = [];
while ($row = $result->fetch_assoc()) {
    $courses[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $courses
]);

$stmt->close();
$conn->close();
?>
