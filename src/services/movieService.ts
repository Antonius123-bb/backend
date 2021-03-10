let MongoClient = require('mongodb').MongoClient;
let url = "mongodb://localhost:27017/";
let ObjectId = require('mongodb').ObjectId;

export default {

    //get all movies
    getAllMovies: (req:any, res:any) => {
        try {
            MongoClient.connect(url, function(err:any, db:any) {
                if (err) throw err;
                let dbo = db.db("kino");
                
                dbo.collection("movies").find({}).toArray(function(err:any, result:any) {
                    if (err || result === null) {
                        res.status(411).send("could not find movies");
                    } else {
                        let r = {
                            text: "all movies successfully requested",
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
    
    //get movie by id
    getMovieById: (req:any, res:any) => {
        try {
            if(req.params.id != undefined) {
                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    let dbo = db.db("kino");
                    let o_id = "";
                    try {
                        o_id = new ObjectId(req.params.id);
                    } catch(e) {}
                    
                    dbo.collection("movies").findOne({ _id: o_id }, function(err:any, result:any) {
                        console.log(result)
                        if (err || result === null) {
                            res.status(411).send("could not find movies");
                        } else {
                            let r = {
                                text: "movies successfully requested",
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
    }

}