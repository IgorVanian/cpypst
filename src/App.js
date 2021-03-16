import { useState, useEffect, useContext } from 'react';
import './App.css';
import {
  BrowserRouter,
  Switch,
  Route,
  useParams
} from "react-router-dom";    
import firebase from './services/firebase';
import { SignInWithGoogle } from './Login';
import { customAlphabet } from 'nanoid'
import { UserContext } from './context';

const generateHash = () => customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_', 6)();

function App() {
  const [user, setUser] = useState(null);
  const [db] = useState(firebase.firestore());

  const Clipboard = () => {
    const { clipboardId } = useParams();
    const [clipboard, setClipboard] = useState();
    const [noMatch, setNoMatch] = useState();
    const [isDestroyed, setIsDestroyed] = useState(false);
    
    const getClipboard = async (clipboardId) => {
      console.log('>>> fetching clipboardId', clipboardId)
      const snapshot = await db.collection("clipboards").where('clipboardId', '==', clipboardId).get();
      if (snapshot.empty) {
        console.log('No matching documents.', '=>', clipboardId);
        setNoMatch(true);
        return;
      }
      snapshot.forEach(doc => setClipboard(doc.data()));
    }

    const destroyRemoteClipboard = async () => {
      console.log('>>> destroying remote clipboard', clipboardId);
      const snapshot = await db.collection("clipboards").where('clipboardId', '==', clipboardId).get();
      if(snapshot) {
        snapshot.forEach(function(doc) {
          doc.ref.delete().then(() => {
            console.log('>>> clipboard deleted');
            setIsDestroyed(true);
          });
        });
      }
    }

    useEffect(() => {
      getClipboard(clipboardId);
    }, [clipboardId]);

    useEffect(() => {
      if(clipboard && !clipboard.keepAlive) destroyRemoteClipboard();
    }, [clipboard]);

    return (
      <div className="clipboardForm">
        {
          noMatch &&
          <p>No clipboard found.</p>
        }
        {
          clipboard &&
          <p className="clipboardUrl">{clipboard.text}</p>
        }
        {
          isDestroyed &&
          <p>This clipboard was successfully destroyed. You cannot access to it anymore.</p>
        }
      </div>
    )
  }

  const User = () => {
    const { user } = useContext(UserContext);
    console.log(user)
    if(user) {
      return (
        <div>
          <p>Hello {user.displayName}.</p>
        </div>
      )
    }
    return null;
  }

  const Form = () => {
    const [text, setText] = useState();
    const [url, setUrl] = useState();
    const [keepAlive, setKeepAlive] = useState(false);

    const { user } = useContext(UserContext);

    const publishClipboard = (clipboard) => {
      db.collection("clipboards").add(clipboard).then(() => {
        setUrl(`https://cpypst.io/${clipboard.clipboardId}`);
      }).catch(e => console.log(">>> error publishing clipboard", e))
    };

    const formSubmit = (e) => {
      e.preventDefault();
      const clipboard = {
        text,
        clipboardId: generateHash()
      }

      if(user) clipboard.userId = user.uid;
      if(keepAlive) clipboard.keepAlive = keepAlive;

      publishClipboard(clipboard);
    }

    return (
      <div className="clipboardForm">
        <form onSubmit={formSubmit}>
          <input
            className="input"
            autoFocus={true}
            type="text"
            name="test"
            placeholder="Text to save"
            required
            onChange={({ target }) => setText(target.value)}
          />
          {
            user &&
            <label>
              Don't destroy after read
              <input 
                type="checkbox" 
                name="keepAlive" 
                id="keepAlive"
                checked={keepAlive}
                onChange={({ target }) => setKeepAlive(target.checked)}
              />
            </label>
          }
          <button type="submit">Submit</button>
        </form>

        {
          url &&
          <p className="clipboardUrl">Your clipboard is available at <a href={url}>{url}</a></p>
        }
        
        {
          !keepAlive &&
          <p className="warning">Your clipboard will be automatically destroyed on first read.</p>
        }

        <SignInWithGoogle />
        <User />
      </div>
    )
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <BrowserRouter>
        <div className="App">
          <Switch>
            <Route exact path="/">
              <Form />
            </Route>
            <Route path="/:clipboardId">
              <Clipboard />
            </Route>
          </Switch>
        </div>
      </BrowserRouter>
    </UserContext.Provider>
  );
}

export default App;
