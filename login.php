<?php
session_start();
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'includes/db_connect.php';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Support both JSON and form data
    if (!$data) {
        $data = $_POST;
    }

    if (!isset($data['email']) || !isset($data['password'])) {
        echo json_encode([
            "success" => false,
            "message" => "Email and password are required"
        ]);
        exit;
    }

    $email = trim($data['email']);
    $password = trim($data['password']);

    if (!$email || !$password) {
        echo json_encode([
            "success" => false,
            "message" => "Email and password are required"
        ]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, name, email, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    // Email does not exist
    if ($result->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Email doesn't exist"
        ]);
        exit;
    }

    $row = $result->fetch_assoc();

    // Wrong password
    if (!password_verify($password, $row['password'])) {
        echo json_encode([
            "success" => false,
            "message" => "Wrong password"
        ]);
        exit;
    }

    // Successful login
    $_SESSION['user_id'] = $row['id'];
    $_SESSION['user_email'] = $row['email'];
    $_SESSION['user_name'] = $row['name'];
    $_SESSION['isLoggedIn'] = true;

    echo json_encode([
        "success" => true,
        "message" => "Login successful",
        "user" => [
            "id" => $row['id'],
            "name" => $row['name'],
            "email" => $row['email']
        ]
    ]);
    
    $stmt->close();
    $conn->close();
} else {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request method"
    ]);
}
