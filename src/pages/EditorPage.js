import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import ACTIONS from "../Actions";
import Client from "../components/Client";
import Editor from "../components/Editor";
import InputOutputPage from "./InputOutputPage";
import { initSocket } from "../socket";
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from "react-router-dom";

// useLocation Hook from React routerDom to get the UserName That we Send from Home.js page  =>> state: {username, },

const EditorPage = () => {
    // store the Instance of User socketRef
    // useRef store the data presistent throught mUltiple Rendere But Doesnot Triggern
    // Re render On Data Change Unlike useState
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const inputcngRef = useRef(null);
    const outputcngRef = useRef(null);
    // useLocation Hook from React routerDom to get the UserName That we Send from Home.js page  =>> state: {username, },
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    // here we Get The List Of Clients whenever a New Client Or Socket Joined
    // So That We can Display The Clients
    const [clients, setClients] = useState([]);

    useEffect(() => {
        const init = async () => {
            // Get The New Client Instance
            // Calling This InitSocket Only Creates a Client
            socketRef.current = await initSocket();

            // Error Handler For Connection
            // these Are Predefined Events => connect_error , connect_failed
            socketRef.current.on("connect_error", (err) => handleErrors(err));
            socketRef.current.on("connect_failed", (err) => handleErrors(err));

            function handleErrors(e) {
                // console.log('socket error', e);
                toast.error("Socket connection failed, try again later.");
                reactNavigator("/");
            }

            // Now AS soon As Client Instance Craeated We Emit A join event To Join Multiple Clients Under same Room
            // Listen This Join Evenet At backend
            socketRef.current.emit(ACTIONS.JOIN, {
                // send RoomId that we Genartead At Home.js
                // get the rooif from Url Params
                roomId,
                username: location.state?.username,
            });

            // Listening for New Socket joined event Triggerd By server
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    // Since we have Use .to() method to Emit The Event
                    // hence that event also available for the socket That Trigger that event
                    // to prevent this we are useing the if () logic
                    // if we Use .broadcast() method we dont Need to Do This
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        // console.log(`${username} joined`);
                    }
                    setClients(clients);

                    // this event is for Sync Code for the first time a new user join
                    // as of now as soon as we type any keywod on editor it will trigger the code change event
                    // but let say in senerio as two users are joined and something is written on editor now third user will not get that data until one of the connectd user write or do anty change on editoi
                    // as soon as we change it trigger the Chnage and all the other user gets upodated Change

                    // Now To get The Data on 1st timn we trigger the Evenet as soon as A new user Join

                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        // current Value
                        code: codeRef.current,
                        inputChange: inputcngRef.current,
                        outputChange: outputcngRef.current,
                        socketId,
                    });
                    // now listen the event on server and update that partcular client editor data on basic of its Sockte id
                }
            );

            // Listening for  disconnected Emit by Server when the user Close it browser of manually leave the Room
            socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
                toast.error(`${username} left the room.`);
                // Update The Client List
                setClients((prev) => {
                    return prev.filter((client) => client.socketId !== socketId);
                });
            });
        };
        init();
        // Cleanup Function to Clear the Memory as Soon as we leave
        return () => {
            socketRef.current.off(ACTIONS.JOINED); //to unsubscribe sockt io evenets we need to use off() method
            socketRef.current.off(ACTIONS.DISCONNECTED);
            socketRef.current.disconnect(); //disconnect the socket
        };
    }, []);

    async function copyRoomId() {
        try {
            // to copy room id to clipBoard
            await navigator.clipboard.writeText(roomId);
            toast.success("Room Id has been copied to your clipboard");
        } catch (err) {
            toast.error("Could not copy the Room ID");
            console.error(err);
        }
    }

    function leaveRoom() {
        // as soon as we leave we get removed from room
        reactNavigator("/");
    }

    // no UserName Then Redirect
    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">
            <div className="aside ">
                <div className="asideInner">
                    <div className="logo">
                        <img className="logoImage" src="/codeFlow.png" alt="logo" />
                    </div>
                    <h3 className="connected">Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            // Client Page Componenet
                            <Client key={client.socketId} username={client.username} />
                        ))}
                    </div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy Room Id
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="editorWrap">
                {/* Editor Page Component*/}
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={(code) => {
                        // get the code from Child as Arguemnt and Update the Chnage to the codeRef
                        codeRef.current = code;
                    }}
                />

                {/* to pass data fron Child TO Parent Componrent we need to use Prop but as a function so when in child component if the data changes that function gets called and update the state   
                  onCodeChange={(code) => {
                        codeRef.current = code;
                    }    */}
            </div>
            <div className="hoverArea"></div>
            <InputOutputPage
                codeRef={codeRef}
                socketRef={socketRef}
                roomId={roomId}
                onInputChange={(inputData) => {
                    // get the code from Child as Arguemnt and Update the Chnage to the codeRef
                    inputcngRef.current = inputData;
                }}
                onOutputChange={(outputData) => {
                    // get the code from Child as Arguemnt and Update the Chnage to the codeRef
                    outputcngRef.current = outputData;
                }}
            />
        </div>
    );
};

export default EditorPage;
