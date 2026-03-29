#!/usr/bin/env node
/**
 * User Management CLI Tool
 *
 * Admin-only CLI for creating and managing user accounts.
 * This is NOT an HTTP endpoint - it's a command-line tool.
 *
 * Usage:
 *   node api/seed-user.mjs add <username> <display_name> <password> [--admin]
 *   node api/seed-user.mjs list
 *   node api/seed-user.mjs toggle <username>
 *   node api/seed-user.mjs reset-password <username> <new_password>
 */

import pool from './db.mjs';

// Password requirements
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;

/**
 * Validate password strength
 */
function validatePassword(password) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must contain at least one letter and one number';
  }
  return null;
}

/**
 * Hash password using bcrypt
 */
async function hashPassword(password) {
  // Using dynamic import for bcryptjs (ESM)
  const bcrypt = await import('bcryptjs');
  return bcrypt.default.hash(password, 12);
}

/**
 * Add a new user
 */
async function addUser(username, displayName, password, isAdmin = false) {
  // Validate password
  const passwordError = validatePassword(password);
  if (passwordError) {
    console.error(`Password validation failed: ${passwordError}`);
    process.exit(1);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  try {
    const result = await pool.query(
      `INSERT INTO auth.users (username, display_name, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           updated_at = CURRENT_TIMESTAMP
       RETURNING id, username, display_name, role, active, created_at`,
      [username, displayName, passwordHash, isAdmin ? 'admin' : 'user']
    );

    const user = result.rows[0];
    const isNew = !user.created_at; // Note: updated timestamp on conflict

    console.log(`${isNew ? 'Created' : 'Updated'} user:`);
    console.log(`  ID:          ${user.id}`);
    console.log(`  Username:    ${user.username}`);
    console.log(`  Display:     ${user.display_name}`);
    console.log(`  Role:        ${user.role}`);
    console.log(`  Active:      ${user.active ? 'Yes' : 'No'}`);
  } catch (err) {
    console.error('Failed to add user:', err.message);
    process.exit(1);
  }
}

/**
 * List all users
 */
async function listUsers() {
  try {
    const result = await pool.query(
      `SELECT id, username, display_name, role, active, created_at
       FROM auth.users
       ORDER BY id`
    );

    if (result.rows.length === 0) {
      console.log('No users found.');
      return;
    }

    console.log('\nUsers:');
    console.log('─'.repeat(80));
    console.log(sprintf('%-5s %-15s %-20s %-8s %-8s %-20s', 'ID', 'Username', 'Display', 'Role', 'Active', 'Created'));
    console.log('─'.repeat(80));

    for (const user of result.rows) {
      console.log(sprintf(
        '%-5d %-15s %-20s %-8s %-8s %-20s',
        user.id,
        user.username,
        user.display_name,
        user.role,
        user.active ? 'Yes' : 'No',
        user.created_at.toISOString().split('T')[0]
      ));
    }
    console.log('─'.repeat(80));
  } catch (err) {
    console.error('Failed to list users:', err.message);
    process.exit(1);
  }
}

/**
 * Toggle user active status
 */
async function toggleUser(username) {
  try {
    const result = await pool.query(
      `UPDATE auth.users
       SET active = NOT active, updated_at = CURRENT_TIMESTAMP
       WHERE username = $1
       RETURNING id, username, display_name, active`,
      [username]
    );

    if (result.rows.length === 0) {
      console.error(`User '${username}' not found.`);
      process.exit(1);
    }

    const user = result.rows[0];
    console.log(`User '${user.username}' is now ${user.active ? 'ACTIVE' : 'INACTIVE'}.`);
  } catch (err) {
    console.error('Failed to toggle user:', err.message);
    process.exit(1);
  }
}

/**
 * Reset user password
 */
async function resetPassword(username, newPassword) {
  // Validate password
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    console.error(`Password validation failed: ${passwordError}`);
    process.exit(1);
  }

  // Hash password
  const passwordHash = await hashPassword(newPassword);

  try {
    const result = await pool.query(
      `UPDATE auth.users
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE username = $2
       RETURNING id, username, display_name`,
      [passwordHash, username]
    );

    if (result.rows.length === 0) {
      console.error(`User '${username}' not found.`);
      process.exit(1);
    }

    const user = result.rows[0];
    console.log(`Password reset for user '${user.username}' (${user.display_name}).`);
  } catch (err) {
    console.error('Failed to reset password:', err.message);
    process.exit(1);
  }
}

/**
 * Simple sprintf-like function for formatting output
 */
function sprintf(format, ...args) {
  return format.replace(/%[-+0-9]*[sd]/g, (match) => {
    const arg = args.shift();
    if (match.includes('s')) return String(arg);
    if (match.includes('d')) return String(arg);
    return '';
  });
}

/**
 * Show usage
 */
function showUsage() {
  console.log('User Management CLI Tool');
  console.log('');
  console.log('Usage:');
  console.log('  node api/seed-user.mjs add <username> <display_name> <password> [--admin]');
  console.log('  node api/seed-user.mjs list');
  console.log('  node api/seed-user.mjs toggle <username>');
  console.log('  node api/seed-user.mjs reset-password <username> <new_password>');
  console.log('');
  console.log('Password requirements:');
  console.log(`  - At least ${MIN_PASSWORD_LENGTH} characters`);
  console.log('  - At least one letter and one number');
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showUsage();
    process.exit(0);
  }

  const command = args[0];

  try {
    switch (command) {
      case 'add': {
        if (args.length < 4) {
          console.error('Usage: add <username> <display_name> <password> [--admin]');
          process.exit(1);
        }
        const username = args[1];
        const displayName = args[2];
        const password = args[3];
        const isAdmin = args.includes('--admin');
        await addUser(username, displayName, password, isAdmin);
        break;
      }

      case 'list':
        await listUsers();
        break;

      case 'toggle': {
        if (args.length < 2) {
          console.error('Usage: toggle <username>');
          process.exit(1);
        }
        await toggleUser(args[1]);
        break;
      }

      case 'reset-password': {
        if (args.length < 3) {
          console.error('Usage: reset-password <username> <new_password>');
          process.exit(1);
        }
        await resetPassword(args[1], args[2]);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        showUsage();
        process.exit(1);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

main();
