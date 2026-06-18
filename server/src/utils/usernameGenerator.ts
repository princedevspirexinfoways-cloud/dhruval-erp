import User from '../models/User';

/**
 * Generate a unique username based on first name and numbers
 * If email exists, use email prefix as fallback
 */
export async function generateUniqueUsername(firstName: string, email?: string): Promise<string> {
  // Clean the first name - remove special characters and convert to lowercase
  const cleanFirstName = firstName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .substring(0, 10); // Limit to 10 characters

  // If email exists, try using email prefix first
  if (email) {
    const emailPrefix = email.split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10);
    
    if (emailPrefix && emailPrefix.length >= 3) {
      const emailUsername = await findUniqueUsername(emailPrefix);
      if (emailUsername) {
        return emailUsername;
      }
    }
  }

  // Fallback to first name based username
  if (cleanFirstName && cleanFirstName.length >= 2) {
    return await findUniqueUsername(cleanFirstName);
  }

  // If first name is too short, use a generic prefix
  return await findUniqueUsername('user');
}

/**
 * Find a unique username by appending numbers
 */
async function findUniqueUsername(baseUsername: string): Promise<string> {
  let username = baseUsername;
  let counter = 1;

  while (true) {
    // Check if username exists
    const existingUser = await User.findOne({ username });
    
    if (!existingUser) {
      return username;
    }

    // Try with counter
    username = `${baseUsername}${counter}`;
    counter++;

    // Prevent infinite loop - max 9999 attempts
    if (counter > 9999) {
      // Use timestamp as fallback
      username = `${baseUsername}${Date.now().toString().slice(-4)}`;
      const finalCheck = await User.findOne({ username });
      if (!finalCheck) {
        return username;
      }
      // If even timestamp fails, use random
      username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
      break;
    }
  }

  return username;
}

/**
 * Generate username suggestions for display
 */
export function generateUsernameSuggestions(firstName: string, email?: string): string[] {
  const suggestions: string[] = [];
  
  // Clean first name
  const cleanFirstName = firstName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10);

  // Add first name based suggestions
  if (cleanFirstName && cleanFirstName.length >= 2) {
    suggestions.push(cleanFirstName);
    suggestions.push(`${cleanFirstName}1`);
    suggestions.push(`${cleanFirstName}2`);
  }

  // Add email based suggestions if available
  if (email) {
    const emailPrefix = email.split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10);
    
    if (emailPrefix && emailPrefix.length >= 3) {
      suggestions.push(emailPrefix);
      suggestions.push(`${emailPrefix}1`);
    }
  }

  // Remove duplicates and limit to 5 suggestions
  return [...new Set(suggestions)].slice(0, 5);
}
