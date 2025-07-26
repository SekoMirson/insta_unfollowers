<?php
// Set maximum execution time to 0 (unlimited)
set_time_limit(0);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Start session to store progress information
session_start();

// Check if form is submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get form data
    $username = isset($_POST['username']) ? trim($_POST['username']) : '';
    $password = isset($_POST['password']) ? trim($_POST['password']) : '';
    $count = isset($_POST['count']) && !empty($_POST['count']) ? (int)$_POST['count'] : 0; // 0 means all
    
    // Validate input
    if (empty($username) || empty($password)) {
        header('Location: index.php?error=Kullanıcı adı ve şifre gereklidir.');
        exit;
    }
    
    // Create logs directory if it doesn't exist
    $logsDir = __DIR__ . '/../logs';
    if (!file_exists($logsDir)) {
        mkdir($logsDir, 0777, true);
    }
    
    // Log file path
    $logFile = $logsDir . '/unfollow_' . date('Y-m-d_H-i-s') . '.log';
    
    // Initialize log
    file_put_contents($logFile, "Instagram Unfollow Process Started: " . date('Y-m-d H:i:s') . "\n");
    file_put_contents($logFile, "Username: {$username}\n", FILE_APPEND);
    file_put_contents($logFile, "Unfollow Count: " . ($count > 0 ? $count : 'All') . "\n", FILE_APPEND);
    
    try {
        // Include Instagram API library
        require_once __DIR__ . '/../vendor/autoload.php';
        
        // Use Instagram API to login and unfollow
        \InstagramAPI\Instagram::$allowDangerousWebUsageAtMyOwnRisk = true;
        $ig = new \InstagramAPI\Instagram(false, false);
        
        // Log in to Instagram
        file_put_contents($logFile, "Attempting to log in...\n", FILE_APPEND);
        $loginResponse = $ig->login($username, $password);
        file_put_contents($logFile, "Login successful!\n", FILE_APPEND);
        
        // Get following list
        file_put_contents($logFile, "Fetching following list...\n", FILE_APPEND);
        $followings = [];
        $maxId = null;
        $rankToken = \InstagramAPI\Signatures::generateUUID();
        
        do {
            $response = $ig->people->getSelfFollowing($rankToken, null, $maxId);
            $followings = array_merge($followings, $response->getUsers());
            $maxId = $response->getNextMaxId();
            file_put_contents($logFile, "Fetched " . count($followings) . " followings so far...\n", FILE_APPEND);
            
            // Sleep to avoid rate limiting
            sleep(2);
        } while ($maxId !== null);
        
        $totalFollowings = count($followings);
        file_put_contents($logFile, "Total followings: {$totalFollowings}\n", FILE_APPEND);
        
        // Determine how many users to unfollow
        $unfollowCount = ($count > 0 && $count < $totalFollowings) ? $count : $totalFollowings;
        file_put_contents($logFile, "Will unfollow {$unfollowCount} users\n", FILE_APPEND);
        
        // Unfollow users
        $successCount = 0;
        $errorCount = 0;
        
        for ($i = 0; $i < $unfollowCount; $i++) {
            $user = $followings[$i];
            $userId = $user->getPk();
            $userName = $user->getUsername();
            
            try {
                file_put_contents($logFile, "Unfollowing {$userName}...\n", FILE_APPEND);
                $ig->people->unfollow($userId);
                file_put_contents($logFile, "Successfully unfollowed {$userName}\n", FILE_APPEND);
                $successCount++;
                
                // Sleep to avoid rate limiting
                sleep(rand(2, 5));
            } catch (Exception $e) {
                file_put_contents($logFile, "Error unfollowing {$userName}: " . $e->getMessage() . "\n", FILE_APPEND);
                $errorCount++;
            }
        }
        
        // Log summary
        file_put_contents($logFile, "\nUnfollow Process Completed: " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);
        file_put_contents($logFile, "Successfully unfollowed: {$successCount}\n", FILE_APPEND);
        file_put_contents($logFile, "Failed to unfollow: {$errorCount}\n", FILE_APPEND);
        
        // Redirect with success message
        header('Location: index.php?success=İşlem tamamlandı! ' . $successCount . ' kişi takipten çıkarıldı.');
        exit;
        
    } catch (Exception $e) {
        // Log error
        file_put_contents($logFile, "Error: " . $e->getMessage() . "\n", FILE_APPEND);
        
        // Redirect with error message
        header('Location: index.php?error=Hata oluştu: ' . $e->getMessage());
        exit;
    }
} else {
    // If not POST request, redirect to index
    header('Location: index.php');
    exit;
}
?>
