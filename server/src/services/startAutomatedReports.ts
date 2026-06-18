import { CronJobScheduler, CronJobConfig } from './CronJobScheduler';
import { automatedReportsConfig } from '../config/automatedReports';

/**
 * Start the automated reporting system
 */
export async function startAutomatedReports(): Promise<void> {
  try {
    console.log('🚀 Initializing Automated Reporting System...');

    // Create cron job configuration
    const cronConfig: CronJobConfig = {
      emailConfig: automatedReportsConfig.email,
      reportConfig: {
        dailyTime: automatedReportsConfig.reports.dailyTime,
        weeklyTime: automatedReportsConfig.reports.weeklyTime,
        monthlyTime: automatedReportsConfig.reports.monthlyTime,
        recipients: automatedReportsConfig.reports.recipients,
        formats: automatedReportsConfig.reports.formats
      }
    };

    // Create and start cron job scheduler
    const cronScheduler = new CronJobScheduler(cronConfig);
    
    // Start all cron jobs
    cronScheduler.start();

    // Store scheduler instance globally for access
    (global as any).cronScheduler = cronScheduler;

    console.log('✅ Automated Reporting System started successfully');
    console.log(`📅 Daily reports scheduled for: ${automatedReportsConfig.reports.dailyTime} IST`);
    console.log(`📅 Weekly reports scheduled for: Monday ${automatedReportsConfig.reports.weeklyTime} IST`);
    console.log(`📅 Monthly reports scheduled for: 1st of month ${automatedReportsConfig.reports.monthlyTime} IST`);
    console.log(`📧 Reports will be sent to: ${automatedReportsConfig.reports.recipients.daily.join(', ')}`);

    // Log configuration
    logConfiguration();

  } catch (error) {
    console.error('❌ Failed to start Automated Reporting System:', error);
    throw error;
  }
}

/**
 * Stop the automated reporting system
 */
export async function stopAutomatedReports(): Promise<void> {
  try {
    console.log('🛑 Stopping Automated Reporting System...');

    const cronScheduler = (global as any).cronScheduler;
    if (cronScheduler) {
      cronScheduler.stop();
      delete (global as any).cronScheduler;
    }

    console.log('✅ Automated Reporting System stopped successfully');
  } catch (error) {
    console.error('❌ Error stopping Automated Reporting System:', error);
    throw error;
  }
}

/**
 * Get the status of automated reporting system
 */
export function getAutomatedReportsStatus(): any {
  try {
    const cronScheduler = (global as any).cronScheduler;
    if (cronScheduler) {
      return cronScheduler.getStatus();
    }
    return { isRunning: false, tasks: [] };
  } catch (error) {
    console.error('Error getting automated reports status:', error);
    return { isRunning: false, tasks: [], error: error.message };
  }
}

/**
 * Manually trigger a report generation
 */
