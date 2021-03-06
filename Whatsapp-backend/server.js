import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from "pusher";
import cors from "cors";

//app config
const app= express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: '1096346',
    key: 'a186f6d47c58213eb651',
    secret: '4907dd901ac88e7c2546',
    cluster: 'ap2',
    encrypted: true
});
//Middleware
app.use(express.json());
app.use(cors());


//database config
const connection_url='mongodb+srv://ryanmaruf:01676324799Ryanmaruf@cluster0.ij0ay.mongodb.net/whatsappDB?retryWrites=true&w=majority';
mongoose.connect(connection_url,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true,
});

const db= mongoose.connection;
 db.once('open',()=>{
    console.log("DB is connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change',(change)=>{
        console.log("A change Occured",change);

        if(change.operationType == 'insert'){
            const  messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',
                {
                        name:messageDetails.name,
                        message:messageDetails.message,
                        timestamp: messageDetails.timestamp,
                        received: messageDetails.received,
            });
        }else{
            console.log("Error triggering Pusher")
        }
    });
});


//api route
app.get('/',(req,res)=>res.status(200).send('hello hhh'));


//get request
app.get("/messages/sync",(req,res)=>{
    Messages.find((err,data)=> {
        if(err) {
            res.status(500).send(err);
        }else{
            res.status(200).send(data);
        }
    });
});



//post request
app.post("/messages/new",(req,res)=>{
    const dbMessage = req.body;
    Messages.create(dbMessage,(err,data)=> {
        if(err) {
            res.status(500).send(err);
        }else{
            res.status(201).send(data);
        }
    });
});
//listen
app.listen(port,()=>console.log(`Listening on localhost :${port}`));