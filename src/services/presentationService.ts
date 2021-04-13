let MongoClient = require('mongodb').MongoClient;
let url = "mongodb://localhost:27017/";
let ObjectId = require('mongodb').ObjectId;
let m = require('moment');

import { room2 } from "../constants";


export default {    

    //get all presentations
    getAllPresentations: (req:any, res:any) => {
        try {
            MongoClient.connect(url, function(err:any, db:any) {
                if (err) throw err;
                let dbo = db.db("kino");
                
                dbo.collection("presentations").find({}).sort( { presentationStart: 1 } ).toArray(function(err:any, result:any) {
                    if (err || result === null) {
                        res.status(411).send("could not find presentations");
                    } else {
                        let resultArr: any[] = []

                        if(result.length > 0) {
                            result.map((m:any) => {
                                if(m.presentationStart > new Date().getTime()) {
                                    resultArr.push(m);
                                }
                            })
                        }

                        let r = {
                            text: "presentation requested",
                            data: resultArr
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
                    let dbo = db.db("kino");
          
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
                    let dbo = db.db("kino");

                    dbo.collection("presentations").find({ movieId: req.params.id }).sort( { presentationStart: 1 } ).toArray(function(err:any, result:any) {
                        if (err){
                            res.status(411).send("presentation could not be requested");
                        } else {

                            let resultArr: any[] = []

                            if(result.length > 0) {
                                result.map((m:any) => {
                                    if(m.presentationStart > new Date().getTime()) {
                                        resultArr.push(m);
                                    }
                                })
                            }

                            let r = {
                                text: "presentation requested",
                                data: resultArr
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
                    let dbo = db.db("kino");
          
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
                                        res.status(400).send("order could not be placed");
                                    } else {
                                        res.status(200).send("order placed");
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
    createPresentation: async(req:any, res:any) => {
        const db = await MongoClient.connect(url, { useNewUrlParser: true })
                        .catch((err:any) => {  });

        try {
            if(req.body.presentationStart != undefined && req.body.movieId != undefined 
                && req.body.basicPrice != undefined && req.body.roomId != undefined && req.body.threeD != undefined) {
                    let stop = false;
                
                    let dbo = db.db("kino");

                    let o_id = "";
                    try {
                        o_id = new ObjectId(req.body.movieId);
                    } catch(e) {}

                    //get duration to calc endTime
                    let result = await dbo.collection("movies").findOne({ _id: o_id });

                    const presentationStart = new Date(req.body.presentationStart).getTime();
                    const presentationEnd = new Date(req.body.presentationStart).getTime() + m.duration(result.duration).asMinutes() * 60000 ;

                    //get room id and load array from db to show seats
                    let myobj = { 
                        presentationStart: presentationStart,
                        presentationEnd: presentationEnd,
                        movieId: req.body.movieId,
                        basicPrice: req.body.basicPrice,
                        roomId: req.body.roomId,
                        threeD: req.body.threeD,
                        seats: [{id: 1, booked: false, price: 12.50, x: 0, y: 0}, {id: 2, booked: false, price: 12.50, x: 10, y: 0}]
                    };

                    dbo.collection("presentations").insertOne(myobj, function(err:any, result:any) {
                        if (err){
                            res.status(411).send("presentation could not be created");
                        } else {
                            res.status(200).send("presentation created");
                        }
                    });
            } else {
                res.status(406).send("please send all required attributes");
            }
        }catch(e) {
            res.status(500).send("internal server error");
        }finally{
            db.close();
        }
    },

    //update presentation by id
    updatePresentationById: async(req:any, res:any) => {
        const db = await MongoClient.connect(url, { useNewUrlParser: true })
                .catch((err:any) => {  });

        try {
            if(req.body.id != undefined && req.body.data.presentationStart != undefined
                && req.body.data.movieId != undefined) {

                let dbo = db.db("kino");

                let m_id = "";
                try {
                    m_id = new ObjectId(req.body.data.movieId);
                } catch(e) {}

                const seats = {
                    "seats": room2,
                    "basicprice": 10,
                    "categories": [
                        {
                            "name": "Parkett",
                            "upsell": 0
                        },
                        {
                            "name": "Loge",
                            "upsell": 3
                        },
                        {
                            "name": "Premium",
                            "upsell": 1.5
                        },
                        {
                            "name": "Loveseat",
                            "upsell": 8
                        },
                        {
                            "name": "Barrierefrei",
                            "upsell": -2
                        }
                    ],
                    "height": 500,
                    "width": 500
                };

                console.log("S", seats)

                //get duration to calc endTime
                let result = await dbo.collection("movies").findOne({ _id: m_id });

                const presentationStart = new Date(req.body.data.presentationStart).getTime();
                const presentationEnd = new Date(req.body.data.presentationStart).getTime() + m.duration(result.duration).asMinutes() * 60000 ;

                let newVals = { 
                    presentationStart: presentationStart,
                    presentationEnd: presentationEnd,
                    movieId: req.body.data.movieId,
                    seats: seats
                };

                const newValues = { $set: newVals };

                const o_id = new ObjectId(req.body.id);

                dbo.collection("presentations").updateOne({ _id: o_id }, newValues, function(err:any, result:any) {
                    if (err){
                        res.status(411).send("presentation could not be updated");
                    } else {
                        res.status(200).send("presentation updated");
                    }
                });
            } else {
                res.status(406).send("please send all required attributes");
            }
        }catch(e) {
            console.log(e)
            res.status(500).send("internal server error");
        }finally{
            db.close();
        }
    },
    
    //delete presentation by id
    deletePresentationById: (req:any, res:any) => {
        try {
            if(req.body.id != undefined) {

                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    let dbo = db.db("kino");

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