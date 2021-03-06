import express from 'express';
import * as bodyParser from 'body-parser';
import userService from './services/userService';
import movieService from './services/movieService';
import presentationService from './services/presentationService';
import orderService from './services/orderService';

//express setup
const app = express();
app.use(bodyParser.json({
    limit: '50mb',
    verify(req: any, res, buf, encoding) {
        req.rawBody = buf;
    }
}));

//home route
app.get('/', (req, res) => res.send('Hello World!'));

//user routes
app.post('/registerUser', (req, res) => userService.registerUser(req, res));
app.get('/getUserById/:id', (req, res) => userService.getUserById(req, res));
app.post('/validateUser', (req, res) => userService.validateUser(req, res));
app.post('/updateUserById', (req, res) => userService.updateUserById(req, res));
app.post('/addAdressByUserId', (req, res) => userService.addAdressByUserId(req, res));
app.post('/deleteAddressById', (req, res) => userService.deleteAddressById(req, res));
app.post('/changePassword', (req, res) => userService.changePassword(req, res));

//movie routes
app.get('/getAllMovies', (req, res) => movieService.getAllMovies(req, res));
app.get('/getMovieById/:id', (req, res) => movieService.getMovieById(req, res));

//presentation routes
app.get('/getAllPresentations', (req, res) => presentationService.getAllPresentations(req, res));
app.get('/getPresentationById/:id', (req, res) => presentationService.getPresentationById(req, res));
app.post('/bookSeats', (req, res) => presentationService.bookSeats(req, res));
app.post('/createPresentation', (req, res) => presentationService.createPresentation(req, res));
app.post('/updatePresentationById', (req, res) => presentationService.updatePresentationById(req, res));
app.post('/deletePresentationById', (req, res) => presentationService.deletePresentationById(req, res));

//order routes
app.post('/cancelOrder', (req, res) => orderService.cancelOrder(req, res));
app.get('/getOrdersByUser/:id', (req, res) => orderService.getOrdersByUser(req, res));
app.get('/getOrderById/:id', (req, res) => orderService.getOrderById(req, res));

export {app};