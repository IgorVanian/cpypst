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
import { FaRegCopy, FaTimesCircle } from 'react-icons/fa';

const generateHash = () => customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_', 6)();

function App() {
  const [user, setUser] = useState(null);
  const [db] = useState(firebase.firestore());
  
  const destroyRemoteClipboard = async (clipboardId, callback = () => {}) => {
    console.log('>>> destroying remote clipboard', clipboardId);
    const snapshot = await db.collection("clipboards").where('clipboardId', '==', clipboardId).get();
    if(snapshot) {
      snapshot.forEach(function(doc) {
        doc.ref.delete().then(() => {
          console.log('>>> clipboard deleted');
          callback();
        });
      });
    }
  }

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

    useEffect(() => {
      getClipboard(clipboardId);
    }, [clipboardId]);

    useEffect(() => {
      if(clipboard && !clipboard.keepAlive) destroyRemoteClipboard(clipboardId, () => setIsDestroyed(true));
    }, [clipboard]);

    return (
      <div className="main">
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
    if(user) {
      return (
        <div>
          <p>Hello {user.displayName}.</p>
        </div>
      )
    }
    return null;
  }

  const CopyToolTip = ({ visible }) => {
    console.log('>>> CopyToolTip visible', visible)
    return (
      <span 
        style={{
          opacity: visible ? 1 : 0,
          visibility: visible ? "visible" : "hidden"
        }} className="tooltiptext">Copied!</span>
    )
  }
  
  const MyClipboads = () => {
    const { user } = useContext(UserContext);
    const [clipboards, setClipboards] = useState([]);
    const [clipboardCopied, setClipboardCopied] = useState(null);
    
    const fetchUserClipboards = async () => {
      const _clipboards = [];
      try {
        const snapshot = await db.collection("clipboards")
          .where('keepAlive', '==', true)
          .where('userId', '==', user.uid).get();
        if (snapshot.empty) {
          return setClipboards(_clipboards);
        }
        snapshot.forEach(doc => _clipboards.push(doc.data()));
        setClipboards(_clipboards);
      } catch (e) {
        console.error(e);
      }
    }
    
    useEffect(() => {
      if(user) fetchUserClipboards();
    }, [user])

    useEffect(() => {
      if(clipboardCopied) {
        setTimeout(() => {
          setClipboardCopied(null)
        }, 1000)
      } else {
      }
    }, [clipboardCopied])
    
    console.log(clipboards)
    if(user) {
      return (
        <div className="userClipboards-container">
          My clipboards
          <ul className="userClipboards">
            {
              clipboards.map(({text, clipboardId}) => 
                <li className="clipboard-item">
                  <div className="clipboard-item-controls">
                    <button 
                      className="clipboard-destroy"
                      onClick={() => {
                        if (window.confirm("Do you really want to destroy this clipboard?")) {
                          destroyRemoteClipboard(clipboardId, fetchUserClipboards);
                        }
                      }}
                    >
                      <FaTimesCircle color="red" />
                    </button>
                    <button 
                      className="clipboard-copy"
                      onClick={() => {
                        navigator.clipboard.writeText(text)
                        setClipboardCopied(clipboardId);
                      }}
                    >
                      <CopyToolTip visible={clipboardCopied == clipboardId} />
                      <FaRegCopy />
                    </button>
                  </div>
                  <p className="clipboard-item-text">
                    {text}
                  </p>
                </li>
              )
            }
          </ul>
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
      <div className="main">
        <SignInWithGoogle />
        <User />
        <form onSubmit={formSubmit}>
          <input
            className="input"
            autoFocus={true}
            maxLength={80}
            type="text"
            name="test"
            placeholder="Text to save"
            required
            onChange={({ target }) => setText(target.value)}
          />
          {
            user &&
            <div className="keepAlive-checkbox-container">
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
            </div>
          }
          <button type="submit">Submit</button>
          {
            url &&
            <p className="clipboardUrl">Your clipboard is available at <a href={url}>{url}</a></p>
          }
          {
            keepAlive ? 
            <p className="keepAlive-notice">Visit this page on any device and sign-in to retrieve your saved clipboards.</p> :
            <p className="warning">Your clipboard will be automatically destroyed on first read.</p>
          }
        </form>
        <MyClipboads />
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
