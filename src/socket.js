// Socket initail Connection
import { io } from 'socket.io-client';


// Now When we Call this Function a New Client Instance is created and Returned 
// then We can Emit and Get The data
export const initSocket = async () => {
    // basic options from socket io website for socket Connection
    const options = {
        'force new connection': true,
        reconnectionAttempt: 'Infinity',
        timeout: 10000,
        transports: ['websocket'],
    };
    // this return the instance of A client 
    return io("/", options);
};
