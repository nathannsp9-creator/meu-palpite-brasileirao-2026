import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Profile, AppRole } from '@/types/firebase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: AppRole;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, nome: string, nickname: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>('user');
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';

  const fetchProfile = async (userId: string) => {
    try {
      const profileRef = doc(db, 'profiles', userId);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data();
        setProfile({
          id: profileSnap.id,
          nome: data.nome,
          nickname: data.nickname,
          email: data.email,
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
        } as Profile);
      }

      const roleRef = doc(db, 'user_roles', userId);
      const roleSnap = await getDoc(roleRef);

      if (roleSnap.exists()) {
        setRole(roleSnap.data().role as AppRole);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        await fetchProfile(user.uid);
      } else {
        setProfile(null);
        setRole('user');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    nome: string,
    nickname: string
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update Firebase Auth display name
      await firebaseUpdateProfile(user, { displayName: nome });

      // Create profile document
      await setDoc(doc(db, 'profiles', user.uid), {
        id: user.uid,
        nome,
        nickname,
        email,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // Create user role document (default: user)
      await setDoc(doc(db, 'user_roles', user.uid), {
        id: user.uid,
        user_id: user.uid,
        role: 'user',
        created_at: serverTimestamp(),
      });

      // Sign out immediately to force login
      await firebaseSignOut(auth);

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await fetchProfile(userCredential.user.uid);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
      setRole('user');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, {
        ...data,
        updated_at: serverTimestamp(),
      });

      // Update local state
      if (profile) {
        setProfile({ ...profile, ...data });
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const value = {
    user,
    profile,
    role,
    isAdmin,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
