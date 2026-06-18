const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runSeeder(seederName) {
  return new Promise((resolve, reject) => {
    const seederPath = path.join(__dirname, `${seederName}.js`);
    
    colorLog(`\n🚀 Running ${seederName}...`, 'cyan');
    
    const child = spawn('node', [seederPath], {
      stdio: 'inherit',
      cwd: path.dirname(__dirname)
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        colorLog(`✅ ${seederName} completed successfully!`, 'green');
        resolve();
      } else {
        colorLog(`❌ ${seederName} failed with code ${code}`, 'red');
        reject(new Error(`${seederName} failed`));
      }
    });
    
    child.on('error', (error) => {
      colorLog(`❌ Error running ${seederName}: ${error.message}`, 'red');
      reject(error);
    });
  });
}

async function runAllSeeders() {
  try {
    colorLog('🌱 Starting All Seeders...', 'bright');
    colorLog('=' .repeat(50), 'yellow');
    
    const seeders = [
      'vehicleSeeder',
      'hospitalitySeeder'
    ];
    
    for (const seeder of seeders) {
      await runSeeder(seeder);
    }
    
    colorLog('\n' + '=' .repeat(50), 'yellow');
    colorLog('🎉 All seeders completed successfully!', 'green');
    colorLog('📊 Summary:', 'bright');
    colorLog('   • Vehicle data refreshed', 'green');
    colorLog('   • Customer visit data refreshed', 'green');
    colorLog('   • Ready for testing!', 'green');
    
  } catch (error) {
    colorLog('\n' + '=' .repeat(50), 'yellow');
    colorLog('❌ Seeding process failed!', 'red');
    colorLog(`Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run all seeders
runAllSeeders();
