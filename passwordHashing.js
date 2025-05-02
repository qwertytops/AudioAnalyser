const crypto = require('crypto');

/**
 * Hash a password using PBKDF2
 * @param {string} password - The password to hash
 * @param {number} iterations - Number of iterations (defaults to 310000)
 * @param {number} keylen - Length of the derived key in bytes (defaults to 32)
 * @param {string} digest - Hash digest algorithm (defaults to 'sha256')
 * @returns {Promise<string>} - The hashed password in format: iterations:salt:hash
 */
function hashPassword(password, iterations = 310000, keylen = 32, digest = 'sha256') {
  return new Promise((resolve, reject) => {
    try {
      // Generate a random salt
      const salt = crypto.randomBytes(16).toString('hex');
      
      // Use PBKDF2 to hash the password
      crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
        if (err) reject(err);
        
        // Format: iterations:salt:hash
        const hash = derivedKey.toString('hex');
        const combined = `${iterations}:${salt}:${hash}`;
        resolve(combined);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Verify a password against a hash
 * @param {string} password - The password to verify
 * @param {string} storedHash - The stored hash in format: iterations:salt:hash
 * @returns {Promise<boolean>} - True if the password matches, false otherwise
 */
function verifyPassword(password, storedHash) {
  return new Promise((resolve, reject) => {
    try {
      // Extract the parameters from the stored hash
      const [iterations, salt, hash] = storedHash.split(':');
      const iterCount = parseInt(iterations, 10);
      
      // Hash the input password with the same parameters
      crypto.pbkdf2(password, salt, iterCount, hash.length / 2, 'sha256', (err, derivedKey) => {
        if (err) reject(err);
        
        const newHash = derivedKey.toString('hex');
        resolve(newHash === hash);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Example usage:
async function example() {
  try {
    // Hash a password
    const password = 'MySecurePassword123!';
    const hashedPassword = await hashPassword(password);
    console.log('Hashed password:', hashedPassword);
    
    // Verify the password
    const isMatch = await verifyPassword(password, hashedPassword);
    console.log('Password match:', isMatch); // Should be true
    
    // Verify an incorrect password
    const wrongMatch = await verifyPassword('WrongPassword', hashedPassword);
    console.log('Wrong password match:', wrongMatch); // Should be false
  } catch (error) {
    console.error('Error:', error);
  }
}

// Uncomment to run the example
// example();

module.exports = {
  hashPassword,
  verifyPassword
};
