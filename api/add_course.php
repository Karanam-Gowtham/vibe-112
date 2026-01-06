<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include '../includes/db_connect.php';

// Get the request body
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['course_name']) || empty(trim($input['course_name']))) {
    echo json_encode([
        "success" => false,
        "message" => "Course name is required"
    ]);
    exit;
}
if (!isset($input['email']) || empty(trim($input['email']))) {
    echo json_encode([
        "success" => false,
        "message" => "User email is required"
    ]);
    exit;
}

$course_name = trim($input['course_name']);
$email = trim($input['email']);

// Check if course already exists for this user
$check_sql = "SELECT id FROM courses WHERE course_name = ? AND email = ?";
$check_stmt = $conn->prepare($check_sql);
$check_stmt->bind_param("ss", $course_name, $email);
$check_stmt->execute();
$result = $check_stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "You have already added this course"
    ]);
    $check_stmt->close();
    $conn->close();
    exit;
}

$check_stmt->close();

// Insert the course
$sql = "INSERT INTO courses (course_name, email) VALUES (?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $course_name, $email);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Course added successfully",
        "course_id" => $conn->insert_id
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Error adding course: " . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
