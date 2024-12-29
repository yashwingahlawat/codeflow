import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import ACTIONS from '../Actions';
import VERSION from '../Version';
const InputOutputPage = ({ codeRef, onInputChange, onOutputChange, socketRef, roomId }) => {
    const [inputData, setInputData] = useState('');
    const [outputData, setOutputData] = useState('');
    const [version, setVersion] = useState('10.2.0');
    const [lang, setLang] = useState("c++");
    const skipEmitRef = useRef({ input: false, output: false });

    const handleLangSelect = (e) => {
        setLang(e.target.value);
        setVersion(VERSION[e.target.value]);
    };
    // console.log(`lanuage${lang} version ${version}`)
    // Emit changes only when inputData changes and skipEmitRef is false
    useEffect(() => {
        if (socketRef.current && !skipEmitRef.current.input) {
            socketRef.current.emit(ACTIONS.INPUT_CNG, { roomId, inputData });
        }
        skipEmitRef.current.input = false; // Reset after emission
    }, [inputData, socketRef.current, roomId]);

    // Emit changes only when outputData changes and skipEmitRef is false
    useEffect(() => {
        if (socketRef.current && !skipEmitRef.current.output) {
            socketRef.current.emit(ACTIONS.OUTPUT_CNG, { roomId, outputData });
        }
        skipEmitRef.current.output = false; // Reset after emission
    }, [outputData, socketRef.current, roomId]);

    const handleInput = (e) => {
        setInputData(e.target.value);
    };

    const handleOutput = (e) => {
        setOutputData(e.target.value);
    };

    useEffect(() => {
        onInputChange(inputData);
    }, [inputData, onInputChange]);

    useEffect(() => {
        onOutputChange(outputData);
    }, [outputData, onOutputChange]);

    const handleCompileCode = async () => {
        const code = codeRef.current;
        try {
            const response = await axios.post('/compile', {
                language: lang,
                code: code,
                input: inputData,
                version:version
            }, {
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            setOutputData(response.data.output || response.data.stderr || 'No output');
        } catch (error) {
            console.error('Error:', error);
            setOutputData('Compilation error.');
        }
    };

    // Listen for input changes from the server and update only if the data is different
    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.INPUT_CNG, ({ inputData: newInputData }) => {
                if (newInputData !== inputData) {
                    skipEmitRef.current.input = true; // Prevent re-emission
                    setInputData(newInputData);
                }
            });
        }

        return () => {
            socketRef.current.off(ACTIONS.INPUT_CNG);
        };
    }, [inputData, socketRef.current]);

    // Listen for output changes from the server and update only if the data is different
    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.OUTPUT_CNG, ({ outputData: newOutputData }) => {
                if (newOutputData !== outputData) {
                    skipEmitRef.current.output = true; // Prevent re-emission
                    setOutputData(newOutputData);
                }
            });
        }

        return () => {
            socketRef.current.off(ACTIONS.OUTPUT_CNG);
        };
    }, [outputData, socketRef.current]);

    useEffect(() => {
        if (socketRef.current) {
            // Listen for the sync event and update the input/output data
            socketRef.current.on(ACTIONS.SYNC_INPUT_OUTPUT, ({ inputChange, outputChange }) => {
                if (inputChange !== null) {
                    setInputData(inputChange);
                }
                if (outputChange !== null) {
                    setOutputData(outputChange);
                }
            });
        }

        // Cleanup by removing the SYNC_INPUT_OUTPUT listener
        return () => {
            socketRef.current.off(ACTIONS.SYNC_INPUT_OUTPUT);
        };
    }, [socketRef.current]);

    return (
        <div className="slideableComponent">
            <div>
                <div className="inputControls">
                    <select className="languageSelect" onChange={handleLangSelect}>
                        <option value="c++">C++</option>
                        <option value="java">Java</option>
                        <option value="python">Python</option>
                        <option value="go">go</option>
                        <option value="javascript">JavaScript</option>
                        <option value="c">C</option>
                        <option value="bash">bash</option>
                        <option value="cobol">cobol</option>
                        <option value="dart">dart</option>
                        <option value="dash">dash</option>
                        <option value="typescript">typescript</option>
                        <option value="csharp.net">C#</option>
                        <option value="elixir">elixir</option>
                        <option value="kotlin">kotlin</option>
                        <option value="pascal">pascal</option>
                        <option value="perl">perl</option>
                        <option value="php">php</option>
                        <option value="powershell">powershell</option>
                        <option value="rust">rust</option>
                    </select>
                    <button className="runButton" onClick={handleCompileCode}>Run</button>
                </div>
            </div>
            <textarea className="inputArea" value={inputData} onChange={handleInput} placeholder="Input..."></textarea>
            <textarea className="outputArea" value={outputData} onChange={handleOutput} placeholder="Output..."></textarea>
        </div>
    );
};

export default InputOutputPage;