export async function triggerManualReport(
  companyId: string, 
  reportType: 'daily' | 'weekly' | 'monthly'
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🚀 Manually triggering ${reportType} report for company: ${companyId}`);

    const cronScheduler = (global as any).cronScheduler;
    if (!cronScheduler) {
      throw new Error('Automated reporting system is not running');
    }

    await cronScheduler.manualTrigger(companyId, reportType);

    return {
      success: true,
      message: `${reportType} report generated and sent successfully`
    };

  } catch (error) {
    console.error(`Error triggering manual ${reportType} report:`, error);
    return {
      success: false,
      message: `Failed to generate ${reportType} report: ${error.message}`
    };
  }
}

/**
 * Log the current configuration
 */
function logConfiguration(): void {
  console.log('\n📋 Automated Reporting Configuration:');
  console.log('=====================================');
  
  // Email Configuration
  console.log('📧 Email Configuration:');
  console.log(`   Host: ${automatedReportsConfig.email.host}`);
  console.log(`   Port: ${automatedReportsConfig.email.port}`);
  console.log(`   Secure: ${automatedReportsConfig.email.secure}`);
  console.log(`   User: ${automatedReportsConfig.email.auth.user}`);
  
  // Report Configuration
  console.log('\n📊 Report Configuration:');
  console.log(`   Daily Time: ${automatedReportsConfig.reports.dailyTime} IST`);
  console.log(`   Weekly Time: Monday ${automatedReportsConfig.reports.weeklyTime} IST`);
  console.log(`   Monthly Time: 1st of month ${automatedReportsConfig.reports.monthlyTime} IST`);
  console.log(`   Formats: ${automatedReportsConfig.reports.formats.join(', ')}`);
  console.log(`   Retention: ${automatedReportsConfig.reports.retentionDays} days`);
  console.log(`   Cleanup: ${automatedReportsConfig.reports.cleanupAfterMinutes} minutes`);
  
  // Recipients
  console.log('\n👥 Report Recipients:');
  console.log(`   Daily: ${automatedReportsConfig.reports.recipients.daily.join(', ')}`);
  console.log(`   Weekly: ${automatedReportsConfig.reports.recipients.weekly.join(', ')}`);
  console.log(`   Monthly: ${automatedReportsConfig.reports.recipients.monthly.join(', ')}`);
  
  // Database Configuration
  console.log('\n💾 Database Configuration:');
  console.log(`   Store Report Data: ${automatedReportsConfig.database.storeReportData}`);
  console.log(`   Store File Metadata: ${automatedReportsConfig.database.storeFileMetadata}`);
  console.log(`   Archive Old Reports: ${automatedReportsConfig.database.archiveOldReports}`);
  console.log(`   Archive After: ${automatedReportsConfig.database.archiveAfterDays} days`);
  
  // Export Configuration
  console.log('\n📁 Export Configuration:');
  console.log(`   Directory: ${automatedReportsConfig.export.directory}`);
  console.log(`   Max File Size: ${automatedReportsConfig.export.maxFileSize} MB`);
  console.log(`   Compress Large Files: ${automatedReportsConfig.export.compressLargeFiles}`);
  console.log(`   Compression Threshold: ${automatedReportsConfig.export.compressionThreshold} MB`);
  
  // Performance Configuration
  console.log('\n⚡ Performance Configuration:');
  console.log(`   Max Concurrent Reports: ${automatedReportsConfig.performance.maxConcurrentReports}`);
  console.log(`   Generation Timeout: ${automatedReportsConfig.performance.generationTimeout} minutes`);
  console.log(`   Enable Caching: ${automatedReportsConfig.performance.enableCaching}`);
  console.log(`   Cache TTL: ${automatedReportsConfig.performance.cacheTTL} minutes`);
  
  // Security Configuration
  console.log('\n🔒 Security Configuration:');
  console.log(`   Encrypt Sensitive Data: ${automatedReportsConfig.security.encryptSensitiveData}`);
  console.log(`   Add Watermark: ${automatedReportsConfig.security.addWatermark}`);
  console.log(`   Password Protect Large Reports: ${automatedReportsConfig.security.passwordProtectLargeReports}`);
  
  // Customization Configuration
  console.log('\n🎨 Customization Configuration:');
  console.log(`   Include Company Logo: ${automatedReportsConfig.customization.includeCompanyLogo}`);
  console.log(`   Logo Path: ${automatedReportsConfig.customization.logoPath}`);
  console.log(`   Default Language: ${automatedReportsConfig.customization.defaultLanguage}`);
  console.log(`   Supported Languages: ${automatedReportsConfig.customization.supportedLanguages.join(', ')}`);
  
  console.log('=====================================\n');
}

/**
 * Health check for automated reporting system
 */
export function automatedReportsHealthCheck(): {
  status: 'healthy' | 'unhealthy';
  message: string;
  details: any;
} {
  try {
    const cronScheduler = (global as any).cronScheduler;
    
    if (!cronScheduler) {
      return {
        status: 'unhealthy',
        message: 'Automated reporting system is not running',
        details: { isRunning: false }
      };
    }

    const status = cronScheduler.getStatus();
    
    if (status.isRunning && status.tasks.length > 0) {
      return {
        status: 'healthy',
        message: 'Automated reporting system is running normally',
        details: {
          isRunning: status.isRunning,
          activeTasks: status.tasks.length,
          configuration: {
            dailyTime: automatedReportsConfig.reports.dailyTime,
            weeklyTime: automatedReportsConfig.reports.weeklyTime,
            monthlyTime: automatedReportsConfig.reports.monthlyTime,
            formats: automatedReportsConfig.reports.formats,
            recipients: automatedReportsConfig.reports.recipients
          }
        }
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'Automated reporting system is not properly configured',
        details: status
      };
    }

  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Error checking automated reporting system health',
      details: { error: error.message }
    };
  }
}

export default {
  startAutomatedReports,
  stopAutomatedReports,
  getAutomatedReportsStatus,
  triggerManualReport,
  automatedReportsHealthCheck
};
