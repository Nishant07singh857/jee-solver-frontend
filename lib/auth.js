// lib/auth.js
import { auth, isFirebaseInitialized } from './firebase';

export class AuthService {
  static async register(email, password, fullName) {
    console.log('🔐 Registration attempt:', { email, fullName });
    
    try {
      // Use dynamic imports to avoid Firebase errors during build
      const firebaseAuth = await import('firebase/auth');
      
      const userCredential = await firebaseAuth.createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with full name
      await firebaseAuth.updateProfile(user, {
        displayName: fullName
      });

      // Send email verification
      await firebaseAuth.sendEmailVerification(user);

      console.log('✅ Registration successful for:', email);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: fullName,
          emailVerified: user.emailVerified
        },
        message: 'Registration successful! Please check your email for verification.'
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw this.handleAuthError(error);
    }
  }

  static async login(email, password) {
    console.log('🔐 Login attempt:', email);
    
    try {
      const firebaseAuth = await import('firebase/auth');
      
      const userCredential = await firebaseAuth.signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        await auth.signOut();
        throw new Error('EMAIL_NOT_VERIFIED');
      }

      console.log('✅ Login successful for:', email);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        }
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw this.handleAuthError(error);
    }
  }

  static async resendVerificationEmail() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const firebaseAuth = await import('firebase/auth');
      await firebaseAuth.sendEmailVerification(user);
      
      return {
        success: true,
        message: 'Verification email sent successfully!'
      };
    } catch (error) {
      console.error('❌ Resend verification error:', error);
      throw this.handleAuthError(error);
    }
  }

  static async resetPassword(email) {
    try {
      const firebaseAuth = await import('firebase/auth');
      await firebaseAuth.sendPasswordResetEmail(auth, email);
      
      return {
        success: true,
        message: 'Password reset email sent successfully!'
      };
    } catch (error) {
      console.error('❌ Password reset error:', error);
      throw this.handleAuthError(error);
    }
  }

  static handleAuthError(error) {
    const errorCode = error.code;
    const errorMessage = error.message;

    console.log('🔐 Auth error details:', { errorCode, errorMessage });

    switch (errorCode) {
      case 'auth/invalid-email':
        return new Error('Invalid email address format.');
      case 'auth/user-disabled':
        return new Error('This account has been disabled.');
      case 'auth/user-not-found':
        return new Error('No account found with this email.');
      case 'auth/wrong-password':
        return new Error('Incorrect password.');
      case 'auth/email-already-in-use':
        return new Error('An account with this email already exists.');
      case 'auth/weak-password':
        return new Error('Password should be at least 6 characters.');
      case 'auth/network-request-failed':
        return new Error('Network error. Please check your connection.');
      case 'auth/too-many-requests':
        return new Error('Too many attempts. Please try again later.');
      case 'EMAIL_NOT_VERIFIED':
        return new Error('Please verify your email before logging in. Check your inbox for the verification link.');
      default:
        return new Error(errorMessage || 'Authentication failed. Please try again.');
    }
  }

  static getCurrentUser() {
    return auth.currentUser;
  }

  static async logout() {
    try {
      await auth.signOut();
      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw new Error('Logout failed. Please try again.');
    }
  }
}

export default AuthService;