const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const axios = require("axios")
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const cors = require("cors");
const bodyParser = require('body-parser');

const server = http.createServer(app);
const io = new Server(server);
app.use(cors({
    origin: "http://localhost:3000",
    method: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
}))
app.use(bodyParser.json())



// Here we Use This To Store The Clients That Joined a Room And For Each Room A New Object of userSocketMap Store That Users
// Values Are   {socket.id : userName}

// Storing this in Memory(Ram) if we Connect Db then we Can Store There 
// if Server Restart Then whole Data Gets Lost
const userSocketMap = {};


function getAllConnectedClients(roomId) {

    // To get all the Clients Connected To A Particular Room we can get it by
    //   io.sockets.adapter.rooms.get(roomId)  => it Will Return A Map Data Structure of All The SocketId that Is Present In that Praticular Room

    // Hence We Convert that Map Into Array Using Array.from() Method
    // io.sockets.adapter.rooms.get(roomId) || []  if No user is There or No Such Room Then For Safety we Just Return  An Empty Array []

    // Now From That Returned Array Of SocketId we use Map ans Return Each SocketId With its userName
    // we Get UserName From  => userSocketMap that we Alaready Stored a Client As Soon As it Connect to a Particuklar room

    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}


io.on('connection', (socket) => {
    // socket object conatins all the Details of client (socket) that is connected
    // console.log('socket connected', socket.id);

    // Listening the Join Event Triggerd From Client 
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        // store the Client
        userSocketMap[socket.id] = username;


        // Join that Client in Particular Room Id 
        socket.join(roomId);
        // join event Join the socket if Room already Exist 
        // if Not Then Create A New Room with roomId name And then join That fisrst User


        // Now when 1st Socket Join the Room Then there is No Issues 
        // But if let Say 4 th client(socket) Joined the  we Need to Notify those previous three client That a New Client Is Joined
        const clients = getAllConnectedClients(roomId);
        //here we Get Object with Each Socket Connect To that Particlar Room 
        // in this Form {{ socketId:"sdad3w874wdf",username: userSocketMap[socketId],}; }



        // Now As Soon As A New Client Joined we Send Notification To All the Other Sockets in The Room 
        clients.forEach(({ socketId }) => {
            // Now From Server WE emit a Event to and This Event is Listened At frontend
            // Using To WE Are Sending The Event To All the Sockets including Currently Joined Socket
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients, //Send List Of Clients
                username, // userName Who just Joined
                socketId: socket.id,
            });
            // Now Listen This Event To Frontend
        });
    });


    // Now as Soon As Code Changes In A Room it will Frontend Will emit a event 
    // that Event is Captured here and we Again Emit the data to all the Other 
    // Sockets in that Particluar Room 
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        //send data to all connected Clients
        // here we use Socket.in() beause we Want to send The Data to the room which also conatains That particular User (socket)

        // if we do io.to(roomid) it will send the data to all the Clients in that room
        // including the Editing Client Itself

        // socket.in(roomId) means it works As broadcast and Send the data Excluding 
        //Self
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });
    socket.on(ACTIONS.INPUT_CNG, ({ roomId, inputData }) => {
        //send data to all connected Clients
        // here we use Socket.in() beause we Want to send The Data to the room which also conatains That particular User (socket)

        // if we do io.to(roomid) it will send the data to all the Clients in that room
        // including the Editing Client Itself

        // socket.in(roomId) means it works As broadcast and Send the data Excluding 
        //Self
        
        socket.in(roomId).emit(ACTIONS.INPUT_CNG, { inputData });
    });
    socket.on(ACTIONS.OUTPUT_CNG, ({ roomId, outputData }) => {
        //send data to all connected Clients
        // here we use Socket.in() beause we Want to send The Data to the room which also conatains That particular User (socket)

        // if we do io.to(roomid) it will send the data to all the Clients in that room
        // including the Editing Client Itself

        // socket.in(roomId) means it works As broadcast and Send the data Excluding 
        //Self
        socket.in(roomId).emit(ACTIONS.OUTPUT_CNG, { outputData });
    });

    // Listening the Code update For 1st time For New Client
    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code, inputChange, outputChange }) => {
        // io.to() means From all the Socket Update this Specific Soket or send the data to specific Socket only
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
        io.to(socketId).emit(ACTIONS.SYNC_INPUT_OUTPUT, { inputChange, outputChange });
    });


    // Now Apply The Events On Each Socket like If its Gets Disconnect then update Frontend and Other Connected users etc 
    // as Soon as we leave the room or close the Browser or tab 
    // browser Notify this Event TO Emit
    // "disconnecting" Event  this event we Get before A User Is About to disconnect 

    socket.on('disconnecting', () => {
        // here we Get All The Rooms in which that partcular Socket (Client) Is Connected 

        const rooms = [...socket.rooms];  // here we Get RoomId or roomname
        // Now Disconnet that user From Each Room
        rooms.forEach((roomId) => {
            // to emit the Event For Particular Room socket.in() method Is used
            // here we emit the Duisconect evenet for that Socket
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });

        delete userSocketMap[socket.id];
        // socket.leave to left the Room 
        socket.leave();
    });
});
app.post('/compile', async (req, res) => {
    const { language, code, input, version } = req.body;
  
    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    try {
        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {

            language: language,
            version: version,
            files: [
                {

                    "content": code
                }
            ],
            stdin: input

        });
        
        res.json({
            output: response.data.run.output || 'No output returned',
            stderr: response.data.run.stderr || ''
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Compilation failed' });
    }
});

app.use(express.static('build'));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});




const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
