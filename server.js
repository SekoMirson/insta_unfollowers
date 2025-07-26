const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { IgApiClient } = require('instagram-private-api');
const morgan = require('morgan');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 1995;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'panel')));
app.use('/css', express.static(path.join(__dirname, 'css')));

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel', 'index.html'));
});

app.post('/process', async (req, res) => {
  const { username, password, count } = req.body;
  const unfollowCount = count ? parseInt(count) : 0; // 0 means all
  
  // Create log file
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const logFilePath = path.join(logsDir, `unfollow_${timestamp}.log`);

  // console.log
  console.log('Instagram Unfollow Process Started: ' + new Date().toISOString());
  console.log('Username: ' + username);
  console.log('Unfollow Count: ' + (unfollowCount > 0 ? unfollowCount : 'All'));
  
  // Initialize log
  fs.writeFileSync(logFilePath, `Instagram Unfollow Process Started: ${new Date().toISOString()}\n`);
  fs.appendFileSync(logFilePath, `Username: ${username}\n`);
  fs.appendFileSync(logFilePath, `Unfollow Count: ${unfollowCount > 0 ? unfollowCount : 'All'}\n`);
  
  try {
    // Initialize Instagram API client
    const ig = new IgApiClient();
    ig.state.generateDevice(username);
    
    // Login to Instagram
    fs.appendFileSync(logFilePath, "Attempting to log in...\n");
    await ig.account.login(username, password);
    fs.appendFileSync(logFilePath, "Login successful!\n");
    
    // Get following list
    fs.appendFileSync(logFilePath, "Fetching following list...\n");
    let followings = [];
    const followingFeed = ig.feed.accountFollowing(ig.state.cookieUserId);
    
    let response = await followingFeed.items();
    followings = followings.concat(response);
    
    while (followingFeed.isMoreAvailable()) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Sleep to avoid rate limiting
      response = await followingFeed.items();
      followings = followings.concat(response);
      console.log('Fetched ' + followings.length + ' followings so far...');
      fs.appendFileSync(logFilePath, `Fetched ${followings.length} followings so far...\n`);
    }
    
    const totalFollowings = followings.length;
    console.log('Total followings: ' + totalFollowings);
    fs.appendFileSync(logFilePath, `Total followings: ${totalFollowings}\n`);
    
    // Determine how many users to unfollow
    const actualUnfollowCount = (unfollowCount > 0 && unfollowCount < totalFollowings) ? unfollowCount : totalFollowings;
    console.log('Will unfollow ' + actualUnfollowCount + ' users...');
    fs.appendFileSync(logFilePath, `Will unfollow ${actualUnfollowCount} users\n`);
    
    // Unfollow users
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < actualUnfollowCount; i++) {
      const user = followings[i];
      const userId = user.pk;
      const userName = user.username;
      
      try {
        console.log('Unfollowing ' + userName + '...');
        fs.appendFileSync(logFilePath, `Unfollowing ${userName}...\n`);
        await ig.friendship.destroy(userId);
        fs.appendFileSync(logFilePath, `Successfully unfollowed ${userName}\n`);
        successCount++;
        
        // Sleep to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.floor(Math.random() * 3000)));
      } catch (e) {
        console.log('Error unfollowing ' + userName + ': ' + e.message);
        fs.appendFileSync(logFilePath, `Error unfollowing ${userName}: ${e.message}\n`);
        errorCount++;
      }
    }
    
    // Log summary
    console.log('Unfollow Process Completed: ' + new Date().toISOString());
    console.log('Successfully unfollowed: ' + successCount);
    console.log('Failed to unfollow: ' + errorCount);
    
    fs.appendFileSync(logFilePath, `\nUnfollow Process Completed: ${new Date().toISOString()}\n`);
    fs.appendFileSync(logFilePath, `Successfully unfollowed: ${successCount}\n`);
    fs.appendFileSync(logFilePath, `Failed to unfollow: ${errorCount}\n`);
    
    // Send success response
    res.json({
      success: true,
      message: `İşlem tamamlandı! ${successCount} kişi takipten çıkarıldı.`,
      logFile: path.basename(logFilePath)
    });
    
  } catch (error) {
    // Log error
    fs.appendFileSync(logFilePath, `Error: ${error.message}\n`);
    
    // Send error response
    res.status(500).json({
      success: false,
      message: `Hata oluştu: ${error.message}`,
      logFile: path.basename(logFilePath)
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
