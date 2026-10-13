import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from '@/services/firebase';

// Who is signed in, shared by Home (avatar) and Profile so both show the same
// name: the display name saved in Firestore if there is one, else what
// Firebase Auth knows, else the part of the email before the @.
export function useProfile() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [saved, setSaved] = useState<{ uid: string; displayName: string } | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid))
      .then((snapshot) => {
        const name = snapshot.data()?.displayName;
        if (typeof name === 'string' && name.trim()) setSaved({ uid: user.uid, displayName: name });
      })
      .catch(() => {});
  }, [user]);

  const displayName =
    saved?.uid === user?.uid
      ? saved?.displayName ?? 'Rihla member'
      : user?.displayName || user?.email?.split('@')[0] || 'Rihla member';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'R';
  const created = user?.metadata.creationTime ? new Date(user.metadata.creationTime) : null;
  const memberSince = created ? created.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null;

  return { user, displayName, initial, memberSince };
}
