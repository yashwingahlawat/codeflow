import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
// to enable js mode
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId, onCodeChange }) => {
    // here we Use useRef to Mainpualte The Dom At Run time 
    // editorRef is refering to Text area that we Have Created at last


    const editorRef = useRef(null);
    useEffect(() => {
        async function init() {
            // we Attach This Text are to CodeMirror so that All the Data of Text Area Gets To the Code Mirror
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    // to Enable Js Mode
                    mode: { name: 'javascript', json: true },
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );

            // now using the evenets of Code Mirror
            // "change is code mirror Event"
            editorRef.current.on('change', (instance, changes) => {
                // (instance and changes) provided by codeMirror
                // here we get multiple key value pairs in origin object

                // origin: type by which data inputed 
                // cut, paste, +input(by typing) and many others

                const { origin } = changes;

                // get all the content of Editor
                const code = instance.getValue();
                onCodeChange(code);

                // editorRef.current.setValue("const a=10; console.log(a)")
                // by using setvalue Method We can dymaically put data to Editor without 
                // writing manually
                if (origin !== 'setValue') {
                    // to emit the code Chnages to all The Other Sockets or Clients
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId, //room to which we send
                        code,  //cahnges Code 
                    });

                    // it will get Listen on Server and Emited by sever to all the Room Sockets
                }
            });
        }
        init();
    }, []);

    // here we use 2nd useEffect to Ensure that socketRef constains the Value and Updated on value chnage
    useEffect(() => {
        if (socketRef.current) {
            // Listen the Event and Get the data from server and Update The Editor
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                if (code !== null) {
                    editorRef.current.setValue(code);
                }
            });
        }

        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE);
        };
    }, [socketRef.current]);

    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;
