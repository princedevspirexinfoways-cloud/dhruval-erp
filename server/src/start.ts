#!/usr/bin/env node

/**
 * Production startup script with proper path resolution
 */

// Set up module aliases for production
import * as moduleAlias from 'module-alias';
import * as path from 'path';

// Register aliases
moduleAlias.addAliases({
  '@': path.join(__dirname),
  '@/config': path.join(__dirname, 'config'),
  '@/controllers': path.join(__dirname, 'controllers'),
  '@/middleware': path.join(__dirname, 'middleware'),
  '@/models': path.join(__dirname, 'models'),
  '@/routes': path.join(__dirname, 'routes'),
  '@/services': path.join(__dirname, 'services'),
  '@/utils': path.join(__dirname, 'utils'),
  '@/types': path.join(__dirname, 'types'),
  '@/validators': path.join(__dirname, 'validators')
});

// Load local environment variables
import { config } from '@dotenvx/dotenvx';
config({ path: '.env.local' });

// Import and start the server
import './server';
