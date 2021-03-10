import { useState, useEffect } from 'react';
import './App.css';
import {
  BrowserRouter,
  Switch,
  Route,
  useParams
} from "react-router-dom";    
import firebase from './services/firebase';

import { customAlphabet } from 'nanoid'

const generateHash = () => customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_', 6)();

function App() {

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
      if(clipboard) destroyRemoteClipboard();
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

  const Form = () => {
    const [text, setText] = useState();
    const [url, setUrl] = useState();

    const publishClipboard = (clipboard) => {
      db.collection("clipboards").add(clipboard).then(() => {
        setUrl(`https://cmd-c.me/${clipboard.clipboardId}`);
      }).catch(e => console.log(">>> error publishing clipboard", e))
    };

    const formSubmit = (e) => {
      e.preventDefault();
      publishClipboard({
        text,
        clipboardId: generateHash()
      });
    }

    return (
      <div className="clipboardForm">
        <form onSubmit={formSubmit}>
          <input
            className="input"
            autoFocus="true"
            type="text"
            name="test"
            placeholder="Text to save"
            required
            onChange={({ target }) => setText(target.value)}
          />
          <button type="submit">Submit</button>
        </form>

        {
          url &&
          <p className="clipboardUrl">Your clipboard is available at <a href={url}>{url}</a></p>
        }
        
        <p className="warning">Your clipboard will be automatically destroyed on first read.</p>
      </div>
    )
  }

  return (
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
  );
}

export default App;
