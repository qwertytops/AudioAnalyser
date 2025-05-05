"""
Secure password hashing utility functions using Werkzeug's security module
"""

from werkzeug.security import generate_password_hash, check_password_hash


def hash_password(password, method='pbkdf2:sha256', salt_length=16):
    """
    Hash a password using Werkzeug's generate_password_hash function
    
    Args:
        password (str): The password to hash
        method (str): The hashing method to use
                     ('pbkdf2:sha256', 'pbkdf2:sha1', 'pbkdf2:sha512', 'scrypt')
        salt_length (int): Length of the salt
        
    Returns:
        str: The hashed password with salt and method info
    """
    return generate_password_hash(password, method=method, salt_length=salt_length)


def verify_password(password, password_hash):
    """
    Verify a password against a hash using Werkzeug's check_password_hash function
    
    Args:
        password (str): The password to verify
        password_hash (str): The stored hash to check against
        
    Returns:
        bool: True if the password matches, False otherwise
    """
    return check_password_hash(password_hash, password)
