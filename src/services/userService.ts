let MongoClient = require('mongodb').MongoClient;
let url = "mongodb://localhost:27017/";
let shajs = require('sha.js')
const { v4: uuidv4 } = require('uuid');
let ObjectId = require('mongodb').ObjectId; 

export default {    

    //register new user
    registerUser: (req:any, res:any) => {
        try {
            if(req.body.name != undefined && req.body.lastName != undefined && req.body.pw != undefined
                && req.body.email != undefined) {
                
                const data = req.body;
                
                if(data.pw.length < 9) {
                    res.status(411).send("pw must be longer than 9");
                } else {

                    const pw = shajs('sha256').update(data.pw).digest('hex')

                    MongoClient.connect(url, function(err:any, db:any) {
                        if (err) throw err;
                        let dbo = db.db("kino");
                        let myobj = { 
                            name: data.name,
                            lastName: data.lastName,
                            pw: pw,
                            email: data.email,
                            admin: false
                        };

                        dbo.collection("users").findOne({email: data.email}, function(err:any, result:any) {
                            if(result === null) {
                                dbo.collection("users").insertOne(myobj, function(err2:any, result2:any) {
                                    if (err2){
                                        res.status(411).send("database object could not be created");
                                    } else {
                                        let r = {
                                            text: "user created",
                                            data: {
                                                name: result2.ops[0].name,
                                                lastName: result2.ops[0].lastName,
                                                id: result2.ops[0]._id,
                                                email: result2.ops[0].email,
                                                addresses: result2.ops[0].addresses,
                                                admin: result2.ops[0].admin
                                            }
                                        }
                                        res.status(200).send(r);
                                    }
                                    db.close();
                                });
                            } else {
                                res.status(400).send("user alerady exists");
                            }
                        });
                    });
                }
            } else {
                res.status(406).send("please send all required attributes");
            }
        }catch(e) {
            res.status(500).send("internal server error");
        }
    },

    //get existing user by id
    getUserById: (req:any, res:any) => {
        try {
            console.log(req.params.id)
            if(req.params.id != undefined && req.headers.authcode != undefined) {
                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    let dbo = db.db("kino");
                    const o_id = new ObjectId(req.params.id);
                    dbo.collection("users").findOne({_id: o_id, authcode: req.headers.authcode}, function(err:any, result:any) {
                        if (err || result === null){
                            res.status(411).send("could not find user");
                        } else {
                            let r = {
                                text: "user successfully requested",
                                data: {
                                    name: result.name,
                                    lastName: result.lastName,
                                    id: result._id,
                                    email: result.email,
                                    addresses: result.addresses,
                                    admin: result.admin
                                }
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
            
        }
    },

    //validate user
    validateUser: (req:any, res:any) => {
        try {

            if(req.body.pw != undefined && req.body.email != undefined) {

                const data = req.body;

                const pw = shajs('sha256').update(data.pw).digest('hex')

                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    let dbo = db.db("kino");
                    dbo.collection("users").findOne({email: data.email, pw: pw}, function(err:any, result:any) {
                        if (err || result === null){
                            res.status(411).send("could not find user");
                        } else {
                            const authcode = uuidv4();
                            const myquery = { _id: result._id};
                            const newvalues = { $set: { authcode: authcode } };
                            dbo.collection("users").updateOne(myquery, newvalues, function(err2:any, result2:any) {
                                if(err2) {
                                    res.status(500).send("internal server error");
                                }
                            });

                            let r = {
                                text: "user validated",
                                data: {
                                    name: result.name,
                                    lastName: result.lastName,
                                    id: result._id,
                                    email: result.email,
                                    authcode: authcode,
                                    addresses: result.addresses,
                                    admin: result.admin
                                }
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

    //update user by id
    updateUserById: (req:any, res:any) => {
        try {
            if(req.body.data != undefined && req.headers.authcode != undefined && req.body.id != undefined) {
                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    let dbo = db.db("kino");
                    const o_id = new ObjectId(req.body.id);
                    const data = req.body.data;
                    const newvalues = { $set: data };

                    dbo.collection("users").updateOne({_id: o_id, authcode: req.headers.authcode}, newvalues, function(err:any, result:any) {
                        if(err || result.matchedCount < 1) {
                            res.status(400).send("user could not be updated");
                        } else {
                            dbo.collection("users").findOne({_id: o_id}, function(err2:any, result2:any) {
                                if(err2 || result2 == null) {
                                    res.status(500).send("internal server error");
                                } else {
                                    let r = {
                                        text: "user updated",
                                        data: {
                                            name: result2.name,
                                            lastName: result2.lastName,
                                            id: result2._id,
                                            email: result2.email,
                                            addresses: result2.addresses,
                                            admin: result2.admin
                                        }
                                    }
                                    res.status(200).send(r);
                                }
                            });
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

    //add address by user id
    addAddressByUserId: (req:any, res:any) => {
        try {
            if(req.body.data != undefined && req.headers.authcode != undefined && req.body.id != undefined) {
                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    let dbo = db.db("kino");
                    const o_id = new ObjectId(req.body.id);

                    dbo.collection("users").findOne({_id: o_id}, function(err:any, result:any) {
                        if(err || result == null) {
                            res.status(500).send("internal server error");
                        } else {
                            const data = req.body.data;
                            const address = {
                                name: data.name,
                                lastName: data.lastName,
                                street: data.street,
                                number: data.number,
                                plz: data.plz,
                                city: data.city,
                                id: uuidv4()
                            }
                            let addresses = result.addresses;
                            if(addresses != undefined) {
                                addresses.push(address);
                            } else {
                                addresses = [address]
                            }
                            const newvalues = { $set: { addresses } };

                            dbo.collection("users").updateOne({_id: o_id, authcode: req.headers.authcode}, newvalues, function(err2:any, result2:any) {
                                if(err2 || result2.matchedCount < 1) {
                                    res.status(400).send("address could not be added");
                                } else {
                                    dbo.collection("users").findOne({_id: o_id}, function(err3:any, result3:any) {
                                        if(err3 || result3 == null) {
                                            res.status(500).send("internal server error");
                                        } else {
                                            let r = {
                                                text: "address added",
                                                data: {
                                                    name: result3.name,
                                                    lastName: result3.lastName,
                                                    id: result3._id,
                                                    email: result3.email,
                                                    addresses: result3.addresses,
                                                    admin: result3.admin
                                                }
                                            }
                                            res.status(200).send(r);
                                        }
                                    });
                                }
                                db.close();
                            });
                        }
                    });
                });   
            } else {
                res.status(406).send("please send all required attributes");
            }
        }catch(e) {
            res.status(500).send("internal server error");
        }
    },
    
    //delete address by id
    deleteAddressById: (req:any, res:any) => {
        try {
            if(req.body.data != undefined && req.headers.authcode != undefined && req.body.id != undefined) {
                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    let dbo = db.db("kino");
                    const o_id = new ObjectId(req.body.id);

                    dbo.collection("users").findOne({_id: o_id}, function(err:any, result:any) {
                        if(err || result == null) {
                            res.status(500).send("internal server error");
                        } else {
                            const id = req.body.data.id;

                            let addresses = result.addresses;
                            if(addresses != undefined) {
                                for (let i = addresses.length - 1; i >= 0; --i) {
                                    if (addresses[i].id == id) {
                                        addresses.splice(i,1);
                                    }
                                }

                                const newValues = { $set: { addresses } };

                                dbo.collection("users").updateOne({_id: o_id, authcode: req.headers.authcode}, newValues, function(err2:any, result2:any) {
                                    if(err2 || result2.matchedCount < 1) {
                                        res.status(400).send("address could not be added");
                                    } else {
                                        dbo.collection("users").findOne({_id: o_id}, function(err3:any, result3:any) {
                                            if(err3 || result3 == null) {
                                                res.status(500).send("internal server error");
                                            } else {
                                                let r = {
                                                    text: "address added",
                                                    data: {
                                                        name: result3.name,
                                                        lastName: result3.lastName,
                                                        id: result3._id,
                                                        email: result3.email,
                                                        addresses: result3.addresses,
                                                        admin: result3.admin
                                                    }
                                                }
                                                res.status(200).send(r);
                                            }
                                        });
                                    }
                                    db.close();
                                });

                            } else {
                                res.status(500).send("no addresses could be found");
                            }
                        }
                    });
                });   
            } else {
                res.status(406).send("please send all required attributes");
            }
        }catch(e) {
            res.status(500).send("internal server error");
        }
    },
    
    //change password
    changePassword: (req:any, res:any) => {
        try {
            if(req.body.data != undefined && req.headers.authcode != undefined && req.body.id != undefined) {
                const data = req.body.data;
                MongoClient.connect(url, function(err:any, db:any) {
                    if (err) throw err;
                    let dbo = db.db("kino");
                    const o_id = new ObjectId(req.body.id);
                    const oldPw = shajs('sha256').update(data.oldPassword).digest('hex')

                    dbo.collection("users").findOne({_id: o_id}, function(err:any, result:any) {
                        if(err || result == null) {
                            res.status(500).send("internal server error");
                        } else if (oldPw != result.pw){
                            res.status(401).send("password is wrong");
                        } else if (data.newPassword.length < 9) {
                            res.status(411).send("new password must be longer than 9");
                        } else {
                            const newPw = shajs('sha256').update(data.newPassword).digest('hex')

                            const newvalues = { $set: { pw: newPw } };

                            dbo.collection("users").updateOne({_id: o_id, authcode: req.headers.authcode}, newvalues, function(err2:any, result2:any) {
                                if(err2 || result2.matchedCount < 1) {
                                    res.status(400).send("address could not be added");
                                } else {
                                    dbo.collection("users").findOne({_id: o_id}, function(err3:any, result3:any) {
                                        if(err3 || result3 == null) {
                                            res.status(500).send("internal server error");
                                        } else {
                                            let r = {
                                                text: "password changed"
                                            }
                                            res.status(200).send(r);
                                        }
                                    });
                                }
                                db.close();
                            });

                        }
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