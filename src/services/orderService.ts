import bodyParser = require("body-parser");

let MongoClient = require('mongodb').MongoClient;
let url = "mongodb://localhost:27017/";
let ObjectId = require('mongodb').ObjectId;

export default {    

    //cancel order
    cancelOrder: (req:any, res:any) => {
        try {
            if(req.body.id != undefined && req.headers.authcode != undefined) {

                let stop = false;

                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    let dbo = db.db("kino");
          
                    const o_id = new ObjectId(req.body.id);

                    dbo.collection("order").findOne({ _id: o_id }, function(err:any, result:any) {
                        if (err){
                            stop = true;
                            res.status(411).send("order does not exist");
                        } else {

                            const o_userId = new ObjectId(result.user);
                            dbo.collection("users").findOne({ _id: o_userId }, function(err:any, result:any) {
                                if (err){
                                    stop = true;
                                    res.status(500).send("internal server error");
                                } else {
                                    if(result.authcode != req.headers.authcode) {
                                        stop = true;
                                        res.status(400).send("user is not allowed to cancel this order");
                                    }
                                }
                            });

                            if(!stop) {
                                let presentationId = result.presentationId;
                                const o_presentationId = new ObjectId(presentationId);
                                let allSeats = [{id: 0, booked: false}];
                                let bookedSeats = result.seats;
    
                                if(!stop) {
                                    dbo.collection("presentations").findOne({ _id: o_presentationId }, function(err2:any, result2:any) {
                                        if (err){
                                            stop = true;
                                            res.status(500).send("internal server error");
                                        } else {
                                            allSeats = result2.seats;
                                        }
                                    });
                                }
    
                                for(let a = 0; a < bookedSeats.length; a++) {
                                    for (let i = 0; i < allSeats.length; i++) {
                                        if (allSeats[i].id == bookedSeats[a]) {
                                            allSeats[i].booked = false;
                                        }
                                    }
                                }
    
                                const newSeats = { $set: { allSeats } };
                                
                                if(!stop) {
                                    dbo.collection("presentations").updateOne({ _id: o_id }, newSeats, function(err2:any, result2:any) {
                                        if (err2){
                                            stop = true;
                                            res.status(411).send("seats could not be released");
                                        }
                                    });
                                }
    
                                if(!stop) {
                                    dbo.collection("order").deleteOne({ _id: o_id }, function(err:any, result:any) {
                                        if (err){
                                            res.status(411).send("order could not be deleted");
                                        } else {
                                            res.status(200).send("order canceled");
                                        }
                                    });
                                }
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

    //get orders by user
    getOrdersByUser: (req:any, res:any) => {
        try {
            if(req.params.id != undefined) {
                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    let dbo = db.db("kino");
                    
                    dbo.collection("orders").find({ user: req.params.id }).toArray(function(err:any, result:any) {
                        if (err || result === null) {
                            res.status(411).send("could not find orders");
                        } else {
                            let r = {
                                text: "orders successfully requested",
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
    
    //get order by id
    getOrderById: (req:any, res:any) => {
        try {
            if(req.params.id != undefined) {
                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    let dbo = db.db("kino");
                    const o_id = new ObjectId(req.params.id);
                    
                    dbo.collection("orders").findOne({ _id: o_id }, function(err:any, result:any) {
                        if (err || result === null) {
                            res.status(411).send("could not find order");
                        } else {
                            let r = {
                                text: "order successfully requested",
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

}