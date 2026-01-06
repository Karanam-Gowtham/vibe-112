<?php
include 'includes/db_connect.php';
$users = $conn->query("SELECT id, name, email FROM users");
while($row = $users->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | Name: " . $row['name'] . " | Email: " . $row['email'] . "\n";
}
$conn->close();
?>
