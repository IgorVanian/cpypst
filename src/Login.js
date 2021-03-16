import firebase from 'firebase';
import { useEffect, useContext } from 'react';
import { UserContext } from './context';

const onAuthStateChange = (callback) => {
  return firebase.auth().onAuthStateChanged(user => {
    if (user) {
      callback(user)
    } else {
      callback(null)
    }
  });
}

export const SignInWithGoogle = () => {
  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(setUser);
    return () => {
      unsubscribe();
    };
  });

  const signInWithGoogle = async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      await firebase.auth().signInWithPopup(provider);
    } catch(e) {
      console.error('>>> signInWithGoogle error', e);
    }
  }

  const signOut = async () => {
    try {
      await firebase.auth().signOut();
    } catch(e) {
      console.error('>>> SignOut error', e);
    }
  }

  return (
    <div>
      {
        user ?
        <button className="singin-button" onClick={signOut}>Sign out</button> :
        <button className="singin-button" onClick={signInWithGoogle}>Sign In with Google</button>
      }
      </div>
  )
}