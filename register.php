<?php
session_start();
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'includes/db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

// Support both JSON and form data
if (!$data) {
    $data = $_POST;
}

if (!isset($data["name"]) || !isset($data["email"]) || !isset($data["password"])) {
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit;
}

$name = trim($data["name"]);
$email = trim($data["email"]);
$password = $data["password"];

if (!$name || !$email || !$password) {
    echo json_encode(["success" => false, "message" => "Invalid input"]);
    exit;
}

// Check if email already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Email already registered"]);
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->close();

// Hash password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Insert user
$stmt = $conn->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $name, $email, $hashedPassword);

if ($stmt->execute()) {
    // Auto-login after registration
    $user_id = $stmt->insert_id;
    $_SESSION['user_id'] = $user_id;
    $_SESSION['user_email'] = $email;
    $_SESSION['user_name'] = $name;
    $_SESSION['isLoggedIn'] = true;
    
    echo json_encode([
        "success" => true, 
        "message" => "Registration successful",
        "user" => [
            "id" => $user_id,
            "name" => $name,
            "email" => $email
        ]
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Registration failed: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
