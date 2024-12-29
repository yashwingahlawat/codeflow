import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');
    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        // uuid package to randomly genetate a New Unique id for a Room 
        setRoomId(id);
        toast.success('Created a new room');
    };

    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error('Room Id & Username is required');
            return;
        }

        // Redirect to editor Page if we Have room No and user Name 
        navigate(`/editor/${roomId}`, {
            // in react Router We can also pass Data to nevigated Route 
            // Since in editor page have to display the User Name Also which user is connected So on ediitor page we dont have that data hence we need to pass it from here {state:{value,value,vales...}}
            state: {
                username,
            },
            // if we dont use this we need to store this using redux ,contect api, store in local storage or pass userame with route also etc.. 
        });
    };


    // To Login or we can say Enter the Editor on Click of Enter Button Also
    // we Just Need to Add a listerner for Key Press and Then handle that 
    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            // calling then Join Function
            joinRoom();
        }
    };
    return (
        <div className="homePageWrapper">
            <div className="formWrapper">
                <img
                    className="homePageLogo"
                    src="/codeFlow.png"
                    alt="codeflow-logo"
                />
                <h4 className="mainLabel">Paste Invitation Room Id...</h4>
                <div className="inputGroup">
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="Room Id"
                        onChange={(e) => setRoomId(e.target.value)}
                        value={roomId}
                        onKeyUp={handleInputEnter}
                    />
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="Username"
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                        onKeyUp={handleInputEnter}
                    />
                    <button className="btn joinBtn" onClick={joinRoom}>
                        Join
                    </button>
                    <span className="createInfo">
                        If you don't have an invite then create &nbsp;
                        <a
                            onClick={createNewRoom}
                            href=""
                            className="createNewBtn"
                        >
                            New room
                        </a>
                    </span>
                </div>
            </div>
            <footer>
                <h4>
                    Code, Collaborate, Compile—All in Real-Time.
                   
                </h4>
            </footer>
        </div>
    );
};

export default Home;
