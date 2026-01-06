<?php
$root = dirname(__DIR__);
require $root . '/includes/db_connect.php';

if (!isset($conn)) {
    die("Database connection failed to initialize.");
}


// Debug output
var_dump($conn);

// Add columns if they don't exist
// We assume users table modification already passed or exists
$conn->query("ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INT DEFAULT 0");
$conn->query("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_date DATE DEFAULT NULL");

// Only try courses modification
$alter_courses_sql = "ALTER TABLE courses
ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP DEFAULT NULL";

$conn->query($alter_courses_sql);

$alter_quiz_sql = "ALTER TABLE quiz_results
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP";

if ($conn->query($alter_quiz_sql) === TRUE) {
    echo "Database migration successful: All columns added/verified.";
} else {
    echo "Error updating database: " . $conn->error;
}

$conn->close();

// Run database updates for new tables
$updates_file = $root . '/database_updates.sql';
if (file_exists($updates_file)) {
    $sql = file_get_contents($updates_file);
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->multi_query($sql)) {
        do {
            // Consume all results
        } while ($conn->more_results() && $conn->next_result());
        echo "Database updates applied successfully.";
    } else {
        echo "Error applying database updates: " . $conn->error;
    }
    $conn->close();
} else {
    echo "Database updates file not found.";
}
?>
