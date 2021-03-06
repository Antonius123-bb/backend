import {app} from './app'
import {AddressInfo} from 'net'

//start on "npm start" and launch server
const server = app.listen(8081, () => {
    const {port, address} = server.address() as AddressInfo;
    console.log('Server listening on:','http://localhost:'+port);
});