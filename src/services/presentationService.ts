var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var ObjectId = require('mongodb').ObjectId;

export default {    

    //get all presentations
    getAllPresentations: (req:any, res:any) => {
        try {
            MongoClient.connect(url, function(err:any, db:any) {
                if (err) throw err;
                var dbo = db.db("kino");
                
                dbo.collection("presentations").find({}).toArray(function(err:any, result:any) {
                    if (err || result === null) {
                        res.status(411).send("could not find presentations");
                    } else {
                        let r = {
                            text: "all presentations successfully requested",
                            data: result
                        }
                        res.status(200).send(r);
                    }
                    db.close();
                });
            });
        }catch(e) {
            res.status(406).send("please send all required attributes");
        }
    },
    
    //get presentation by id
    getPresentationById: (req:any, res:any) => {
        try {
            if(req.params.id != undefined) {

                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    var dbo = db.db("kino");
          
                    const o_id = new ObjectId(req.params.id);

                    dbo.collection("presentations").findOne({ _id: o_id }, function(err:any, result:any) {
                        if (err){
                            res.status(411).send("presentation could not be requested");
                        } else {
                            let r = {
                                text: "presentation requested",
                                data: result
                            }
                            res.status(200).send(r);
                        }
                        db.close();
                    });
                });
            } else {
                res.status(406).send("please send all required attributes");
            }
        }catch(e) {
            res.status(500).send("internal server error");
        }
    },

    //get presentation by movie id
    getPresentationByMovieId: (req:any, res:any) => {
        try {
            if(req.params.id != undefined) {

                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    var dbo = db.db("kino");
          
                    const o_id = new ObjectId(req.params.id);

                    dbo.collection("presentations").findOne({ _id: o_id }, function(err:any, result:any) {
                        if (err){
                            res.status(411).send("presentation could not be requested");
                        } else {
                            let r = {
                                text: "presentation requested",
                                data: result
                            }
                            res.status(200).send(r);
                        }
                        db.close();
                    });
                });
            } else {
                res.status(406).send("please send all required attributes");
            }
        }catch(e) {
            res.status(500).send("internal server error");
        }
    },
    
    //book seats
    bookSeats: (req:any, res:any) => {
        try {
            if(req.body.seats != undefined && req.body.presentationId != undefined &&
                (req.body.userId || req.body.userData) != undefined && req.body.payment != undefined) {

                let stop = false;

                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    var dbo = db.db("kino");
          
                    const o_id = new ObjectId(req.body.presentationId);

                    dbo.collection("presentations").findOne({ _id: o_id }, function(err:any, result:any) {
                        if (err){
                            stop = true;
                            res.status(411).send("presentation could not be requested");
                        } else {
                            let seats = result.seats;
                            for(let a = 0; a < req.body.seats.length; a++) {
                                for (let i = 0; i < seats.length; i++) {
                                    if (seats[i].id == req.body.seats[a]) {
                                        if(seats[i].booked != true) {
                                            seats[i].booked = true;
                                        } else {
                                            stop = true;
                                            res.status(400).send("at least one seat was already booked");
                                        }
                                    }
                                }
                            }

                            const newSeats = { $set: { seats } };
                            
                            if(!stop) {
                                dbo.collection("presentations").updateOne({ _id: o_id }, newSeats, function(err2:any, result2:any) {
                                    if (err2){
                                        stop = true;
                                        res.status(411).send("seats could not be booked");
                                    }
                                });
                            }

                            let userSts;
                            let user;
                            if(req.body.userId != undefined) {
                                userSts = "registered";
                                user = req.body.userId;
                            } else {
                                userSts = "guest";
                                user = req.body.userData;
                            }

                            const myObj = {
                                seats: req.body.seats,
                                presentationId: req.body.presentationId,
                                userSts: userSts,
                                user: user,
                                payment: req.body.payment,
                                time: Date.now()
                            }
                            
                            if(!stop) {
                                dbo.collection("orders").insertOne(myObj, function(err3:any, result3:any) {
                                    if (err3){
                                        res.status(200).send("order placed");
                                    } else {
                                        res.status(400).send("order could not be placed");
                                    }
                                });                                
                            }

                        }
                        db.close();
                    });
                });
            } else {
                res.status(406).send("please send all required attributes");
            }
        }catch(e) {
            res.status(500).send("internal server error");
        }
    },

    //create presentation
    createPresentation: (req:any, res:any) => {
        try {
            if(req.body.presentationStart != undefined && req.body.presentationEnd != undefined
                && req.body.movieId != undefined && req.body.room != undefined && req.body.basicPrice != undefined) {

                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    var dbo = db.db("kino");

                    //get room id and load array from db to show seats

                    var myobj = { 
                        presentationStart: req.body.presentationStart,
                        presentationEnd: req.body.presentationEnd,
                        movieId: req.body.movieId,
                        basicPrice: req.body.basicPrice,
                        seats: [{id: 1, booked: false, price: 12.50, x: 0, y: 0}, {id: 2, booked: false, price: 12.50, x: 10, y: 0}]
                    };

                    dbo.collection("presentations").insertOne(myobj, function(err:any, result:any) {
                        if (err){
                            res.status(411).send("presentation could not be created");
                        } else {
                            res.status(200).send("presentation created");
                        }
                        db.close();
                    });
                });
            } else {
                res.status(406).send("please send all required attributes");
            }
        }catch(e) {
            res.status(500).send("internal server error");
        }
    },

    //update presentation by id
    updatePresentationById: (req:any, res:any) => {
        try {
            if(req.body.id != undefined && req.body.data.presentationStart != undefined && req.body.data.presentationEnd != undefined
                && req.body.data.movieId != undefined && req.body.basicPrice != undefined) {

                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    var dbo = db.db("kino");

                    var newVals = { 
                        presentationStart: req.body.data.presentationStart,
                        presentationEnd: req.body.data.presentationEnd,
                        movieId: req.body.data.movieId,
                        basicPrice: req.body.basicPrice
                    };

                    const newValues = { $set: newVals };

                    const o_id = new ObjectId(req.body.id);

                    dbo.collection("presentations").updateOne({ _id: o_id }, newValues, function(err:any, result:any) {
                        if (err){
                            res.status(411).send("presentation could not be updated");
                        } else {
                            res.status(200).send("presentation updated");
                        }
                        db.close();
                    });
                });
            } else {
                res.status(406).send("please send all required attributes");
            }
        }catch(e) {
            res.status(500).send("internal server error");
        }
    },
    
    //delete presentation by id
    deletePresentationById: (req:any, res:any) => {
        try {
            if(req.body.id != undefined) {

                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    var dbo = db.db("kino");

                    const o_id = new ObjectId(req.body.id);

                    dbo.collection("presentations").deleteOne({ _id: o_id }, function(err:any, result:any) {
                        if (err){
                            res.status(411).send("presentation could not be deleted");
                        } else {
                            res.status(200).send("presentation deleted");
                        }
                        db.close();
                    });
                });
            } else {
                res.status(406).send("please send all required attributes");
            }
        }catch(e) {
            res.status(500).send("internal server error");
        }
    },

}