<?php
/**
 * Database Setup Script
 * Run this once to create the database and tables
 * Access: http://localhost/Skill%20Exchange%20Server/api/setup.php
 */

// Database configuration
$host = 'localhost';
$user = 'root';
$password = '';
$db_name = 'barter';

// Create connection (without database first)
$conn = new mysqli($host, $user, $password);

if ($conn->connect_error) {
  die("<h2 style='color:red;'>Connection failed: " . $conn->connect_error . "</h2>");
}

// Create database
$createDbSQL = "CREATE DATABASE IF NOT EXISTS $db_name";
if ($conn->query($createDbSQL) === TRUE) {
  echo "<h3 style='color:green;'>✓ Database created successfully</h3>";
} else {
  echo "<h3 style='color:red;'>✗ Error creating database: " . $conn->error . "</h3>";
}

// Select database
$conn->select_db($db_name);

// Read and execute SQL from database.sql file
$sqlFile = __DIR__ . '/../database.sql';

if (!file_exists($sqlFile)) {
  die("<h3 style='color:red;'>✗ database.sql file not found at: $sqlFile</h3>");
}

$sql = file_get_contents($sqlFile);

// Split by semicolon and execute each query
$queries = array_filter(array_map('trim', explode(';', $sql)), function($q) {
  return !empty($q) && strpos($q, '--') === false;
});

$successCount = 0;
$errorCount = 0;

foreach ($queries as $query) {
  // Skip comments and empty lines
  $lines = explode("\n", $query);
  $cleanQuery = '';
  
  foreach ($lines as $line) {
    if (strpos(trim($line), '--') === 0 || strpos(trim($line), '/*') === 0) {
      continue;
    }
    $cleanQuery .= $line . "\n";
  }
  
  $cleanQuery = trim($cleanQuery);
  
  if (empty($cleanQuery)) {
    continue;
  }

  if ($conn->query($cleanQuery) === TRUE) {
    $successCount++;
  } else {
    $errorCount++;
    echo "<p style='color:red;'>✗ Error: " . $conn->error . "</p>";
    echo "<p style='font-size:0.9rem;color:#666;'>Query: " . substr($cleanQuery, 0, 100) . "...</p>";
  }
}

$conn->close();

?>
<!DOCTYPE html>
<html>
<head>
  <title>Database Setup</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #00ff99;
      padding-bottom: 10px;
    }
    .status {
      margin: 20px 0;
      padding: 15px;
      border-radius: 4px;
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
    }
    .error {
      background: #ffebee;
      border-left-color: #f44336;
    }
    .summary {
      margin-top: 20px;
      padding: 15px;
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      border-radius: 4px;
    }
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🗄️ Barter Database Setup</h1>
    
    <div class="status">
      <strong>Database:</strong> <?php echo $db_name; ?><br>
      <strong>Host:</strong> <?php echo $host; ?>
    </div>

    <div class="summary">
      <h3>Setup Complete ✓</h3>
      <p>
        <strong>Successful Operations:</strong> <?php echo $successCount; ?><br>
        <strong>Errors:</strong> <?php echo $errorCount; ?>
      </p>
    </div>

    <?php if ($errorCount === 0): ?>
      <div class="status">
        <h3 style="margin-top:0;color:green;">✓ All database tables created successfully!</h3>
        <p>Your Barter database is ready to use.</p>
        <p><strong>Next steps:</strong></p>
        <ul>
          <li>Update your PHP API files with the correct database credentials if needed</li>
          <li>Test the API endpoints by visiting <code>/api/users.php?action=getSkills</code></li>
          <li>Update frontend JavaScript to call API endpoints instead of localStorage</li>
        </ul>
      </div>
    <?php else: ?>
      <div class="status error">
        <h3 style="margin-top:0;color:red;">⚠️ Some tables may not have been created</h3>
        <p>Check the errors above and review your database configuration.</p>
      </div>
    <?php endif; ?>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9rem;">
      <p><strong>Database Structure Created:</strong></p>
      <ul style="columns: 2; column-gap: 40px;">
        <li>users</li>
        <li>skills</li>
        <li>user_teaching_skills</li>
        <li>user_learning_interests</li>
        <li>messages</li>
        <li>reviews</li>
        <li>teams</li>
        <li>team_members</li>
        <li>competitions</li>
        <li>competition_participants</li>
        <li>matches</li>
        <li>notifications</li>
      </ul>
    </div>
  </div>
</body>
</html>
