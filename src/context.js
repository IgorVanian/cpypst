import { createContext } from "react";
export const UserContext = createContext({ user: null, setUser: () => {} });
export const FirebaseContext = createContext({ 
  destroyRemoteClipboard: () => {},
});
